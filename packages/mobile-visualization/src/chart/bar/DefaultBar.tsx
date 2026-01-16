import { memo, useEffect, useMemo } from 'react';
import { useTheme } from '@coinbase/cds-mobile/hooks/useTheme';

import { useCartesianChartContext } from '../ChartProvider';
import { Path } from '../Path';
import { getBarPath, useOptionalInteractionContext } from '../utils';

import type { BarComponentProps } from './Bar';

export type DefaultBarProps = BarComponentProps;

/**
 * Default bar component that renders a solid bar with animation support.
 *
 * Automatically registers bounds for series interaction hit testing when
 * `interactionScope.series` is enabled.
 */
export const DefaultBar = memo<DefaultBarProps>(
  ({
    x,
    y,
    width,
    height,
    borderRadius,
    roundTop,
    roundBottom,
    d,
    fill,
    fillOpacity = 1,
    stroke,
    strokeWidth,
    originY,
    dataX,
    seriesId,
    transition,
  }) => {
    const { animate } = useCartesianChartContext();
    const interactionContext = useOptionalInteractionContext();

    // Register bar bounds for hit testing when series interaction is enabled
    useEffect(() => {
      if (!interactionContext?.scope.series || !seriesId) return;

      // Get the data index as a number
      const dataIndex = typeof dataX === 'number' ? dataX : 0;

      interactionContext.registerBar({
        x,
        y,
        width,
        height,
        dataIndex,
        seriesId,
      });

      return () => {
        interactionContext.unregisterBar(seriesId, dataIndex);
      };
    }, [x, y, width, height, dataX, seriesId, interactionContext]);
    const theme = useTheme();

    const defaultFill = fill || theme.color.fgPrimary;

    const targetPath = useMemo(() => {
      const effectiveBorderRadius = borderRadius ?? 0;
      const effectiveRoundTop = roundTop ?? true;
      const effectiveRoundBottom = roundBottom ?? true;

      return (
        d ||
        getBarPath(
          x,
          y,
          width,
          height,
          effectiveBorderRadius,
          effectiveRoundTop,
          effectiveRoundBottom,
        )
      );
    }, [x, y, width, height, borderRadius, roundTop, roundBottom, d]);

    const initialPath = useMemo(() => {
      const effectiveBorderRadius = borderRadius ?? 0;
      const effectiveRoundTop = roundTop ?? true;
      const effectiveRoundBottom = roundBottom ?? true;
      const baselineY = originY ?? y + height;

      return getBarPath(
        x,
        baselineY,
        width,
        1,
        effectiveBorderRadius,
        effectiveRoundTop,
        effectiveRoundBottom,
      );
    }, [x, originY, y, height, width, borderRadius, roundTop, roundBottom]);

    return (
      <Path
        animate={animate}
        clipPath={null}
        d={targetPath}
        fill={stroke ? 'none' : defaultFill}
        fillOpacity={fillOpacity}
        initialPath={initialPath}
        stroke={stroke}
        strokeWidth={strokeWidth}
        transition={transition}
      />
    );
  },
);
