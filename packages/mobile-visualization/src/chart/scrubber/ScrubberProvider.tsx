import React, { useCallback, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { Haptics } from '@coinbase/cds-mobile/utils/haptics';

import { useCartesianChartContext } from '../ChartProvider';
import {
  invertSerializableScale,
  ScrubberContext,
  type ScrubberContextValue,
  type ScrubbingMode,
} from '../utils';
import { getPointOnSerializableScale } from '../utils/point';

export type ScrubberProviderProps = {
  children: React.ReactNode;
  /**
   * Allows continuous gestures on the chart to continue outside the bounds of the chart element.
   */
  allowOverflowGestures?: boolean;
  /**
   * Enables scrubbing interactions.
   */
  enableScrubbing?: boolean;
  /**
   * The scrubbing mode.
   * - 'single': Single touch tracking (default)
   * - 'multi': Multiple touch tracking for comparison
   * @default 'single'
   */
  scrubbingMode?: ScrubbingMode;
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
 * It depends on a ChartContext in order to provide accurate touch tracking.
 */
export const ScrubberProvider: React.FC<ScrubberProviderProps> = ({
  children,
  enableScrubbing,
  scrubbingMode = 'single',
  onScrubberPositionChange,
  allowOverflowGestures,
}) => {
  const chartContext = useCartesianChartContext();

  if (!chartContext) {
    throw new Error('ScrubberProvider must be used within a ChartContext');
  }

  const { getXSerializableScale, getXAxis } = chartContext;
  const scrubberPosition = useSharedValue<number | undefined>(undefined);
  const additionalScrubberPositions = useSharedValue<(number | undefined)[]>([]);

  // Store refs for values needed in worklets
  const scrubbingModeRef = useRef(scrubbingMode);
  scrubbingModeRef.current = scrubbingMode;

  const xAxis = useMemo(() => getXAxis(), [getXAxis]);
  const xScale = useMemo(() => getXSerializableScale(), [getXSerializableScale]);

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
          // We have numeric axis data - find the closest data point
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

  const handleStartEndHaptics = useCallback(() => {
    void Haptics.lightImpact();
  }, []);

  // Fire callbacks for single mode
  const fireSingleCallback = useCallback(
    (value: number | undefined) => {
      if (onScrubberPositionChange && scrubbingModeRef.current === 'single') {
        (onScrubberPositionChange as (index: number | undefined) => void)(value);
      }
    },
    [onScrubberPositionChange],
  );

  // Fire callbacks for multi mode
  const fireMultiCallback = useCallback(
    (primary: number | undefined, additional: (number | undefined)[]) => {
      if (onScrubberPositionChange && scrubbingModeRef.current === 'multi') {
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
      }
    },
    [onScrubberPositionChange],
  );

  // Animated reaction for single mode
  useAnimatedReaction(
    () => scrubberPosition.value,
    (currentValue, previousValue) => {
      if (
        scrubbingModeRef.current === 'single' &&
        onScrubberPositionChange !== undefined &&
        currentValue !== previousValue
      ) {
        runOnJS(fireSingleCallback)(currentValue);
      }
    },
    [fireSingleCallback],
  );

  // Animated reaction for multi mode - watches both primary and additional positions
  useAnimatedReaction(
    () => ({
      primary: scrubberPosition.value,
      additional: additionalScrubberPositions.value,
    }),
    (current, previous) => {
      if (scrubbingModeRef.current !== 'multi' || onScrubberPositionChange === undefined) return;

      const primaryChanged = current.primary !== previous?.primary;
      const additionalChanged =
        current.additional.length !== (previous?.additional.length ?? 0) ||
        current.additional.some((pos, i) => pos !== previous?.additional[i]);

      if (primaryChanged || additionalChanged) {
        runOnJS(fireMultiCallback)(current.primary, current.additional);
      }
    },
    [fireMultiCallback],
  );

  // Create the long press pan gesture with multi-touch support
  const longPressGesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(110)
        .shouldCancelWhenOutside(!allowOverflowGestures)
        .minPointers(1)
        .maxPointers(scrubbingMode === 'multi' ? 10 : 1)
        .onTouchesDown(function onTouchesDown(event) {
          runOnJS(handleStartEndHaptics)();

          if (event.allTouches.length > 0) {
            // Primary touch
            const primaryTouch = event.allTouches[0];
            const newPrimaryPosition = getDataIndexFromX(primaryTouch.x);
            scrubberPosition.value = newPrimaryPosition;

            // Additional touches for multi mode
            if (scrubbingModeRef.current === 'multi' && event.allTouches.length > 1) {
              const newAdditionalPositions: (number | undefined)[] = [];
              for (let i = 1; i < event.allTouches.length; i++) {
                const touch = event.allTouches[i];
                const dataIndex = getDataIndexFromX(touch.x);
                newAdditionalPositions.push(dataIndex);
              }
              additionalScrubberPositions.value = newAdditionalPositions;
            }
          }
        })
        .onTouchesMove(function onTouchesMove(event) {
          if (event.allTouches.length > 0) {
            // Primary touch
            const primaryTouch = event.allTouches[0];
            const newPrimaryPosition = getDataIndexFromX(primaryTouch.x);
            if (newPrimaryPosition !== scrubberPosition.value) {
              scrubberPosition.value = newPrimaryPosition;
            }

            // Additional touches for multi mode
            if (scrubbingModeRef.current === 'multi') {
              const newAdditionalPositions: (number | undefined)[] = [];
              for (let i = 1; i < event.allTouches.length; i++) {
                const touch = event.allTouches[i];
                const dataIndex = getDataIndexFromX(touch.x);
                newAdditionalPositions.push(dataIndex);
              }

              // Check if additional positions changed
              const currentAdditional = additionalScrubberPositions.value;
              const changed =
                newAdditionalPositions.length !== currentAdditional.length ||
                newAdditionalPositions.some((pos, i) => pos !== currentAdditional[i]);

              if (changed) {
                additionalScrubberPositions.value = newAdditionalPositions;
              }
            }
          }
        })
        .onTouchesUp(function onTouchesUp(event) {
          // Handle individual finger lifts in multi mode
          if (scrubbingModeRef.current === 'multi' && event.allTouches.length > 0) {
            // Primary touch
            const primaryTouch = event.allTouches[0];
            const newPrimaryPosition = getDataIndexFromX(primaryTouch.x);
            scrubberPosition.value = newPrimaryPosition;

            // Update additional touches
            const newAdditionalPositions: (number | undefined)[] = [];
            for (let i = 1; i < event.allTouches.length; i++) {
              const touch = event.allTouches[i];
              const dataIndex = getDataIndexFromX(touch.x);
              newAdditionalPositions.push(dataIndex);
            }
            additionalScrubberPositions.value = newAdditionalPositions;
          }
        })
        .onEnd(function onEnd() {
          if (enableScrubbing) {
            runOnJS(handleStartEndHaptics)();
            scrubberPosition.value = undefined;
            additionalScrubberPositions.value = [];
          }
        })
        .onTouchesCancelled(function onTouchesCancelled() {
          if (enableScrubbing) {
            scrubberPosition.value = undefined;
            additionalScrubberPositions.value = [];
          }
        }),
    [
      allowOverflowGestures,
      scrubbingMode,
      handleStartEndHaptics,
      getDataIndexFromX,
      scrubberPosition,
      additionalScrubberPositions,
      enableScrubbing,
    ],
  );

  const contextValue: ScrubberContextValue = useMemo(
    () => ({
      enableScrubbing: !!enableScrubbing,
      scrubbingMode,
      scrubberPosition,
      additionalScrubberPositions,
    }),
    [enableScrubbing, scrubbingMode, scrubberPosition, additionalScrubberPositions],
  );

  const content = (
    <ScrubberContext.Provider value={contextValue}>{children}</ScrubberContext.Provider>
  );

  // Wrap with gesture handler only if scrubbing is enabled
  if (enableScrubbing) {
    return <GestureDetector gesture={longPressGesture}>{content}</GestureDetector>;
  }

  return content;
};
