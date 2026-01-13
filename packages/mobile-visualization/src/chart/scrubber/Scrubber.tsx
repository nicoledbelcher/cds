import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
} from 'react';
import {
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@coinbase/cds-mobile';
import { type AnimatedProp, Group, Rect, type SkParagraph } from '@shopify/react-native-skia';

import { useCartesianChartContext } from '../ChartProvider';
import {
  ReferenceLine,
  type ReferenceLineBaseProps,
  type ReferenceLineLabelComponentProps,
} from '../line';
import type { ChartTextProps } from '../text';
import {
  accessoryFadeTransitionDelay,
  accessoryFadeTransitionDuration,
  type ChartInset,
  getPointOnSerializableScale,
  type ScrubbingMode,
  type Series,
  useScrubberContext,
} from '../utils';
import type { Transition } from '../utils/transition';

import { DefaultScrubberBeacon } from './DefaultScrubberBeacon';
import { DefaultScrubberLabel } from './DefaultScrubberLabel';
import {
  ScrubberBeaconGroup,
  type ScrubberBeaconGroupBaseProps,
  type ScrubberBeaconGroupProps,
  type ScrubberBeaconGroupRef,
} from './ScrubberBeaconGroup';
import {
  ScrubberBeaconLabelGroup,
  type ScrubberBeaconLabelGroupBaseProps,
  type ScrubberBeaconLabelGroupProps,
} from './ScrubberBeaconLabelGroup';

export type ScrubberBeaconRef = {
  /**
   * Triggers a single pulse animation.
   * Only works when the beacon is in idle state (not actively scrubbing).
   */
  pulse: () => void;
};

export type ScrubberBeaconProps = {
  /**
   * Id of the series.
   */
  seriesId: Series['id'];
  /**
   * Color of the beacon.
   */
  color?: AnimatedProp<string>;
  /**
   * X coordinate in data space.
   */
  dataX: AnimatedProp<number>;
  /**
   * Y coordinate in data space.
   */
  dataY: AnimatedProp<number>;
  /**
   * Whether the beacon is in idle state (not actively scrubbing).
   */
  isIdle: AnimatedProp<boolean>;
  /**
   * Pulse the beacon while it is at rest.
   */
  idlePulse?: boolean;
  /**
   * Whether animations are enabled.
   * @default true
   */
  animate?: boolean;
  /**
   * Transition configuration for beacon animations.
   */
  transitions?: {
    /**
     * Transition used for beacon position updates.
     * @default defaultTransition
     */
    update?: Transition;
    /**
     * Transition used for the pulse animation.
     * @default { type: 'timing', duration: 1600, easing: Easing.bezier(0.0, 0.0, 0.0, 1.0) }
     */
    pulse?: Transition;
    /**
     * Delay, in milliseconds between pulse transitions
     * when `idlePulse` is enabled.
     * @default 400
     */
    pulseRepeatDelay?: number;
  };
  /**
   * Opacity of the beacon.
   * @default 1
   */
  opacity?: AnimatedProp<number>;
};

export type ScrubberBeaconComponent = React.FC<
  ScrubberBeaconProps & { ref?: React.Ref<ScrubberBeaconRef> }
>;

export type ScrubberBeaconLabelProps = Pick<Series, 'color'> &
  Pick<
    ChartTextProps,
    'x' | 'y' | 'dx' | 'horizontalAlignment' | 'onDimensionsChange' | 'opacity' | 'font'
  > & {
    /**
     * Label for the series.
     */
    label: AnimatedProp<string>;
    /**
     * Id of the series.
     */
    seriesId: Series['id'];
  };
export type ScrubberBeaconLabelComponent = React.FC<ScrubberBeaconLabelProps>;

export type ScrubberLabelProps = ReferenceLineLabelComponentProps;
export type ScrubberLabelComponent = React.FC<ScrubberLabelProps>;

export type ScrubberBaseProps = Pick<ScrubberBeaconGroupBaseProps, 'idlePulse'> &
  Pick<ReferenceLineBaseProps, 'LineComponent' | 'LabelComponent' | 'labelElevated'> &
  Pick<ScrubberBeaconGroupProps, 'BeaconComponent'> &
  Pick<ScrubberBeaconLabelGroupProps, 'BeaconLabelComponent'> & {
    /**
     * Array of series IDs to highlight when scrubbing with scrubber beacons.
     * By default, all series will be highlighted.
     */
    seriesIds?: string[];
    /**
     * Hides the scrubber line.
     * @note This hides Scrubber's ReferenceLine including the label.
     */
    hideLine?: boolean;
    /**
     * Hides the overlay rect which obscures data beyond the scrubber position.
     */
    hideOverlay?: boolean;
    /**
     * Offset of the overlay rect relative to the drawing area.
     * Useful for when scrubbing over lines, where the stroke width would cause part of the line to be visible.
     * @default 2
     */
    overlayOffset?: number;
    /**
     * Minimum gap between beacon labels to prevent overlap.
     * Measured in pixels.
     */
    beaconLabelMinGap?: ScrubberBeaconLabelGroupBaseProps['labelMinGap'];
    /**
     * Horizontal offset for beacon labels from their beacon position.
     * Measured in pixels.
     */
    beaconLabelHorizontalOffset?: ScrubberBeaconLabelGroupBaseProps['labelHorizontalOffset'];
    /**
     * Label text displayed above the scrubber line.
     * Can be a static string or a function that receives the current dataIndex.
     * In multi mode with two positions, use `multiLabel` instead.
     */
    label?: string | SkParagraph | ((dataIndex: number) => string | SkParagraph);
    /**
     * Label text for multi-touch mode when two scrubber lines are shown.
     * Receives an array of dataIndices (sorted by value) and should return a range label.
     * The label will be centered between the two scrubber lines.
     * @example (indices) => `${formatDate(indices[0])} - ${formatDate(indices[1])}`
     */
    multiLabel?: (dataIndices: number[]) => string | SkParagraph;
    /**
     * Font style for the scrubber line label.
     */
    labelFont?: ChartTextProps['font'];
    /**
     * Bounds inset for the scrubber line label to prevent cutoff at chart edges.
     * @default { top: 4, bottom: 20, left: 12, right: 12 } when labelElevated is true, otherwise none
     */
    labelBoundsInset?: number | ChartInset;
    /**
     * Font style for the beacon labels.
     */
    beaconLabelFont?: ChartTextProps['font'];
    /**
     * Stroke color for the scrubber line.
     */
    lineStroke?: ReferenceLineBaseProps['stroke'];
    /**
     * Stroke color for secondary scrubber lines in multi mode.
     * Defaults to lineStroke if not specified.
     */
    secondaryLineStroke?: ReferenceLineBaseProps['stroke'];
    /**
     * Transition configuration for the scrubber beacon.
     */
    beaconTransitions?: ScrubberBeaconProps['transitions'];
  };

export type ScrubberProps = ScrubberBaseProps;

export type ScrubberRef = ScrubberBeaconGroupRef;

/**
 * Helper to convert a data index to a dataX value for the scale
 */
const getDataXFromIndex = (
  dataIndex: number,
  xAxis: ReturnType<ReturnType<typeof useCartesianChartContext>['getXAxis']>,
): number => {
  'worklet';
  if (xAxis?.data && Array.isArray(xAxis.data) && xAxis.data[dataIndex] !== undefined) {
    const dataValue = xAxis.data[dataIndex];
    return typeof dataValue === 'string' ? dataIndex : dataValue;
  }
  return dataIndex;
};

/**
 * Unified component that manages all scrubber elements (beacons, line, labels).
 */
export const Scrubber = memo(
  forwardRef<ScrubberRef, ScrubberProps>(
    (
      {
        seriesIds,
        hideLine,
        label,
        multiLabel,
        lineStroke,
        secondaryLineStroke,
        BeaconComponent = DefaultScrubberBeacon,
        BeaconLabelComponent,
        LineComponent,
        LabelComponent = DefaultScrubberLabel,
        labelElevated,
        hideOverlay,
        overlayOffset = 2,
        beaconLabelMinGap,
        beaconLabelHorizontalOffset,
        labelFont,
        labelBoundsInset,
        beaconLabelFont,
        idlePulse,
        beaconTransitions,
      },
      ref,
    ) => {
      const theme = useTheme();
      const beaconGroupRef = React.useRef<ScrubberBeaconGroupRef>(null);

      const { scrubberPosition, additionalScrubberPositions, scrubbingMode } = useScrubberContext();
      const { getXSerializableScale, getXAxis, series, drawingArea, animate, dataLength } =
        useCartesianChartContext();

      const xAxis = useMemo(() => getXAxis(), [getXAxis]);
      const xScale = useMemo(() => getXSerializableScale(), [getXSerializableScale]);

      // Animation state for delayed scrubber rendering (matches web timing)
      const scrubberOpacity = useSharedValue(animate ? 0 : 1);

      // Delay scrubber appearance until after path enter animation completes
      useEffect(() => {
        if (animate) {
          scrubberOpacity.value = withDelay(
            accessoryFadeTransitionDelay,
            withTiming(1, { duration: accessoryFadeTransitionDuration }),
          );
        }
      }, [animate, scrubberOpacity]);

      // Expose imperative handle with pulse method
      useImperativeHandle(ref, () => ({
        pulse: () => {
          beaconGroupRef.current?.pulse();
        },
      }));

      const filteredSeriesIds = useMemo(() => {
        if (seriesIds === undefined) {
          return series?.map((s) => s.id) ?? [];
        }
        return seriesIds;
      }, [series, seriesIds]);

      // Primary scrubber position
      const dataIndex = useDerivedValue(() => {
        return scrubberPosition.value ?? Math.max(0, dataLength - 1);
      }, [scrubberPosition, dataLength]);

      const dataX = useDerivedValue(() => {
        return getDataXFromIndex(dataIndex.value, xAxis);
      }, [xAxis, dataIndex]);

      // Secondary scrubber position (first additional position in multi mode)
      const secondaryDataIndex = useDerivedValue(() => {
        if (scrubbingMode !== 'multi' || additionalScrubberPositions.value.length === 0) {
          return undefined;
        }
        return additionalScrubberPositions.value[0];
      }, [scrubbingMode, additionalScrubberPositions]);

      const secondaryDataX = useDerivedValue(() => {
        if (secondaryDataIndex.value === undefined) return undefined;
        return getDataXFromIndex(secondaryDataIndex.value, xAxis);
      }, [xAxis, secondaryDataIndex]);

      // Check if we're in multi mode with two active positions
      const isMultiActive = useDerivedValue(() => {
        return (
          scrubbingMode === 'multi' &&
          scrubberPosition.value !== undefined &&
          secondaryDataIndex.value !== undefined
        );
      }, [scrubbingMode, scrubberPosition, secondaryDataIndex]);

      const lineOpacity = useDerivedValue(() => {
        return scrubberPosition.value !== undefined ? 1 : 0;
      }, [scrubberPosition]);

      const secondaryLineOpacity = useDerivedValue(() => {
        return isMultiActive.value ? 1 : 0;
      }, [isMultiActive]);

      const overlayOpacity = useDerivedValue(() => {
        return scrubberPosition.value !== undefined ? 0.8 : 0;
      }, [scrubberPosition]);

      // Calculate pixel positions for overlay
      const primaryPixelX = useDerivedValue(() => {
        if (dataX.value === undefined || !xScale) return 0;
        return getPointOnSerializableScale(dataX.value, xScale) ?? 0;
      }, [dataX, xScale]);

      const secondaryPixelX = useDerivedValue(() => {
        if (secondaryDataX.value === undefined || !xScale) return undefined;
        return getPointOnSerializableScale(secondaryDataX.value, xScale);
      }, [secondaryDataX, xScale]);

      const overlayWidth = useDerivedValue(() => {
        if (isMultiActive.value && secondaryPixelX.value !== undefined) {
          // In multi mode, overlay covers the area between the two lines
          return (
            Math.max(primaryPixelX.value, secondaryPixelX.value) -
            Math.min(primaryPixelX.value, secondaryPixelX.value) +
            overlayOffset * 2
          );
        }
        return drawingArea.x + drawingArea.width - primaryPixelX.value + overlayOffset;
      }, [isMultiActive, primaryPixelX, secondaryPixelX, drawingArea, overlayOffset]);

      const overlayX = useDerivedValue(() => {
        if (isMultiActive.value && secondaryPixelX.value !== undefined) {
          return Math.min(primaryPixelX.value, secondaryPixelX.value) - overlayOffset;
        }
        return primaryPixelX.value;
      }, [isMultiActive, primaryPixelX, secondaryPixelX, overlayOffset]);

      // Center position for multi-mode label
      const multiLabelDataX = useDerivedValue(() => {
        if (
          !isMultiActive.value ||
          dataX.value === undefined ||
          secondaryDataX.value === undefined
        ) {
          return undefined;
        }
        return (dataX.value + secondaryDataX.value) / 2;
      }, [isMultiActive, dataX, secondaryDataX]);

      const resolvedLabelValue = useSharedValue<SkParagraph | string>('');
      const resolvedMultiLabelValue = useSharedValue<SkParagraph | string>('');

      const updateResolvedLabel = useCallback(
        (index: number, isMulti: boolean) => {
          if (isMulti) {
            // Don't show single label in multi mode
            resolvedLabelValue.value = '';
            return;
          }

          if (!label) {
            resolvedLabelValue.value = '';
            return;
          }

          if (typeof label === 'function') {
            const result = label(index);
            resolvedLabelValue.value = result ?? '';
          } else if (typeof label === 'string') {
            resolvedLabelValue.value = label;
          }
        },
        [label, resolvedLabelValue],
      );

      const updateMultiLabel = useCallback(
        (primaryIndex: number, secondaryIndex: number) => {
          if (!multiLabel) {
            resolvedMultiLabelValue.value = '';
            return;
          }

          const sortedIndices = [primaryIndex, secondaryIndex].sort((a, b) => a - b);
          const result = multiLabel(sortedIndices);
          resolvedMultiLabelValue.value = result ?? '';
        },
        [multiLabel, resolvedMultiLabelValue],
      );

      // Update resolved label when dataIndex changes
      useAnimatedReaction(
        () => ({ index: dataIndex.value, isMulti: isMultiActive.value }),
        ({ index, isMulti }) => {
          'worklet';
          runOnJS(updateResolvedLabel)(index, isMulti);
        },
        [updateResolvedLabel],
      );

      // Update multi-mode label when positions change
      useAnimatedReaction(
        () => ({
          isMulti: isMultiActive.value,
          primary: dataIndex.value,
          secondary: secondaryDataIndex.value,
        }),
        ({ isMulti, primary, secondary }) => {
          'worklet';
          if (isMulti && secondary !== undefined) {
            runOnJS(updateMultiLabel)(primary, secondary);
          }
        },
        [updateMultiLabel],
      );

      const beaconLabels: ScrubberBeaconLabelGroupBaseProps['labels'] = useMemo(
        () =>
          series
            ?.filter((s) => filteredSeriesIds.includes(s.id))
            .filter((s) => s.label !== undefined && s.label.length > 0)
            .map((s) => ({
              seriesId: s.id,
              label: s.label!,
              color: s.color,
            })) ?? [],
        [series, filteredSeriesIds],
      );

      // Derived value to determine if we should show the primary label
      const showPrimaryLabel = useDerivedValue(() => {
        return !isMultiActive.value;
      }, [isMultiActive]);

      if (!xScale) return;

      return (
        <Group opacity={scrubberOpacity}>
          {!hideOverlay && (
            <Rect
              color={theme.color.bg}
              height={drawingArea.height + overlayOffset * 2}
              opacity={overlayOpacity}
              width={overlayWidth}
              x={overlayX}
              y={drawingArea.y - overlayOffset}
            />
          )}

          {/* Primary scrubber line */}
          {!hideLine && (
            <ReferenceLine
              LabelComponent={showPrimaryLabel.value ? LabelComponent : undefined}
              LineComponent={LineComponent}
              dataX={dataX}
              label={resolvedLabelValue}
              labelBoundsInset={labelBoundsInset}
              labelElevated={labelElevated}
              labelFont={labelFont}
              opacity={lineOpacity}
              stroke={lineStroke}
            />
          )}

          {/* Secondary scrubber line (multi mode only) */}
          {!hideLine && scrubbingMode === 'multi' && secondaryDataX.value !== undefined && (
            <ReferenceLine
              LineComponent={LineComponent}
              dataX={secondaryDataX}
              opacity={secondaryLineOpacity}
              stroke={secondaryLineStroke ?? lineStroke}
            />
          )}

          {/* Centered label for multi mode */}
          {!hideLine &&
            scrubbingMode === 'multi' &&
            multiLabelDataX.value !== undefined &&
            multiLabel && (
              <ReferenceLine
                LabelComponent={LabelComponent}
                dataX={multiLabelDataX}
                label={resolvedMultiLabelValue}
                labelBoundsInset={labelBoundsInset}
                labelElevated={labelElevated}
                labelFont={labelFont}
                opacity={secondaryLineOpacity}
                // Hide the line itself, only show the label
                stroke="transparent"
              />
            )}

          <ScrubberBeaconGroup
            ref={beaconGroupRef}
            BeaconComponent={BeaconComponent}
            idlePulse={idlePulse}
            seriesIds={filteredSeriesIds}
            transitions={beaconTransitions}
          />
          {beaconLabels.length > 0 && (
            <ScrubberBeaconLabelGroup
              BeaconLabelComponent={BeaconLabelComponent}
              labelFont={beaconLabelFont}
              labelHorizontalOffset={beaconLabelHorizontalOffset}
              labelMinGap={beaconLabelMinGap}
              labels={beaconLabels}
            />
          )}
        </Group>
      );
    },
  ),
);
