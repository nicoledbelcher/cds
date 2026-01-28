import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useCartesianChartContext } from '../ChartProvider';
import {
  HighlightContext,
  type HighlightContextValue,
  type HighlightedItem,
  type HighlightScope,
  isCategoricalScale,
  ScrubberContext,
  type ScrubberContextValue,
} from '../utils';

const defaultHighlightScope: HighlightScope = {
  dataIndex: true,
  series: false,
};

/**
 * Props for configuring chart highlight behavior.
 * Used by CartesianChart and other chart components.
 */
export type HighlightProps = {
  /**
   * Whether highlighting is enabled.
   * @default true
   */
  enableHighlighting?: boolean;
  /**
   * Controls what aspects of the data can be highlighted.
   * @default { dataIndex: true, series: false }
   */
  highlightScope?: HighlightScope;
  /**
   * Controlled highlight state.
   * - `undefined`: Uncontrolled mode (internal state is managed)
   * - `[]`: Controlled mode with no highlights (gestures still fire onHighlightChange)
   * - `HighlightedItem[]`: Controlled mode with specific highlighted items
   */
  highlight?: HighlightedItem[];
  /**
   * Callback fired when the highlight changes during interaction.
   * Always fires regardless of controlled/uncontrolled mode.
   */
  onHighlightChange?: (items: HighlightedItem[]) => void;
};

export type HighlightProviderProps = HighlightProps & {
  children: React.ReactNode;
  /**
   * A reference to the root SVG element, where interaction event handlers will be attached.
   */
  svgRef: React.RefObject<SVGSVGElement> | null;
  /**
   * Accessibility label for the chart.
   * - When a string: Used as a static label for the chart element
   * - When a function: Called with the highlighted item to generate dynamic labels during interaction
   */
  accessibilityLabel?: string | ((item: HighlightedItem) => string);
};

/**
 * HighlightProvider manages chart highlight state and input handling.
 * It supports multi-touch interactions with configurable scope.
 */
export const HighlightProvider: React.FC<HighlightProviderProps> = ({
  children,
  svgRef,
  enableHighlighting: enableHighlightingProp,
  highlightScope: scopeProp,
  highlight: controlledHighlight,
  onHighlightChange,
  accessibilityLabel,
}) => {
  const chartContext = useCartesianChartContext();

  if (!chartContext) {
    throw new Error('HighlightProvider must be used within a ChartContext');
  }

  const { getXScale, getXAxis, series } = chartContext;

  const enabled = enableHighlightingProp ?? true;

  const scope: HighlightScope = useMemo(
    () => ({ ...defaultHighlightScope, ...scopeProp }),
    [scopeProp],
  );

  // Determine if we're in controlled mode
  // [] means "controlled with no highlights" - distinct from undefined (uncontrolled)
  const isControlled = controlledHighlight !== undefined;

  // Internal state for uncontrolled mode
  const [internalHighlight, setInternalHighlight] = useState<HighlightedItem[]>([]);

  // Get the current highlight state (controlled or uncontrolled)
  const highlight: HighlightedItem[] = useMemo(() => {
    if (isControlled) {
      return controlledHighlight;
    }
    return internalHighlight;
  }, [isControlled, controlledHighlight, internalHighlight]);

  // Update highlight state
  const setHighlight = useCallback(
    (newHighlight: HighlightedItem[]) => {
      if (!isControlled) {
        setInternalHighlight(newHighlight);
      }
      onHighlightChange?.(newHighlight);
    },
    [isControlled, onHighlightChange],
  );

  // Convert X coordinate to data index
  const getDataIndexFromX = useCallback(
    (mouseX: number): number => {
      const xScale = getXScale();
      const xAxis = getXAxis();

      if (!xScale || !xAxis) return 0;

      if (isCategoricalScale(xScale)) {
        const categories = xScale.domain?.() ?? xAxis.data ?? [];
        const bandwidth = xScale.bandwidth?.() ?? 0;
        let closestIndex = 0;
        let closestDistance = Infinity;
        for (let i = 0; i < categories.length; i++) {
          const xPos = xScale(i);
          if (xPos !== undefined) {
            const distance = Math.abs(mouseX - (xPos + bandwidth / 2));
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
            const xPos = xScale(xValue);
            if (xPos !== undefined) {
              const distance = Math.abs(mouseX - xPos);
              if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = i;
              }
            }
          }
          return closestIndex;
        } else {
          const xValue = xScale.invert(mouseX);
          const dataIndex = Math.round(xValue);
          const domain = xAxis.domain;
          return Math.max(domain.min ?? 0, Math.min(dataIndex, domain.max ?? 0));
        }
      }
    },
    [getXScale, getXAxis],
  );

  // Find series at a given point (for series scope)
  const getSeriesIdFromPoint = useCallback(
    (_mouseX: number, _mouseY: number): string | null => {
      // TODO: Implement series detection based on proximity to data points
      // For now, return null (series scope not fully implemented)
      if (!scope.series) return null;
      return null;
    },
    [scope.series],
  );

  // Convert pointer position to HighlightedItem
  const getHighlightedItemFromPointer = useCallback(
    (clientX: number, clientY: number, target: SVGSVGElement): HighlightedItem => {
      const rect = target.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const dataIndex = scope.dataIndex ? getDataIndexFromX(x) : null;
      const seriesId = scope.series ? getSeriesIdFromPoint(x, y) : null;

      return { dataIndex, seriesId };
    },
    [scope.dataIndex, scope.series, getDataIndexFromX, getSeriesIdFromPoint],
  );

  // Track active pointers for multi-touch
  const activePointersRef = React.useRef<Map<number, { clientX: number; clientY: number }>>(
    new Map(),
  );

  // Handle pointer move (mouse - single pointer)
  const handlePointerMove = useCallback(
    (clientX: number, clientY: number, target: SVGSVGElement) => {
      if (!enabled || !series || series.length === 0) return;

      const newItem = getHighlightedItemFromPointer(clientX, clientY, target);

      // When series scope is enabled, preserve the existing seriesId
      const currentSeriesId = scope.series ? highlight[0]?.seriesId : null;
      const effectiveItem = {
        ...newItem,
        seriesId: currentSeriesId ?? newItem.seriesId,
      };

      if (
        highlight.length !== 1 ||
        highlight[0]?.dataIndex !== effectiveItem.dataIndex ||
        highlight[0]?.seriesId !== effectiveItem.seriesId
      ) {
        setHighlight([effectiveItem]);
      }
    },
    [enabled, series, scope.series, getHighlightedItemFromPointer, highlight, setHighlight],
  );

  // Handle multi-pointer update (touch)
  const updateMultiPointerState = useCallback(
    (target: SVGSVGElement) => {
      const items: HighlightedItem[] = Array.from(activePointersRef.current.values()).map(
        (pointer) => getHighlightedItemFromPointer(pointer.clientX, pointer.clientY, target),
      );

      setHighlight(items);
    },
    [getHighlightedItemFromPointer, setHighlight],
  );

  // Mouse event handlers
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      const target = event.currentTarget as SVGSVGElement;
      handlePointerMove(event.clientX, event.clientY, target);
    },
    [handlePointerMove],
  );

  const handleMouseLeave = useCallback(() => {
    if (!enabled) return;
    setHighlight([]);
  }, [enabled, setHighlight]);

  // Touch event handlers
  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      if (!enabled || !event.touches.length) return;

      const target = event.currentTarget as SVGSVGElement;

      // Track all touches
      for (let i = 0; i < event.touches.length; i++) {
        const touch = event.touches[i];
        activePointersRef.current.set(touch.identifier, {
          clientX: touch.clientX,
          clientY: touch.clientY,
        });
      }
      updateMultiPointerState(target);
    },
    [enabled, updateMultiPointerState],
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!enabled || !event.touches.length) return;
      event.preventDefault(); // Prevent scrolling while interacting

      const target = event.currentTarget as SVGSVGElement;

      // Update all touches
      for (let i = 0; i < event.touches.length; i++) {
        const touch = event.touches[i];
        activePointersRef.current.set(touch.identifier, {
          clientX: touch.clientX,
          clientY: touch.clientY,
        });
      }
      updateMultiPointerState(target);
    },
    [enabled, updateMultiPointerState],
  );

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (!enabled) return;

      // Remove ended touches
      for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        activePointersRef.current.delete(touch.identifier);
      }

      if (activePointersRef.current.size === 0) {
        setHighlight([]);
      } else {
        const target = event.currentTarget as SVGSVGElement;
        updateMultiPointerState(target);
      }
    },
    [enabled, setHighlight, updateMultiPointerState],
  );

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const xScale = getXScale();
      const xAxis = getXAxis();

      if (!xScale || !xAxis) return;

      const isBand = isCategoricalScale(xScale);

      // Determine navigation bounds
      let minIndex: number;
      let maxIndex: number;

      if (isBand) {
        const categories = xScale.domain?.() ?? xAxis.data ?? [];
        minIndex = 0;
        maxIndex = Math.max(0, categories.length - 1);
      } else {
        const axisData = xAxis.data;
        if (axisData && Array.isArray(axisData)) {
          minIndex = 0;
          maxIndex = Math.max(0, axisData.length - 1);
        } else {
          const domain = xAxis.domain;
          minIndex = domain.min ?? 0;
          maxIndex = domain.max ?? 0;
        }
      }

      const currentItem = highlight[0] ?? { dataIndex: null, seriesId: null };
      const currentIndex = currentItem.dataIndex ?? minIndex;
      const dataRange = maxIndex - minIndex;

      // Multi-step jump when shift is held (10% of data range, minimum 1, maximum 10)
      const multiSkip = event.shiftKey;
      const stepSize = multiSkip ? Math.min(10, Math.max(1, Math.floor(dataRange * 0.1))) : 1;

      let newIndex: number | undefined;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          newIndex = Math.max(minIndex, currentIndex - stepSize);
          break;
        case 'ArrowRight':
          event.preventDefault();
          newIndex = Math.min(maxIndex, currentIndex + stepSize);
          break;
        case 'Home':
          event.preventDefault();
          newIndex = minIndex;
          break;
        case 'End':
          event.preventDefault();
          newIndex = maxIndex;
          break;
        case 'Escape':
          event.preventDefault();
          setHighlight([]);
          return;
        default:
          return;
      }

      if (newIndex !== currentItem.dataIndex) {
        const newItem: HighlightedItem = {
          dataIndex: newIndex,
          seriesId: currentItem.seriesId,
        };
        setHighlight([newItem]);
      }
    },
    [enabled, getXScale, getXAxis, highlight, setHighlight],
  );

  const handleBlur = useCallback(() => {
    if (!enabled || highlight.length === 0) return;
    setHighlight([]);
  }, [enabled, highlight, setHighlight]);

  // Attach event listeners to SVG element
  useEffect(() => {
    if (!svgRef?.current || !enabled) return;

    const svg = svgRef.current;

    svg.addEventListener('mousemove', handleMouseMove);
    svg.addEventListener('mouseleave', handleMouseLeave);
    svg.addEventListener('touchstart', handleTouchStart, { passive: false });
    svg.addEventListener('touchmove', handleTouchMove, { passive: false });
    svg.addEventListener('touchend', handleTouchEnd);
    svg.addEventListener('touchcancel', handleTouchEnd);
    svg.addEventListener('keydown', handleKeyDown);
    svg.addEventListener('blur', handleBlur);

    return () => {
      svg.removeEventListener('mousemove', handleMouseMove);
      svg.removeEventListener('mouseleave', handleMouseLeave);
      svg.removeEventListener('touchstart', handleTouchStart);
      svg.removeEventListener('touchmove', handleTouchMove);
      svg.removeEventListener('touchend', handleTouchEnd);
      svg.removeEventListener('touchcancel', handleTouchEnd);
      svg.removeEventListener('keydown', handleKeyDown);
      svg.removeEventListener('blur', handleBlur);
    };
  }, [
    svgRef,
    enabled,
    handleMouseMove,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown,
    handleBlur,
  ]);

  // Update accessibility label when highlight changes
  useEffect(() => {
    if (!svgRef?.current || !accessibilityLabel) return;

    const svg = svgRef.current;

    // If it's a static string, always use it
    if (typeof accessibilityLabel === 'string') {
      svg.setAttribute('aria-label', accessibilityLabel);
      return;
    }

    // If it's a function, use it for dynamic labels during interaction
    if (!enabled) return;

    const currentItem = highlight[0];

    if (currentItem && currentItem.dataIndex !== null) {
      svg.setAttribute('aria-label', accessibilityLabel(currentItem));
    } else {
      svg.removeAttribute('aria-label');
    }
  }, [svgRef, enabled, highlight, accessibilityLabel]);

  const contextValue: HighlightContextValue = useMemo(
    () => ({
      enabled,
      scope,
      highlight,
      setHighlight,
    }),
    [enabled, scope, highlight, setHighlight],
  );

  // Provide ScrubberContext for backwards compatibility with Scrubber component
  // Derive scrubberPosition from first highlighted item's dataIndex
  const scrubberPosition = useMemo(() => {
    if (!enabled) return undefined;
    return highlight[0]?.dataIndex ?? undefined;
  }, [enabled, highlight]);

  const scrubberContextValue: ScrubberContextValue = useMemo(
    () => ({
      enableScrubbing: enabled,
      scrubberPosition,
      onScrubberPositionChange: (index: number | undefined) => {
        if (!enabled) return;
        if (index === undefined) {
          setHighlight([]);
        } else {
          setHighlight([{ dataIndex: index, seriesId: null }]);
        }
      },
    }),
    [enabled, scrubberPosition, setHighlight],
  );

  return (
    <HighlightContext.Provider value={contextValue}>
      <ScrubberContext.Provider value={scrubberContextValue}>{children}</ScrubberContext.Provider>
    </HighlightContext.Provider>
  );
};
