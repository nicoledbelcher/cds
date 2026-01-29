import React, { useCallback, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { Haptics } from '@coinbase/cds-mobile/utils/haptics';

import { useCartesianChartContext } from '../ChartProvider';
import {
  type ElementBounds,
  HighlightContext,
  type HighlightContextValue,
  type HighlightedItem,
  type HighlightScope,
  type InteractionRegistry,
  invertSerializableScale,
  type LinePath,
  type PointBounds,
  ScrubberContext,
  type ScrubberContextValue,
} from '../utils';
import { getPointOnSerializableScale } from '../utils/point';

export type HighlightProps = {
  /**
   * Whether highlighting is enabled.
   */
  enableHighlighting?: boolean;
  /**
   * Controls what aspects of the data can be highlighted.
   */
  highlightScope?: HighlightScope;
  /**
   * Pass a value to override the internal highlight state.
   */
  highlight?: HighlightedItem[];
  /**
   * Callback fired when highlighting changes during interaction.
   */
  onHighlightChange?: (items: HighlightedItem[]) => void;
};

export type HighlightProviderProps = HighlightProps & {
  children: React.ReactNode;
  /**
   * Allows continuous gestures on the chart to continue outside the bounds of the chart element.
   */
  allowOverflowGestures?: boolean;
  /**
   * Accessibility label for the chart.
   * - When a string: Used as a static label for the chart element
   * - When a function: Called with the highlighted item to generate dynamic labels during interaction
   */
  accessibilityLabel?: string | ((item: HighlightedItem) => string);
  /**
   * The accessibility mode for the chart.
   * - 'chunked': Divides chart into N accessible regions (default for line charts)
   * - 'item': Each data point is an accessible region (default for bar charts)
   * - 'series': Each series is an accessible region
   * @default 'chunked'
   */
  accessibilityMode?: 'chunked' | 'item' | 'series';
  /**
   * Number of accessible chunks when accessibilityMode is 'chunked'.
   * @default 10
   */
  accessibilityChunkCount?: number;
};

/**
 * HighlightProvider manages chart highlighting state and gesture handling for mobile.
 * It supports single and multi-touch interactions with configurable scope.
 */
export const HighlightProvider: React.FC<HighlightProviderProps> = ({
  children,
  allowOverflowGestures,
  enableHighlighting = false,
  highlightScope: scopeProp,
  highlight: controlledHighlight,
  onHighlightChange,
  accessibilityLabel,
  accessibilityMode = 'chunked',
  accessibilityChunkCount = 10,
}) => {
  const chartContext = useCartesianChartContext();

  if (!chartContext) {
    throw new Error('HighlightProvider must be used within a ChartContext');
  }

  const { getXSerializableScale, getXAxis, dataLength } = chartContext;

  const scope: HighlightScope = useMemo(
    () => ({
      dataIndex: scopeProp?.dataIndex ?? false,
      series: scopeProp?.series ?? false,
    }),
    [scopeProp],
  );

  // ============================================================================
  // Interaction Registry (for coordinate-based hit testing)
  // ============================================================================

  // Use ref to avoid re-renders when registering elements
  const registryRef = useRef<InteractionRegistry>({
    bars: [],
    points: [],
    lines: [],
  });

  // Register a bar element for hit testing
  const registerBar = useCallback((bounds: ElementBounds) => {
    // Add to registry (elements are stored in render order)
    registryRef.current.bars.push(bounds);
  }, []);

  // Unregister a bar element
  const unregisterBar = useCallback((seriesId: string, dataIndex: number) => {
    registryRef.current.bars = registryRef.current.bars.filter(
      (bar) => !(bar.seriesId === seriesId && bar.dataIndex === dataIndex),
    );
  }, []);

  // Register a point element for hit testing
  const registerPoint = useCallback((bounds: PointBounds) => {
    registryRef.current.points.push(bounds);
  }, []);

  // Unregister a point element
  const unregisterPoint = useCallback((seriesId: string, dataIndex: number) => {
    registryRef.current.points = registryRef.current.points.filter(
      (point) => !(point.seriesId === seriesId && point.dataIndex === dataIndex),
    );
  }, []);

  // Register a line path for hit testing
  const registerLine = useCallback((path: LinePath) => {
    // Replace existing line with same seriesId (path may update)
    registryRef.current.lines = registryRef.current.lines.filter(
      (line) => line.seriesId !== path.seriesId,
    );
    registryRef.current.lines.push(path);
  }, []);

  // Unregister a line path
  const unregisterLine = useCallback((seriesId: string) => {
    registryRef.current.lines = registryRef.current.lines.filter(
      (line) => line.seriesId !== seriesId,
    );
  }, []);

  // Find bar at touch point (iterates in reverse for correct z-order)
  const findBarAtPoint = useCallback((touchX: number, touchY: number): ElementBounds | null => {
    const bars = registryRef.current.bars;
    // Iterate in reverse order (last rendered = on top = checked first)
    for (let i = bars.length - 1; i >= 0; i--) {
      const bar = bars[i];
      if (
        touchX >= bar.x &&
        touchX <= bar.x + bar.width &&
        touchY >= bar.y &&
        touchY <= bar.y + bar.height
      ) {
        return bar;
      }
    }
    return null;
  }, []);

  // Find point at touch point
  const findPointAtTouch = useCallback(
    (touchX: number, touchY: number, touchTolerance: number = 10): PointBounds | null => {
      const points = registryRef.current.points;
      for (let i = points.length - 1; i >= 0; i--) {
        const point = points[i];
        const distance = Math.sqrt(Math.pow(touchX - point.cx, 2) + Math.pow(touchY - point.cy, 2));
        if (distance <= point.radius + touchTolerance) {
          return point;
        }
      }
      return null;
    },
    [],
  );

  // Find series at touch point (checks bars first, then points)
  const findSeriesAtPoint = useCallback(
    (touchX: number, touchY: number): string | null => {
      // Check bars first
      const hitBar = findBarAtPoint(touchX, touchY);
      if (hitBar) return hitBar.seriesId;

      // Check points
      const hitPoint = findPointAtTouch(touchX, touchY);
      if (hitPoint) return hitPoint.seriesId;

      return null;
    },
    [findBarAtPoint, findPointAtTouch],
  );

  // ============================================================================

  // Determine if we're in controlled mode
  const isControlled = controlledHighlight !== undefined;

  // Use SharedValue for UI thread performance
  const internalHighlight = useSharedValue<HighlightedItem[]>([]);

  // The exposed highlight SharedValue - returns controlled value or internal value
  const highlight: SharedValue<HighlightedItem[]> = useMemo(() => {
    if (isControlled) {
      // Create a proxy that returns the controlled value but doesn't update internal state
      return {
        get value() {
          return controlledHighlight ?? [];
        },
        set value(_newValue: HighlightedItem[]) {
          // In controlled mode, don't update - the gesture handlers will call onHighlightChange directly
        },
        addListener: internalHighlight.addListener.bind(internalHighlight),
        removeListener: internalHighlight.removeListener.bind(internalHighlight),
        modify: internalHighlight.modify.bind(internalHighlight),
      } as SharedValue<HighlightedItem[]>;
    }
    return internalHighlight;
  }, [isControlled, controlledHighlight, internalHighlight]);

  const xAxis = useMemo(() => getXAxis(), [getXAxis]);
  const xScale = useMemo(() => getXSerializableScale(), [getXSerializableScale]);

  // Convert X coordinate to data index (worklet-compatible)
  const getDataIndexFromX = useCallback(
    (touchX: number): number => {
      'worklet';

      if (!xScale || !xAxis) return 0;

      if (xScale.type === 'band') {
        const [domainMin, domainMax] = xScale.domain;
        const categoryCount = domainMax - domainMin + 1;
        let closestIndex = 0;
        let closestDistance = Infinity;

        for (let i = 0; i < categoryCount; i++) {
          const xPos = getPointOnSerializableScale(i, xScale);
          if (xPos !== undefined) {
            const distance = Math.abs(touchX - xPos);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = i;
            }
          }
        }
        return closestIndex;
      } else {
        // For numeric scales with axis data, find the nearest data point
        const axisData = xAxis.data;
        if (axisData && Array.isArray(axisData) && typeof axisData[0] === 'number') {
          const numericData = axisData as number[];
          let closestIndex = 0;
          let closestDistance = Infinity;

          for (let i = 0; i < numericData.length; i++) {
            const xValue = numericData[i];
            const xPos = getPointOnSerializableScale(xValue, xScale);
            if (xPos !== undefined) {
              const distance = Math.abs(touchX - xPos);
              if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = i;
              }
            }
          }
          return closestIndex;
        } else {
          const xValue = invertSerializableScale(touchX, xScale);
          const dataIndex = Math.round(xValue);
          const domain = xAxis.domain;
          return Math.max(domain.min ?? 0, Math.min(dataIndex, domain.max ?? 0));
        }
      }
    },
    [xAxis, xScale],
  );

  // Haptic feedback handlers
  const handleStartEndHaptics = useCallback(() => {
    void Haptics.lightImpact();
  }, []);

  // Handle JS thread callback when highlight changes
  const handleHighlightChangeJS = useCallback(
    (items: HighlightedItem[]) => {
      onHighlightChange?.(items);
    },
    [onHighlightChange],
  );

  // React to highlight changes and call JS callback
  useAnimatedReaction(
    () => highlight.value,
    (currentValue, previousValue) => {
      if (currentValue !== previousValue) {
        runOnJS(handleHighlightChangeJS)(currentValue);
      }
    },
    [handleHighlightChangeJS],
  );

  // Setter function for context - always fires callback, only updates internal state when uncontrolled
  const setHighlight = useCallback(
    (newItems: HighlightedItem[]) => {
      if (!isControlled) {
        internalHighlight.value = newItems;
      }
      onHighlightChange?.(newItems);
    },
    [isControlled, internalHighlight, onHighlightChange],
  );

  // Helper to create highlighted item with optional series hit testing (runs on JS thread)
  const createHighlightedItemWithSeries = useCallback(
    (x: number, y: number, dataIndex: number | null): HighlightedItem => {
      let seriesId: string | null = null;
      if (scope.series) {
        seriesId = findSeriesAtPoint(x, y);
      }
      return { dataIndex, seriesId };
    },
    [scope.series, findSeriesAtPoint],
  );

  // Create the long press pan gesture for single touch
  const singleTouchGesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(110)
        .shouldCancelWhenOutside(!allowOverflowGestures)
        .onStart(function onStart(event) {
          runOnJS(handleStartEndHaptics)();

          // Android does not trigger onUpdate when the gesture starts
          if (Platform.OS === 'android') {
            const dataIndex = scope.dataIndex ? getDataIndexFromX(event.x) : null;
            // Series hit testing runs on JS thread
            runOnJS((x: number, y: number, di: number | null) => {
              const newItem = createHighlightedItemWithSeries(x, y, di);
              const currentItems = internalHighlight.value;
              const currentItem = currentItems[0];
              if (
                newItem.dataIndex !== currentItem?.dataIndex ||
                newItem.seriesId !== currentItem?.seriesId
              ) {
                if (!isControlled) {
                  internalHighlight.value = [newItem];
                }
                onHighlightChange?.([newItem]);
              }
            })(event.x, event.y, dataIndex);
          }
        })
        .onUpdate(function onUpdate(event) {
          const dataIndex = scope.dataIndex ? getDataIndexFromX(event.x) : null;
          // Series hit testing runs on JS thread
          runOnJS((x: number, y: number, di: number | null) => {
            const newItem = createHighlightedItemWithSeries(x, y, di);
            const currentItems = internalHighlight.value;
            const currentItem = currentItems[0];
            if (
              newItem.dataIndex !== currentItem?.dataIndex ||
              newItem.seriesId !== currentItem?.seriesId
            ) {
              if (!isControlled) {
                internalHighlight.value = [newItem];
              }
              onHighlightChange?.([newItem]);
            }
          })(event.x, event.y, dataIndex);
        })
        .onEnd(function onEnd() {
          if (enableHighlighting) {
            runOnJS(handleStartEndHaptics)();
            if (!isControlled) {
              internalHighlight.value = [];
            }
            runOnJS(onHighlightChange ?? (() => {}))([]);
          }
        })
        .onTouchesCancelled(function onTouchesCancelled() {
          if (enableHighlighting) {
            if (!isControlled) {
              internalHighlight.value = [];
            }
            runOnJS(onHighlightChange ?? (() => {}))([]);
          }
        }),
    [
      allowOverflowGestures,
      handleStartEndHaptics,
      getDataIndexFromX,
      scope.dataIndex,
      createHighlightedItemWithSeries,
      internalHighlight,
      enableHighlighting,
      isControlled,
      onHighlightChange,
    ],
  );

  // Helper to process touches and create highlighted items (runs on JS thread)
  const processMultiTouches = useCallback(
    (touches: Array<{ x: number; y: number }>): HighlightedItem[] => {
      return touches.map((touch) => {
        const dataIndex = scope.dataIndex ? getDataIndexFromX(touch.x) : null;
        let seriesId: string | null = null;
        if (scope.series) {
          seriesId = findSeriesAtPoint(touch.x, touch.y);
        }
        return { dataIndex, seriesId };
      });
    },
    [scope.dataIndex, scope.series, getDataIndexFromX, findSeriesAtPoint],
  );

  // Create multi-touch gesture
  const multiTouchGesture = useMemo(
    () =>
      Gesture.Manual()
        .shouldCancelWhenOutside(!allowOverflowGestures)
        .onTouchesDown(function onTouchesDown(event) {
          runOnJS(handleStartEndHaptics)();

          // Extract touch coordinates for JS thread processing
          const touches = event.allTouches.map((t) => ({ x: t.x, y: t.y }));
          runOnJS((touchData: Array<{ x: number; y: number }>) => {
            const items = processMultiTouches(touchData);
            if (!isControlled) {
              internalHighlight.value = items;
            }
            onHighlightChange?.(items);
          })(touches);
        })
        .onTouchesMove(function onTouchesMove(event) {
          const touches = event.allTouches.map((t) => ({ x: t.x, y: t.y }));
          runOnJS((touchData: Array<{ x: number; y: number }>) => {
            const items = processMultiTouches(touchData);
            if (!isControlled) {
              internalHighlight.value = items;
            }
            onHighlightChange?.(items);
          })(touches);
        })
        .onTouchesUp(function onTouchesUp(event) {
          if (event.allTouches.length === 0) {
            runOnJS(handleStartEndHaptics)();
            if (!isControlled) {
              internalHighlight.value = [];
            }
            runOnJS(onHighlightChange ?? (() => {}))([]);
          } else {
            const touches = event.allTouches.map((t) => ({ x: t.x, y: t.y }));
            runOnJS((touchData: Array<{ x: number; y: number }>) => {
              const items = processMultiTouches(touchData);
              if (!isControlled) {
                internalHighlight.value = items;
              }
              onHighlightChange?.(items);
            })(touches);
          }
        })
        .onTouchesCancelled(function onTouchesCancelled() {
          if (!isControlled) {
            internalHighlight.value = [];
          }
          runOnJS(onHighlightChange ?? (() => {}))([]);
        }),
    [
      allowOverflowGestures,
      handleStartEndHaptics,
      processMultiTouches,
      internalHighlight,
      isControlled,
      onHighlightChange,
    ],
  );

  // Use single touch gesture by default (multi-touch can be enabled via context if needed)
  const gesture = singleTouchGesture;

  const contextValue: HighlightContextValue = useMemo(
    () => ({
      enabled: enableHighlighting,
      scope,
      highlight,
      setHighlight,
      registerBar,
      unregisterBar,
      registerPoint,
      unregisterPoint,
      registerLine,
      unregisterLine,
    }),
    [
      enableHighlighting,
      scope,
      highlight,
      setHighlight,
      registerBar,
      unregisterBar,
      registerPoint,
      unregisterPoint,
      registerLine,
      unregisterLine,
    ],
  );

  // Derive scrubberPosition from internal highlight for backwards compatibility
  const scrubberPosition = useDerivedValue<number | undefined>(() => {
    const items = internalHighlight.value;
    if (!items || items.length === 0) return undefined;
    return items[0]?.dataIndex ?? undefined;
  }, [internalHighlight]);

  // Provide ScrubberContext for backwards compatibility
  const scrubberContextValue: ScrubberContextValue = useMemo(
    () => ({
      enableScrubbing: enableHighlighting,
      scrubberPosition,
    }),
    [enableHighlighting, scrubberPosition],
  );

  // Helper to get label from accessibilityLabel (string or function)
  const getAccessibilityLabelForItem = useCallback(
    (item: HighlightedItem): string => {
      if (typeof accessibilityLabel === 'string') {
        return accessibilityLabel;
      }
      if (typeof accessibilityLabel === 'function') {
        return accessibilityLabel(item);
      }
      return '';
    },
    [accessibilityLabel],
  );

  // Generate accessibility regions based on mode
  const accessibilityRegions = useMemo(() => {
    // Only generate regions if we have a function label (for dynamic per-item labels)
    // Static string labels don't need regions
    if (!enableHighlighting || !accessibilityLabel || typeof accessibilityLabel === 'string') {
      return null;
    }

    const regions: Array<{
      key: string;
      flex: number;
      label: string;
      highlightedItem: HighlightedItem;
    }> = [];

    if (accessibilityMode === 'chunked') {
      // Divide into chunks
      const chunkSize = Math.ceil(dataLength / accessibilityChunkCount);
      for (let i = 0; i < accessibilityChunkCount && i * chunkSize < dataLength; i++) {
        const startIndex = i * chunkSize;
        const endIndex = Math.min((i + 1) * chunkSize, dataLength);
        const chunkLength = endIndex - startIndex;
        const item: HighlightedItem = { dataIndex: startIndex, seriesId: null };

        regions.push({
          key: `chunk-${i}`,
          flex: chunkLength,
          label: getAccessibilityLabelForItem(item),
          highlightedItem: item,
        });
      }
    } else if (accessibilityMode === 'item') {
      // Each data point is a region
      for (let i = 0; i < dataLength; i++) {
        const item: HighlightedItem = { dataIndex: i, seriesId: null };
        regions.push({
          key: `item-${i}`,
          flex: 1,
          label: getAccessibilityLabelForItem(item),
          highlightedItem: item,
        });
      }
    }

    return regions;
  }, [
    enableHighlighting,
    accessibilityLabel,
    accessibilityMode,
    accessibilityChunkCount,
    dataLength,
    getAccessibilityLabelForItem,
  ]);

  const content = (
    <HighlightContext.Provider value={contextValue}>
      <ScrubberContext.Provider value={scrubberContextValue}>
        {children}
        {accessibilityRegions && (
          <View pointerEvents="box-none" style={styles.accessibilityContainer}>
            {accessibilityRegions.map((region) => (
              <View
                key={region.key}
                accessible
                accessibilityLabel={region.label}
                accessibilityRole="button"
                onAccessibilityTap={() => {
                  // Always fire callback, only update internal state when not controlled
                  if (!isControlled) {
                    internalHighlight.value = [region.highlightedItem];
                  }
                  onHighlightChange?.([region.highlightedItem]);
                  // Clear after a short delay
                  setTimeout(() => {
                    if (!isControlled) {
                      internalHighlight.value = [];
                    }
                    onHighlightChange?.([]);
                  }, 100);
                }}
                style={{ flex: region.flex }}
              />
            ))}
          </View>
        )}
      </ScrubberContext.Provider>
    </HighlightContext.Provider>
  );

  // Wrap with gesture handler only if highlighting is enabled
  if (enableHighlighting) {
    return <GestureDetector gesture={gesture}>{content}</GestureDetector>;
  }

  return content;
};

const styles = StyleSheet.create({
  accessibilityContainer: {
    flexDirection: 'row',
    flex: 1,
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
});
