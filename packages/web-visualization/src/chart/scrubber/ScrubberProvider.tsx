import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useCartesianChartContext } from '../ChartProvider';
import {
  isCategoricalScale,
  ScrubberContext,
  type ScrubberContextValue,
  type ScrubbingMode,
} from '../utils';

export type ScrubberProviderProps = {
  children: React.ReactNode;
  /**
   * A reference to the root SVG element, where interaction event handlers will be attached.
   */
  svgRef: React.RefObject<SVGSVGElement> | null;
  /**
   * Enables scrubbing interactions.
   */
  enableScrubbing?: boolean;
  /**
   * The scrubbing mode.
   * - 'single': Single touch/pointer tracking (default)
   * - 'multi': Multiple touch tracking for comparison
   * @default 'single'
   */
  scrubbingMode?: 'single' | 'multi';
  /**
   * Callback fired when the scrubber position changes.
   * In single mode, receives a single index or undefined.
   * In multi mode, receives an array of indices or undefined.
   */
  onScrubberPositionChange?:
    | ((index: number | undefined) => void)
    | ((indices: (number | undefined)[] | undefined) => void);
};

/**
 * A component which encapsulates the ScrubberContext.
 * It depends on a ChartContext in order to provide accurate mouse tracking.
 */
export const ScrubberProvider: React.FC<ScrubberProviderProps> = ({
  children,
  svgRef,
  enableScrubbing,
  scrubbingMode = 'single',
  onScrubberPositionChange,
}) => {
  const chartContext = useCartesianChartContext();

  if (!chartContext) {
    throw new Error('ScrubberProvider must be used within a ChartContext');
  }

  const { getXScale, getXAxis, series } = chartContext;
  const [scrubberPosition, setScrubberPosition] = useState<number | undefined>(undefined);
  const [additionalScrubberPositions, setAdditionalScrubberPositions] = useState<
    (number | undefined)[]
  >([]);

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
          // We have numeric axis data - find the closest data point
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

  // Fire the callback based on the current mode
  const firePositionCallback = useCallback(
    (primary: number | undefined, additional: (number | undefined)[]) => {
      if (!onScrubberPositionChange) return;

      if (scrubbingMode === 'multi') {
        if (primary === undefined) {
          (onScrubberPositionChange as (indices: (number | undefined)[] | undefined) => void)(
            undefined,
          );
        } else {
          (onScrubberPositionChange as (indices: (number | undefined)[] | undefined) => void)([
            primary,
            ...additional,
          ]);
        }
      } else {
        (onScrubberPositionChange as (index: number | undefined) => void)(primary);
      }
    },
    [onScrubberPositionChange, scrubbingMode],
  );

  const handlePointerMove = useCallback(
    (clientX: number, target: SVGSVGElement) => {
      if (!enableScrubbing || !series || series.length === 0) return;

      const rect = target.getBoundingClientRect();
      const x = clientX - rect.left;

      const dataIndex = getDataIndexFromX(x);

      if (dataIndex !== scrubberPosition) {
        setScrubberPosition(dataIndex);
        firePositionCallback(dataIndex, additionalScrubberPositions);
      }
    },
    [
      enableScrubbing,
      series,
      getDataIndexFromX,
      scrubberPosition,
      additionalScrubberPositions,
      firePositionCallback,
    ],
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      const target = event.currentTarget as SVGSVGElement;
      handlePointerMove(event.clientX, target);
    },
    [handlePointerMove],
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!event.touches.length) return;
      if (!enableScrubbing || !series || series.length === 0) return;

      // Prevent scrolling while scrubbing
      event.preventDefault();

      const target = event.currentTarget as SVGSVGElement;
      const rect = target.getBoundingClientRect();

      // Always process the first touch as primary
      const primaryTouch = event.touches[0];
      const primaryX = primaryTouch.clientX - rect.left;
      const primaryDataIndex = getDataIndexFromX(primaryX);

      // Process additional touches in multi mode
      let newAdditionalPositions: (number | undefined)[] = [];
      if (scrubbingMode === 'multi' && event.touches.length > 1) {
        for (let i = 1; i < event.touches.length; i++) {
          const touch = event.touches[i];
          const touchX = touch.clientX - rect.left;
          const dataIndex = getDataIndexFromX(touchX);
          newAdditionalPositions.push(dataIndex);
        }
      }

      // Check if positions changed
      const primaryChanged = primaryDataIndex !== scrubberPosition;
      const additionalChanged =
        scrubbingMode === 'multi' &&
        (newAdditionalPositions.length !== additionalScrubberPositions.length ||
          newAdditionalPositions.some((pos, i) => pos !== additionalScrubberPositions[i]));

      if (primaryChanged || additionalChanged) {
        setScrubberPosition(primaryDataIndex);
        if (scrubbingMode === 'multi') {
          setAdditionalScrubberPositions(newAdditionalPositions);
        }
        firePositionCallback(primaryDataIndex, newAdditionalPositions);
      }
    },
    [
      enableScrubbing,
      series,
      getDataIndexFromX,
      scrubbingMode,
      scrubberPosition,
      additionalScrubberPositions,
      firePositionCallback,
    ],
  );

  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      if (!enableScrubbing || !event.touches.length) return;
      if (!series || series.length === 0) return;

      const target = event.currentTarget as SVGSVGElement;
      const rect = target.getBoundingClientRect();

      // Handle initial touch
      const primaryTouch = event.touches[0];
      const primaryX = primaryTouch.clientX - rect.left;
      const primaryDataIndex = getDataIndexFromX(primaryX);

      // Process additional touches in multi mode
      let newAdditionalPositions: (number | undefined)[] = [];
      if (scrubbingMode === 'multi' && event.touches.length > 1) {
        for (let i = 1; i < event.touches.length; i++) {
          const touch = event.touches[i];
          const touchX = touch.clientX - rect.left;
          const dataIndex = getDataIndexFromX(touchX);
          newAdditionalPositions.push(dataIndex);
        }
      }

      setScrubberPosition(primaryDataIndex);
      if (scrubbingMode === 'multi') {
        setAdditionalScrubberPositions(newAdditionalPositions);
      }
      firePositionCallback(primaryDataIndex, newAdditionalPositions);
    },
    [enableScrubbing, series, getDataIndexFromX, scrubbingMode, firePositionCallback],
  );

  const handlePointerLeave = useCallback(() => {
    if (!enableScrubbing) return;
    setScrubberPosition(undefined);
    setAdditionalScrubberPositions([]);
    firePositionCallback(undefined, []);
  }, [enableScrubbing, firePositionCallback]);

  const handleMouseLeave = handlePointerLeave;
  const handleTouchEnd = handlePointerLeave;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enableScrubbing) return;

      const xScale = getXScale();
      const xAxis = getXAxis();

      if (!xScale || !xAxis) return;

      const isBand = isCategoricalScale(xScale);

      // Determine the actual data indices we can navigate to
      let minIndex: number;
      let maxIndex: number;

      if (isBand) {
        // For categorical scales, use the categories
        const categories = xScale.domain?.() ?? xAxis.data ?? [];
        minIndex = 0;
        maxIndex = Math.max(0, categories.length - 1);
      } else {
        // For numeric scales, check if we have specific data points
        const axisData = xAxis.data;
        if (axisData && Array.isArray(axisData)) {
          // We have specific data points - use their indices
          minIndex = 0;
          maxIndex = Math.max(0, axisData.length - 1);
        } else {
          // Fall back to domain-based navigation for continuous scales without specific data
          const domain = xAxis.domain;
          minIndex = domain.min ?? 0;
          maxIndex = domain.max ?? 0;
        }
      }

      const currentIndex = scrubberPosition ?? minIndex;
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
          newIndex = undefined; // Clear highlighting
          break;
        default:
          return; // Don't handle other keys
      }

      if (newIndex !== scrubberPosition) {
        setScrubberPosition(newIndex);
        // Keyboard navigation only affects primary position
        firePositionCallback(newIndex, additionalScrubberPositions);
      }
    },
    [
      enableScrubbing,
      getXScale,
      getXAxis,
      scrubberPosition,
      additionalScrubberPositions,
      firePositionCallback,
    ],
  );

  const handleBlur = useCallback(() => {
    if (!enableScrubbing || scrubberPosition === undefined) return;
    setScrubberPosition(undefined);
    setAdditionalScrubberPositions([]);
    firePositionCallback(undefined, []);
  }, [enableScrubbing, scrubberPosition, firePositionCallback]);

  // Attach event listeners to SVG element
  useEffect(() => {
    if (!svgRef?.current || !enableScrubbing) return;

    const svg = svgRef.current;

    // Add event listeners
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
    enableScrubbing,
    handleMouseMove,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown,
    handleBlur,
  ]);

  const contextValue: ScrubberContextValue = useMemo(
    () => ({
      enableScrubbing: !!enableScrubbing,
      scrubbingMode,
      scrubberPosition,
      additionalScrubberPositions,
      onScrubberPositionChange: setScrubberPosition,
    }),
    [enableScrubbing, scrubbingMode, scrubberPosition, additionalScrubberPositions],
  );

  return <ScrubberContext.Provider value={contextValue}>{children}</ScrubberContext.Provider>;
};
