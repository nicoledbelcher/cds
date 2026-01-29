import React, { forwardRef, memo, useCallback, useMemo, useRef } from 'react';
import type { Rect } from '@coinbase/cds-common/types';
import { cx } from '@coinbase/cds-web';
import { useDimensions } from '@coinbase/cds-web/hooks/useDimensions';
import { Box, type BoxBaseProps, type BoxProps } from '@coinbase/cds-web/layout';
import { css } from '@linaria/core';

import { type HighlightProps, HighlightProvider } from './interaction/HighlightProvider';
import { CartesianChartProvider } from './ChartProvider';
import { Legend } from './legend';
import {
  type AxisConfig,
  type AxisConfigProps,
  type CartesianChartContextValue,
  type ChartInset,
  type ChartScaleFunction,
  defaultAxisId,
  defaultCartesianChartHighlightScope,
  defaultCartesianChartInset,
  getAxisConfig,
  getAxisDomain,
  getAxisRange,
  getAxisScale,
  getChartInset,
  getStackedSeriesData as calculateStackedSeriesData,
  type HighlightedItem,
  type HighlightScope,
  type LegendPosition,
  type Series,
  useTotalAxisPadding,
} from './utils';

const focusStylesCss = css`
  &:focus {
    outline: none;
  }
  &:focus-visible {
    outline: 2px solid var(--color-bgPrimary);
    outline-offset: 2px;
  }
`;

export type CartesianChartBaseProps = Omit<BoxBaseProps, 'accessibilityLabel'> &
  Omit<HighlightProps, 'highlightScope'> & {
    /**
     * Configuration objects that define how to visualize the data.
     * Each series contains its own data array.
     */
    series?: Array<Series>;
    /**
     * Whether to animate the chart.
     * @default true
     */
    animate?: boolean;
    /**
     * Configuration for x-axis.
     */
    xAxis?: Partial<Omit<AxisConfigProps, 'id'>>;
    /**
     * Configuration for y-axis(es). Can be a single config or array of configs.
     */
    yAxis?: Partial<Omit<AxisConfigProps, 'data'>> | Partial<Omit<AxisConfigProps, 'data'>>[];
    /**
     * Inset around the entire chart (outside the axes).
     */
    inset?: number | Partial<ChartInset>;
    /**
     * Whether to show the legend or a custom legend element.
     * - `true` renders the default Legend component
     * - A React element renders that element as the legend
     * - `false` or omitted hides the legend
     */
    legend?: boolean | React.ReactNode;
    /**
     * Position of the legend relative to the chart.
     * @default 'bottom'
     */
    legendPosition?: LegendPosition;
    /**
     * Accessibility label for the legend group.
     * @default 'Legend'
     */
    legendAccessibilityLabel?: string;
    /**
     * Accessibility label for the chart.
     * - When a string: Used as a static label for the chart element
     * - When a function: Called with the highlighted item to generate dynamic labels during interaction
     */
    accessibilityLabel?: string | ((item: HighlightedItem) => string);
    /**
     * Controls what aspects of the data can be highlighted.
     * @default { dataIndex: true, series: false }
     */
    highlightScope?: HighlightScope;
    /**
     * @deprecated Use `enableHighlighting={false}` instead. Will be removed in next major version.
     */
    enableScrubbing?: boolean;
    /**
     * @deprecated Use `onHighlightChange` instead. Will be removed in next major version.
     */
    onScrubberPositionChange?: (index: number | undefined) => void;
  };

export type CartesianChartProps = Omit<BoxProps<'div'>, 'title' | 'accessibilityLabel'> &
  CartesianChartBaseProps & {
    /**
     * Custom class name for the root element.
     */
    className?: string;
    /**
     * Custom class names for the component.
     */
    classNames?: {
      /**
       * Custom class name for the root element.
       */
      root?: string;
      /**
       * Custom class name for the chart SVG element.
       */
      chart?: string;
    };
    /**
     * Custom styles for the root element.
     */
    style?: React.CSSProperties;
    /**
     * Custom styles for the component.
     */
    styles?: {
      /**
       * Custom styles for the root element.
       */
      root?: React.CSSProperties;
      /**
       * Custom styles for the chart SVG element.
       */
      chart?: React.CSSProperties;
    };
  };

export const CartesianChart = memo(
  forwardRef<SVGSVGElement, CartesianChartProps>(
    (
      {
        series,
        children,
        animate = true,
        xAxis: xAxisConfigProp,
        yAxis: yAxisConfigProp,
        inset,
        // Highlight props
        enableHighlighting,
        highlightScope = defaultCartesianChartHighlightScope,
        highlight,
        onHighlightChange,
        // Legacy props
        enableScrubbing,
        onScrubberPositionChange,
        // Back to regular props
        legend,
        legendPosition = 'bottom',
        legendAccessibilityLabel,
        width = '100%',
        height = '100%',
        className,
        classNames,
        style,
        styles,
        accessibilityLabel,
        ...props
      },
      ref,
    ) => {
      const { observe, width: chartWidth, height: chartHeight } = useDimensions();
      const svgRef = useRef<SVGSVGElement | null>(null);

      const calculatedInset = useMemo(
        () => getChartInset(inset, defaultCartesianChartInset),
        [inset],
      );

      // Axis configs store the properties of each axis, such as id, scale type, domain limit, etc.
      // We only support 1 x axis but allow for multiple y axes.
      const xAxisConfig = useMemo(() => getAxisConfig('x', xAxisConfigProp)[0], [xAxisConfigProp]);
      const yAxisConfig = useMemo(() => getAxisConfig('y', yAxisConfigProp), [yAxisConfigProp]);

      const { renderedAxes, registerAxis, unregisterAxis, axisPadding } = useTotalAxisPadding();

      const chartRect: Rect = useMemo(() => {
        if (chartWidth <= 0 || chartHeight <= 0) return { x: 0, y: 0, width: 0, height: 0 };

        const totalInset = {
          top: calculatedInset.top + axisPadding.top,
          right: calculatedInset.right + axisPadding.right,
          bottom: calculatedInset.bottom + axisPadding.bottom,
          left: calculatedInset.left + axisPadding.left,
        };

        const availableWidth = chartWidth - totalInset.left - totalInset.right;
        const availableHeight = chartHeight - totalInset.top - totalInset.bottom;

        return {
          x: totalInset.left,
          y: totalInset.top,
          width: availableWidth > 0 ? availableWidth : 0,
          height: availableHeight > 0 ? availableHeight : 0,
        };
      }, [chartHeight, chartWidth, calculatedInset, axisPadding]);

      const { xAxis, xScale } = useMemo(() => {
        if (!chartRect || chartRect.width <= 0 || chartRect.height <= 0)
          return { xAxis: undefined, xScale: undefined };

        const domain = getAxisDomain(xAxisConfig, series ?? [], 'x');
        const range = getAxisRange(xAxisConfig, chartRect, 'x');

        const axisConfig: AxisConfig = {
          scaleType: xAxisConfig.scaleType,
          domain,
          range,
          data: xAxisConfig.data,
          categoryPadding: xAxisConfig.categoryPadding,
          domainLimit: xAxisConfig.domainLimit,
        };

        // Create the scale
        const scale = getAxisScale({
          config: axisConfig,
          type: 'x',
          range: axisConfig.range,
          dataDomain: axisConfig.domain,
        });

        if (!scale) return { xAxis: undefined, xScale: undefined };

        // Update axis config with actual scale domain (after .nice() or other adjustments)
        const scaleDomain = scale.domain();
        const actualDomain =
          Array.isArray(scaleDomain) && scaleDomain.length === 2
            ? { min: scaleDomain[0] as number, max: scaleDomain[1] as number }
            : axisConfig.domain;

        const finalAxisConfig = {
          ...axisConfig,
          domain: actualDomain,
        };

        return { xAxis: finalAxisConfig, xScale: scale };
      }, [xAxisConfig, series, chartRect]);

      const { yAxes, yScales } = useMemo(() => {
        const axes = new Map<string, AxisConfig>();
        const scales = new Map<string, ChartScaleFunction>();
        if (!chartRect || chartRect.width <= 0 || chartRect.height <= 0)
          return { yAxes: axes, yScales: scales };

        yAxisConfig.forEach((axisParam) => {
          const axisId = axisParam.id ?? defaultAxisId;

          // Get relevant series data
          const relevantSeries =
            series?.filter((s) => (s.yAxisId ?? defaultAxisId) === axisId) ?? [];

          // Calculate domain and range
          const dataDomain = getAxisDomain(axisParam, relevantSeries, 'y');
          const range = getAxisRange(axisParam, chartRect, 'y');

          const axisConfig: AxisConfig = {
            scaleType: axisParam.scaleType,
            domain: dataDomain,
            range,
            data: axisParam.data,
            categoryPadding: axisParam.categoryPadding,
            domainLimit: axisParam.domainLimit ?? 'nice',
          };

          // Create the scale
          const scale = getAxisScale({
            config: axisConfig,
            type: 'y',
            range: axisConfig.range,
            dataDomain: axisConfig.domain,
          });

          if (scale) {
            scales.set(axisId, scale);

            // Update axis config with actual scale domain (after .nice() or other adjustments)
            const scaleDomain = scale.domain();
            const actualDomain =
              Array.isArray(scaleDomain) && scaleDomain.length === 2
                ? { min: scaleDomain[0] as number, max: scaleDomain[1] as number }
                : axisConfig.domain;

            axes.set(axisId, {
              ...axisConfig,
              domain: actualDomain,
            });
          }
        });

        return { yAxes: axes, yScales: scales };
      }, [yAxisConfig, series, chartRect]);

      const getXAxis = useCallback(() => xAxis, [xAxis]);
      const getYAxis = useCallback((id?: string) => yAxes.get(id ?? defaultAxisId), [yAxes]);
      const getXScale = useCallback(() => xScale, [xScale]);
      const getYScale = useCallback((id?: string) => yScales.get(id ?? defaultAxisId), [yScales]);
      const getSeries = useCallback(
        (seriesId?: string) => series?.find((s) => s.id === seriesId),
        [series],
      );

      const stackedDataMap = useMemo(() => {
        if (!series) return new Map<string, Array<[number, number] | null>>();
        return calculateStackedSeriesData(series);
      }, [series]);

      const getStackedSeriesData = useCallback(
        (seriesId?: string) => {
          if (!seriesId) return undefined;
          return stackedDataMap.get(seriesId);
        },
        [stackedDataMap],
      );

      const dataLength = useMemo(() => {
        // If xAxis has categorical data, use that length
        if (xAxisConfig.data && xAxisConfig.data.length > 0) {
          return xAxisConfig.data.length;
        }

        // Otherwise, find the longest series
        if (!series || series.length === 0) return 0;
        return series.reduce((max, s) => {
          const seriesData = getStackedSeriesData(s.id);
          return Math.max(max, seriesData?.length ?? 0);
        }, 0);
      }, [xAxisConfig.data, series, getStackedSeriesData]);

      const getAxisBounds = useCallback(
        (axisId: string): Rect | undefined => {
          const axis = renderedAxes.get(axisId);
          if (!axis || !chartRect) return;

          const axesAtPosition = Array.from(renderedAxes.values())
            .filter((a) => a.position === axis.position)
            .sort((a, b) => a.id.localeCompare(b.id));

          const axisIndex = axesAtPosition.findIndex((a) => a.id === axisId);
          if (axisIndex === -1) return;

          // Calculate offset from previous axes at the same position
          const offsetFromPreviousAxes = axesAtPosition
            .slice(0, axisIndex)
            .reduce((sum, a) => sum + a.size, 0);

          if (axis.position === 'top') {
            // Position above the chart rect, accounting for user inset
            const startY = calculatedInset.top + offsetFromPreviousAxes;
            return {
              x: chartRect.x,
              y: startY,
              width: chartRect.width,
              height: axis.size,
            };
          } else if (axis.position === 'bottom') {
            // Position below the chart rect, accounting for user inset
            const startY = chartRect.y + chartRect.height + offsetFromPreviousAxes;
            return {
              x: chartRect.x,
              y: startY,
              width: chartRect.width,
              height: axis.size,
            };
          } else if (axis.position === 'left') {
            // Position to the left of the chart rect, accounting for user inset
            const startX = calculatedInset.left + offsetFromPreviousAxes;
            return {
              x: startX,
              y: chartRect.y,
              width: axis.size,
              height: chartRect.height,
            };
          } else {
            // right - position to the right of the chart rect, accounting for user inset
            const startX = chartRect.x + chartRect.width + offsetFromPreviousAxes;
            return {
              x: startX,
              y: chartRect.y,
              width: axis.size,
              height: chartRect.height,
            };
          }
        },
        [renderedAxes, chartRect, calculatedInset],
      );

      const contextValue: CartesianChartContextValue = useMemo(
        () => ({
          series: series ?? [],
          getSeries,
          getSeriesData: getStackedSeriesData,
          animate,
          width: chartWidth,
          height: chartHeight,
          getXAxis,
          getYAxis,
          getXScale,
          getYScale,
          drawingArea: chartRect,
          dataLength,
          registerAxis,
          unregisterAxis,
          getAxisBounds,
        }),
        [
          series,
          getSeries,
          getStackedSeriesData,
          animate,
          chartWidth,
          chartHeight,
          getXAxis,
          getYAxis,
          getXScale,
          getYScale,
          chartRect,
          dataLength,
          registerAxis,
          unregisterAxis,
          getAxisBounds,
        ],
      );

      const rootClassNames = useMemo(
        () => cx(className, classNames?.root),
        [className, classNames],
      );
      const rootStyles = useMemo(() => ({ ...style, ...styles?.root }), [style, styles?.root]);

      // Resolve enableHighlighting (backwards compatibility with enableScrubbing)
      const resolvedEnableHighlighting = useMemo(() => {
        if (enableHighlighting !== undefined) return enableHighlighting;
        if (enableScrubbing !== undefined) return enableScrubbing;
        return false; // Default to disabled
      }, [enableHighlighting, enableScrubbing]);

      // Wrap onHighlightChange to also call legacy onScrubberPositionChange
      const handleHighlightChange = useCallback(
        (items: HighlightedItem[]) => {
          onHighlightChange?.(items);

          // Legacy callback support
          if (onScrubberPositionChange) {
            onScrubberPositionChange(items[0]?.dataIndex ?? undefined);
          }
        },
        [onHighlightChange, onScrubberPositionChange],
      );

      const isHighlightingEnabled = resolvedEnableHighlighting;
      const legendElement = useMemo(() => {
        if (!legend) return;

        if (legend === true) {
          const isHorizontal = legendPosition === 'top' || legendPosition === 'bottom';
          const flexDirection = isHorizontal ? 'row' : 'column';

          return (
            <Legend accessibilityLabel={legendAccessibilityLabel} flexDirection={flexDirection} />
          );
        }

        return legend;
      }, [legend, legendAccessibilityLabel, legendPosition]);

      const rootBoxProps: BoxProps<'div'> = useMemo(
        () => ({
          className: rootClassNames,
          height,
          style: rootStyles,
          width,
          ...props,
        }),
        [rootClassNames, height, rootStyles, width, props],
      );

      const chartContent = (
        <Box
          ref={(node) => {
            observe(node as unknown as HTMLElement);
          }}
          height={legend ? undefined : height}
          style={{ flex: 1, minHeight: 0, minWidth: 0 }}
          width={legend ? undefined : width}
        >
          <Box
            ref={(node) => {
              const svgElement = node as unknown as SVGSVGElement;
              svgRef.current = svgElement;
              // Forward the ref to the user
              if (ref) {
                if (typeof ref === 'function') {
                  ref(svgElement);
                } else {
                  (ref as React.MutableRefObject<SVGSVGElement | null>).current = svgElement;
                }
              }
            }}
            aria-live="polite"
            as="svg"
            className={cx(enableScrubbing && focusStylesCss, classNames?.chart)}
            height="100%"
            style={styles?.chart}
            tabIndex={enableScrubbing ? 0 : undefined}
            width="100%"
          >
            {children}
          </Box>
        </Box>
      );

      // Determine flex direction based on legend position
      const isLegendVertical = legendPosition === 'left' || legendPosition === 'right';
      const legendFlexDirection = isLegendVertical ? 'row' : 'column';

      return (
        <CartesianChartProvider value={contextValue}>
          <HighlightProvider
            accessibilityLabel={accessibilityLabel}
            enableHighlighting={resolvedEnableHighlighting}
            highlight={highlight}
            highlightScope={highlightScope}
            onHighlightChange={handleHighlightChange}
            svgRef={svgRef}
          >
            {legend ? (
              <Box {...rootBoxProps} display="flex" flexDirection={legendFlexDirection}>
                {(legendPosition === 'top' || legendPosition === 'left') && legendElement}
                {chartContent}
                {(legendPosition === 'bottom' || legendPosition === 'right') && legendElement}
              </Box>
            ) : (
              <Box {...rootBoxProps}>{chartContent}</Box>
            )}
          </HighlightProvider>
        </CartesianChartProvider>
      );
    },
  ),
);
