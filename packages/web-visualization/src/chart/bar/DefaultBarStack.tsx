import { memo, useId, useMemo } from 'react';
import { m as motion } from 'framer-motion';

import { useCartesianChartContext } from '../ChartProvider';
import { getBarPath } from '../utils';

import type { BarStackComponentProps } from './BarStack';

export type DefaultBarStackProps = BarStackComponentProps & {
  /**
   * Custom class name for the stack group.
   */
  className?: string;
  /**
   * Custom styles for the stack group.
   */
  style?: React.CSSProperties;
};

/**
 * Default stack component that renders children in a group with animated clip path.
 */
export const DefaultBarStack = memo<DefaultBarStackProps>(
  ({
    children,
    className,
    style,
    width,
    height,
    x,
    y,
    borderRadius = 4,
    roundTop = true,
    roundBottom = true,
    yOrigin,
    transition,
  }) => {
    const { animate, layout } = useCartesianChartContext();
    const clipPathId = useId();

    const clipPathData = useMemo(() => {
      return getBarPath(x, y, width, height, borderRadius, roundTop, roundBottom, layout);
    }, [x, y, width, height, borderRadius, roundTop, roundBottom, layout]);

    const initialClipPathData = useMemo(() => {
      if (!animate) return undefined;
      const barsGrowVertically = layout !== 'horizontal';
      const initialX = barsGrowVertically ? x : (yOrigin ?? x);
      const initialY = barsGrowVertically ? (yOrigin ?? y + height) : y;
      const initialWidth = barsGrowVertically ? width : 1;
      const initialHeight = barsGrowVertically ? 1 : height;

      return getBarPath(
        initialX,
        initialY,
        initialWidth,
        initialHeight,
        borderRadius,
        roundTop,
        roundBottom,
        layout,
      );
    }, [animate, layout, x, yOrigin, y, height, width, borderRadius, roundTop, roundBottom]);

    return (
      <>
        <defs>
          <clipPath id={clipPathId}>
            {animate ? (
              <motion.path
                animate={{ d: clipPathData }}
                initial={{ d: initialClipPathData }}
                transition={transition}
              />
            ) : (
              <path d={clipPathData} />
            )}
          </clipPath>
        </defs>
        <g className={className} clipPath={`url(#${clipPathId})`} style={style}>
          {children}
        </g>
      </>
    );
  },
);
