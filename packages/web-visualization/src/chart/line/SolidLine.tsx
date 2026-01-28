import { memo, type SVGProps, useCallback, useId } from 'react';
import type { SharedProps } from '@coinbase/cds-common/types';

import { Gradient } from '../gradient';
import { Path, type PathProps } from '../Path';
import { useOptionalHighlightContext } from '../utils';

import type { LineComponentProps } from './Line';

export type SolidLineProps = SharedProps &
  Pick<
    PathProps,
    | 'className'
    | 'clipOffset'
    | 'clipRect'
    | 'strokeLinecap'
    | 'strokeLinejoin'
    | 'strokeDasharray'
    | 'strokeDashoffset'
    | 'style'
  > &
  LineComponentProps & {
    fill?: SVGProps<SVGPathElement>['fill'];
  };

/**
 * A customizable solid line component.
 * Supports gradient for gradient effects and smooth data transitions.
 * Automatically tracks series highlighting when `highlightScope.series` is enabled.
 */
export const SolidLine = memo<SolidLineProps>(
  ({
    fill = 'none',
    stroke = 'var(--color-fgPrimary)',
    strokeLinecap = 'round',
    strokeLinejoin = 'round',
    strokeOpacity = 1,
    strokeWidth = 2,
    interactionOffset,
    gradient,
    yAxisId,
    seriesId,
    animate,
    transition,
    d,
    ...props
  }) => {
    const gradientId = useId();
    const highlightContext = useOptionalHighlightContext();

    // Series highlight handlers
    const handleMouseEnter = useCallback(() => {
      if (!highlightContext || !highlightContext.enabled) return;
      if (!highlightContext.scope.series) return;

      // Get current dataIndex from highlight (preserve it)
      const currentDataIndex = highlightContext.highlight[0]?.dataIndex ?? null;

      highlightContext.setHighlight([
        {
          dataIndex: currentDataIndex,
          seriesId: seriesId ?? null,
        },
      ]);
    }, [highlightContext, seriesId]);

    const handleMouseLeave = useCallback(() => {
      if (!highlightContext || !highlightContext.enabled) return;
      if (!highlightContext.scope.series) return;

      // Get current dataIndex from highlight (preserve it)
      const currentDataIndex = highlightContext.highlight[0]?.dataIndex ?? null;

      // Reset seriesId but keep dataIndex tracking
      if (highlightContext.scope.dataIndex) {
        highlightContext.setHighlight([
          {
            dataIndex: currentDataIndex,
            seriesId: null,
          },
        ]);
      } else {
        highlightContext.setHighlight([]);
      }
    }, [highlightContext, seriesId]);

    // Determine if we need event handling (series highlighting enabled with a seriesId)
    const needsEventHandling = highlightContext?.scope.series && seriesId;

    // Calculate event handler path stroke width (with optional interactionOffset for larger hit area)
    const eventPathStrokeWidth =
      interactionOffset && interactionOffset > 0
        ? strokeWidth + interactionOffset * 2
        : strokeWidth;

    return (
      <>
        {gradient && (
          <defs>
            <Gradient
              animate={animate}
              gradient={gradient}
              id={gradientId}
              transition={transition}
              yAxisId={yAxisId}
            />
          </defs>
        )}
        {/* Visible line - pointerEvents disabled when we have event handling layer */}
        <Path
          {...props}
          animate={animate}
          clipOffset={strokeWidth}
          d={d}
          fill={fill}
          stroke={gradient ? `url(#${gradientId})` : stroke}
          strokeLinecap={strokeLinecap}
          strokeLinejoin={strokeLinejoin}
          strokeOpacity={strokeOpacity}
          strokeWidth={strokeWidth}
          style={{
            ...props.style,
            pointerEvents: needsEventHandling ? 'none' : undefined,
            cursor: needsEventHandling ? 'pointer' : undefined,
          }}
          transition={transition}
        />
        {/* 
          Event handling layer - use raw <path> instead of framer-motion Path component
          because motion.path doesn't reliably forward mouse events.
          Uses eventPathStrokeWidth which includes interactionOffset when specified.
        */}
        {needsEventHandling && (
          <path
            d={d}
            fill="none"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            stroke="transparent"
            strokeLinecap={strokeLinecap}
            strokeLinejoin={strokeLinejoin}
            strokeWidth={eventPathStrokeWidth}
            style={{ pointerEvents: 'all', cursor: 'pointer' }}
          />
        )}
      </>
    );
  },
);
