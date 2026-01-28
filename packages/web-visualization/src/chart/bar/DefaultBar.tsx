import React, { memo, useCallback, useMemo } from 'react';
import { m as motion } from 'framer-motion';

import { useCartesianChartContext } from '../ChartProvider';
import { getBarPath, useOptionalHighlightContext } from '../utils';

import type { BarComponentProps } from './Bar';

export type DefaultBarProps = BarComponentProps & {
  /**
   * Custom class name for the bar.
   */
  className?: string;
  /**
   * Custom styles for the bar.
   */
  style?: React.CSSProperties;
};

/**
 * Default bar component that renders a solid bar with animation.
 * Automatically tracks series highlighting when `highlightScope.series` is enabled.
 */
export const DefaultBar = memo<DefaultBarProps>(
  ({
    x,
    width,
    borderRadius = 4,
    roundTop,
    roundBottom,
    originY,
    d,
    fill = 'var(--color-fgPrimary)',
    fillOpacity = 1,
    dataX,
    dataY,
    seriesId,
    transition,
    ...props
  }) => {
    const { animate } = useCartesianChartContext();
    const highlightContext = useOptionalHighlightContext();

    const initialPath = useMemo(() => {
      if (!animate) return undefined;
      // Need a minimum height to allow for animation
      const minHeight = 1;
      const initialY = (originY ?? 0) - minHeight;
      return getBarPath(x, initialY, width, minHeight, borderRadius, !!roundTop, !!roundBottom);
    }, [animate, x, originY, width, borderRadius, roundTop, roundBottom]);

    // Get the data index as a number for highlighting
    const dataIndex = typeof dataX === 'number' ? dataX : null;

    const handleMouseEnter = useCallback(() => {
      if (!highlightContext || !highlightContext.enabled) return;
      if (!highlightContext.scope.series) return;

      highlightContext.setHighlight([
        {
          dataIndex,
          seriesId: seriesId ?? null,
        },
      ]);
    }, [highlightContext, dataIndex, seriesId]);

    const handleMouseLeave = useCallback(() => {
      if (!highlightContext || !highlightContext.enabled) return;
      if (!highlightContext.scope.series) return;

      // Reset to just dataIndex (keep dataIndex tracking, clear series)
      if (highlightContext.scope.dataIndex) {
        highlightContext.setHighlight([
          {
            dataIndex,
            seriesId: null,
          },
        ]);
      } else {
        highlightContext.setHighlight([]);
      }
    }, [highlightContext, dataIndex, seriesId]);

    // Only add event handlers when series scope is enabled
    const eventHandlers = highlightContext?.scope.series
      ? {
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
          style: { cursor: 'pointer' },
        }
      : {};

    if (animate && initialPath) {
      return (
        <motion.path
          {...props}
          {...eventHandlers}
          animate={{ d }}
          fill={fill}
          fillOpacity={fillOpacity}
          initial={{ d: initialPath }}
          transition={transition}
        />
      );
    }

    return <path {...props} {...eventHandlers} d={d} fill={fill} fillOpacity={fillOpacity} />;
  },
);
