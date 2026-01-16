import { memo, type SVGProps, useCallback, useId } from 'react';
import type { SharedProps } from '@coinbase/cds-common/types';

import { Gradient } from '../gradient';
import { Path, type PathProps } from '../Path';
import { useOptionalInteractionContext } from '../utils';

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
 * Automatically tracks series interaction when `interactionScope.series` is enabled.
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
    const interactionContext = useOptionalInteractionContext();

    // Series interaction handlers
    const handleMouseEnter = useCallback(() => {
      if (!interactionContext || interactionContext.mode === 'none') return;
      if (!interactionContext.scope.series) return;

      // Get current dataIndex from active item (preserve it)
      const currentItem = interactionContext.activeItem;
      const currentDataIndex =
        currentItem && !Array.isArray(currentItem) ? currentItem.dataIndex : null;

      interactionContext.setActiveItem({
        dataIndex: currentDataIndex,
        seriesId: seriesId ?? null,
      });
    }, [interactionContext, seriesId]);

    const handleMouseLeave = useCallback(() => {
      if (!interactionContext || interactionContext.mode === 'none') return;
      if (!interactionContext.scope.series) return;

      // Get current dataIndex from active item (preserve it)
      const currentItem = interactionContext.activeItem;
      const currentDataIndex =
        currentItem && !Array.isArray(currentItem) ? currentItem.dataIndex : null;

      // Reset seriesId but keep dataIndex tracking
      if (interactionContext.scope.dataIndex) {
        interactionContext.setActiveItem({
          dataIndex: currentDataIndex,
          seriesId: null,
        });
      } else {
        interactionContext.setActiveItem(undefined);
      }
    }, [interactionContext, seriesId]);

    // Determine if we need event handling (series interaction enabled with a seriesId)
    const needsEventHandling = interactionContext?.scope.series && seriesId;

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
