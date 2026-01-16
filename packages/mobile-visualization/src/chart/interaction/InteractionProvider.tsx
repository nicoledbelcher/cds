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
  type ActiveItem,
  type ActiveItems,
  type ElementBounds,
  InteractionContext,
  type InteractionContextValue,
  type InteractionMode,
  type InteractionRegistry,
  type InteractionScope,
  type InteractionState,
  invertSerializableScale,
  type LinePath,
  type PointBounds,
  ScrubberContext,
  type ScrubberContextValue,
} from '../utils';
import { getPointOnSerializableScale } from '../utils/point';

const defaultInteractionScope: InteractionScope = {
  dataIndex: true,
  series: false,
};

export type InteractionProviderProps = {
  children: React.ReactNode;
  /**
   * Allows continuous gestures on the chart to continue outside the bounds of the chart element.
   */
  allowOverflowGestures?: boolean;
  /**
   * The interaction mode.
   * - 'none': Interaction disabled
   * - 'single': Single touch interaction (default)
   * - 'multi': Multi-touch interaction
   * @default 'single'
   */
  interaction?: InteractionMode;
  /**
   * Controls what aspects of the data can be interacted with.
   * @default { dataIndex: true, series: false }
   */
  interactionScope?: InteractionScope;
  /**
   * Controlled active item (for single mode).
   * - undefined: Uncontrolled mode
   * - null: Controlled mode with no active item (ignores user gestures)
   * - ActiveItem: Controlled mode with specific active item
   */
  activeItem?: ActiveItem | null;
  /**
   * Controlled active items (for multi mode).
   * - undefined: Uncontrolled mode
   * - []: Controlled mode with no active items (ignores user gestures)
   * - ActiveItems: Controlled mode with specific active items
   */
  activeItems?: ActiveItems;
  /**
   * Callback fired when the active item changes during interaction.
   * For single mode: receives `ActiveItem | undefined`
   * For multi mode: receives `ActiveItems`
   */
  onInteractionChange?: (state: InteractionState) => void;
  /**
   * Accessibility label for the chart.
   * - When a string: Used as a static label for the chart element
   * - When a function: Called with the active item to generate dynamic labels during interaction
   */
  accessibilityLabel?: string | ((activeItem: ActiveItem) => string);
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

  // Legacy props for backwards compatibility
  /**
   * @deprecated Use `interaction="single"` instead
   */
  enableScrubbing?: boolean;
  /**
   * @deprecated Use `onInteractionChange` instead
   */
  onScrubberPositionChange?: (index: number | undefined) => void;
};

/**
 * InteractionProvider manages chart interaction state and gesture handling for mobile.
 * It supports single and multi-touch interactions with configurable scope.
 */
export const InteractionProvider: React.FC<InteractionProviderProps> = ({
  children,
  allowOverflowGestures,
  interaction: interactionProp,
  interactionScope: scopeProp,
  activeItem: controlledActiveItem,
  activeItems: controlledActiveItems,
  onInteractionChange,
  accessibilityLabel,
  accessibilityMode = 'chunked',
  accessibilityChunkCount = 10,
  // Legacy props
  enableScrubbing,
  onScrubberPositionChange,
}) => {
  const chartContext = useCartesianChartContext();

  if (!chartContext) {
    throw new Error('InteractionProvider must be used within a ChartContext');
  }

  const { getXSerializableScale, getXAxis, dataLength } = chartContext;

  // Resolve interaction mode (with backwards compatibility)
  const interaction: InteractionMode = useMemo(() => {
    if (interactionProp !== undefined) return interactionProp;
    if (enableScrubbing !== undefined) return enableScrubbing ? 'single' : 'none';
    return 'single'; // Default to single
  }, [interactionProp, enableScrubbing]);

  const scope: InteractionScope = useMemo(
    () => ({ ...defaultInteractionScope, ...scopeProp }),
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
  // Note: Line hit testing would require Skia path parsing - not implemented yet
  const findSeriesAtPoint = useCallback(
    (touchX: number, touchY: number): string | null => {
      // Check bars first
      const hitBar = findBarAtPoint(touchX, touchY);
      if (hitBar) return hitBar.seriesId;

      // Check points
      const hitPoint = findPointAtTouch(touchX, touchY);
      if (hitPoint) return hitPoint.seriesId;

      // TODO: Add line hit testing using Skia path.contains()

      return null;
    },
    [findBarAtPoint, findPointAtTouch],
  );

  // ============================================================================

  // Determine if we're in controlled mode
  // null/[] means "controlled with no active item" - distinct from undefined (uncontrolled)
  const isControlled = controlledActiveItem !== undefined || controlledActiveItems !== undefined;

  // Use SharedValue for UI thread performance
  const internalActiveItem = useSharedValue<InteractionState>(
    interaction === 'multi' ? [] : undefined,
  );

  // The exposed activeItem SharedValue - returns controlled value or internal value
  const activeItem: SharedValue<InteractionState> = useMemo(() => {
    if (isControlled) {
      // Create a proxy that returns the controlled value but doesn't update internal state
      return {
        get value() {
          return interaction === 'multi' ? controlledActiveItems : controlledActiveItem;
        },
        set value(_newValue: InteractionState) {
          // In controlled mode, don't update - the gesture handlers will call onInteractionChange directly
        },
        addListener: internalActiveItem.addListener.bind(internalActiveItem),
        removeListener: internalActiveItem.removeListener.bind(internalActiveItem),
        modify: internalActiveItem.modify.bind(internalActiveItem),
      } as SharedValue<InteractionState>;
    }
    return internalActiveItem;
  }, [isControlled, interaction, controlledActiveItem, controlledActiveItems, internalActiveItem]);

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

  // Handle JS thread callback when active item changes
  const handleInteractionChangeJS = useCallback(
    (state: InteractionState) => {
      onInteractionChange?.(state);

      // Legacy callback support
      if (onScrubberPositionChange && interaction === 'single') {
        const singleState = state as ActiveItem | undefined;
        onScrubberPositionChange(singleState?.dataIndex ?? undefined);
      }
    },
    [onInteractionChange, onScrubberPositionChange, interaction],
  );

  // React to active item changes and call JS callback
  useAnimatedReaction(
    () => activeItem.value,
    (currentValue, previousValue) => {
      if (currentValue !== previousValue) {
        runOnJS(handleInteractionChangeJS)(currentValue);
      }
    },
    [handleInteractionChangeJS],
  );

  // Setter function for context - always fires callback, only updates internal state when uncontrolled
  const setActiveItem = useCallback(
    (newState: InteractionState) => {
      if (!isControlled) {
        internalActiveItem.value = newState;
      }
      onInteractionChange?.(newState);
    },
    [isControlled, internalActiveItem, onInteractionChange],
  );

  // Helper to create active item with optional series hit testing (runs on JS thread)
  const createActiveItemWithSeries = useCallback(
    (x: number, y: number, dataIndex: number | null): ActiveItem => {
      let seriesId: string | null = null;
      if (scope.series) {
        seriesId = findSeriesAtPoint(x, y);
      }
      return { dataIndex, seriesId };
    },
    [scope.series, findSeriesAtPoint],
  );

  // Create the long press pan gesture for single mode
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
              const newActiveItem = createActiveItemWithSeries(x, y, di);
              const currentItem = internalActiveItem.value as ActiveItem | undefined;
              if (
                newActiveItem.dataIndex !== currentItem?.dataIndex ||
                newActiveItem.seriesId !== currentItem?.seriesId
              ) {
                if (!isControlled) {
                  internalActiveItem.value = newActiveItem;
                }
                onInteractionChange?.(newActiveItem);
              }
            })(event.x, event.y, dataIndex);
          }
        })
        .onUpdate(function onUpdate(event) {
          const dataIndex = scope.dataIndex ? getDataIndexFromX(event.x) : null;
          // Series hit testing runs on JS thread
          runOnJS((x: number, y: number, di: number | null) => {
            const newActiveItem = createActiveItemWithSeries(x, y, di);
            const currentItem = internalActiveItem.value as ActiveItem | undefined;
            if (
              newActiveItem.dataIndex !== currentItem?.dataIndex ||
              newActiveItem.seriesId !== currentItem?.seriesId
            ) {
              if (!isControlled) {
                internalActiveItem.value = newActiveItem;
              }
              onInteractionChange?.(newActiveItem);
            }
          })(event.x, event.y, dataIndex);
        })
        .onEnd(function onEnd() {
          if (interaction !== 'none') {
            runOnJS(handleStartEndHaptics)();
            if (!isControlled) {
              internalActiveItem.value = undefined;
            }
            runOnJS(onInteractionChange ?? (() => {}))(undefined);
          }
        })
        .onTouchesCancelled(function onTouchesCancelled() {
          if (interaction !== 'none') {
            if (!isControlled) {
              internalActiveItem.value = undefined;
            }
            runOnJS(onInteractionChange ?? (() => {}))(undefined);
          }
        }),
    [
      allowOverflowGestures,
      handleStartEndHaptics,
      getDataIndexFromX,
      scope.dataIndex,
      createActiveItemWithSeries,
      internalActiveItem,
      interaction,
      isControlled,
      onInteractionChange,
    ],
  );

  // Helper to process touches and create active items (runs on JS thread)
  const processMultiTouches = useCallback(
    (touches: Array<{ x: number; y: number }>): ActiveItems => {
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
              internalActiveItem.value = items;
            }
            onInteractionChange?.(items);
          })(touches);
        })
        .onTouchesMove(function onTouchesMove(event) {
          const touches = event.allTouches.map((t) => ({ x: t.x, y: t.y }));
          runOnJS((touchData: Array<{ x: number; y: number }>) => {
            const items = processMultiTouches(touchData);
            if (!isControlled) {
              internalActiveItem.value = items;
            }
            onInteractionChange?.(items);
          })(touches);
        })
        .onTouchesUp(function onTouchesUp(event) {
          if (event.allTouches.length === 0) {
            runOnJS(handleStartEndHaptics)();
            if (!isControlled) {
              internalActiveItem.value = [];
            }
            runOnJS(onInteractionChange ?? (() => {}))([]);
          } else {
            const touches = event.allTouches.map((t) => ({ x: t.x, y: t.y }));
            runOnJS((touchData: Array<{ x: number; y: number }>) => {
              const items = processMultiTouches(touchData);
              if (!isControlled) {
                internalActiveItem.value = items;
              }
              onInteractionChange?.(items);
            })(touches);
          }
        })
        .onTouchesCancelled(function onTouchesCancelled() {
          if (!isControlled) {
            internalActiveItem.value = [];
          }
          runOnJS(onInteractionChange ?? (() => {}))([]);
        }),
    [
      allowOverflowGestures,
      handleStartEndHaptics,
      processMultiTouches,
      internalActiveItem,
      isControlled,
      onInteractionChange,
    ],
  );

  const gesture = interaction === 'multi' ? multiTouchGesture : singleTouchGesture;

  const contextValue: InteractionContextValue = useMemo(
    () => ({
      mode: interaction,
      scope,
      activeItem,
      setActiveItem,
      registerBar,
      unregisterBar,
      registerPoint,
      unregisterPoint,
      registerLine,
      unregisterLine,
    }),
    [
      interaction,
      scope,
      activeItem,
      setActiveItem,
      registerBar,
      unregisterBar,
      registerPoint,
      unregisterPoint,
      registerLine,
      unregisterLine,
    ],
  );

  // Derive scrubberPosition from internal active item for backwards compatibility
  const scrubberPosition = useDerivedValue<number | undefined>(() => {
    const state = internalActiveItem.value;
    if (state === null || state === undefined) return undefined;
    if (Array.isArray(state)) {
      // For multi mode, use first item's dataIndex
      return state[0]?.dataIndex ?? undefined;
    }
    return state.dataIndex ?? undefined;
  }, [internalActiveItem]);

  // Provide ScrubberContext for backwards compatibility
  const scrubberContextValue: ScrubberContextValue = useMemo(
    () => ({
      enableScrubbing: interaction !== 'none',
      scrubberPosition,
    }),
    [interaction, scrubberPosition],
  );

  // Helper to get label from accessibilityLabel (string or function)
  const getAccessibilityLabelForItem = useCallback(
    (item: ActiveItem): string => {
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
    if (interaction === 'none' || !accessibilityLabel || typeof accessibilityLabel === 'string') {
      return null;
    }

    const regions: Array<{
      key: string;
      flex: number;
      label: string;
      activeItem: ActiveItem;
    }> = [];

    if (accessibilityMode === 'chunked') {
      // Divide into chunks
      const chunkSize = Math.ceil(dataLength / accessibilityChunkCount);
      for (let i = 0; i < accessibilityChunkCount && i * chunkSize < dataLength; i++) {
        const startIndex = i * chunkSize;
        const endIndex = Math.min((i + 1) * chunkSize, dataLength);
        const chunkLength = endIndex - startIndex;
        const item: ActiveItem = { dataIndex: startIndex, seriesId: null };

        regions.push({
          key: `chunk-${i}`,
          flex: chunkLength,
          label: getAccessibilityLabelForItem(item),
          activeItem: item,
        });
      }
    } else if (accessibilityMode === 'item') {
      // Each data point is a region
      for (let i = 0; i < dataLength; i++) {
        const item: ActiveItem = { dataIndex: i, seriesId: null };
        regions.push({
          key: `item-${i}`,
          flex: 1,
          label: getAccessibilityLabelForItem(item),
          activeItem: item,
        });
      }
    }
    // Note: 'series' mode would require series info from context

    return regions;
  }, [
    interaction,
    accessibilityLabel,
    accessibilityMode,
    accessibilityChunkCount,
    dataLength,
    getAccessibilityLabelForItem,
  ]);

  const content = (
    <InteractionContext.Provider value={contextValue}>
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
                    internalActiveItem.value = region.activeItem;
                  }
                  onInteractionChange?.(region.activeItem);
                  // Clear after a short delay
                  setTimeout(() => {
                    if (!isControlled) {
                      internalActiveItem.value = undefined;
                    }
                    onInteractionChange?.(undefined);
                  }, 100);
                }}
                style={{ flex: region.flex }}
              />
            ))}
          </View>
        )}
      </ScrubberContext.Provider>
    </InteractionContext.Provider>
  );

  // Wrap with gesture handler only if interaction is enabled
  if (interaction !== 'none') {
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
