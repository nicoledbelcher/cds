import React, { forwardRef, memo, useMemo } from 'react';
import type { ThemeVars } from '@coinbase/cds-common/core/theme';

import type { Polymorphic } from '../core/polymorphism';
import { cx } from '../cx';
import { getStyles } from '../styles/styleProps';

import { Box, type BoxBaseProps } from './Box';

const DEFAULT_ANGLE = 180;

export const gradientBoxDefaultElement = 'div';

export type GradientBoxDefaultElement = typeof gradientBoxDefaultElement;

/**
 * Configuration for a custom linear gradient.
 * This object is transformed to a CSS `linear-gradient()` string internally.
 */
export type LinearGradientConfig = {
  /**
   * Colors to be distributed along the gradient line.
   */
  colors: string[];
  /**
   * The relative positions of colors (0 to 1). If supplied, must be the same length as colors.
   * @default Evenly distributed
   */
  stops?: number[];
  /**
   * Gradient angle in degrees. 0 is to top, 90 is to right, 180 is to bottom.
   * @default 180
   */
  angle?: number;
};

export type GradientConfig = LinearGradientConfig;

export type GradientBoxBaseProps = BoxBaseProps & {
  /**
   * Theme gradient preset name. Applied via CSS class.
   * Ignored when `gradientConfig` is provided.
   * @example "brand", "primary", "positive"
   */
  gradient?: ThemeVars.Gradient;
  /**
   * Custom linear gradient configuration. Applied via inline style.
   * Use this for dynamic or non-theme gradients.
   * Takes precedence over `gradient` when both are provided.
   * @example { colors: ['#0052FF', '#7B3FE4'], angle: 90 }
   */
  gradientConfig?: GradientConfig;
};

export type GradientBoxProps<AsComponent extends React.ElementType> = Polymorphic.Props<
  AsComponent,
  GradientBoxBaseProps
>;

type GradientBoxComponent = (<AsComponent extends React.ElementType = GradientBoxDefaultElement>(
  props: GradientBoxProps<AsComponent>,
) => Polymorphic.ReactReturn) &
  Polymorphic.ReactNamed;

/**
 * Converts a LinearGradientConfig to a CSS linear-gradient string.
 * @returns CSS linear-gradient string, or undefined if colors array is empty.
 *
 * Special handling:
 * - Empty colors: Returns undefined (no gradient rendered)
 * - Single color: Duplicates the color to create a valid gradient syntax
 *   that browsers consistently render as a solid color
 * - Multiple colors: Creates standard gradient with optional stop positions
 */
const toCSSLinearGradient = (config: LinearGradientConfig): string | undefined => {
  const { colors, stops, angle = DEFAULT_ANGLE } = config;
  if (colors.length === 0) return undefined;
  if (colors.length === 1) {
    return `linear-gradient(${angle}deg, ${colors[0]}, ${colors[0]})`;
  }
  const colorStops = colors
    .map((color, index) => {
      const stop = stops?.[index];
      return stop !== undefined ? `${color} ${stop * 100}%` : color;
    })
    .join(', ');
  return `linear-gradient(${angle}deg, ${colorStops})`;
};

export const GradientBox: GradientBoxComponent = memo(
  forwardRef<React.ReactElement<GradientBoxBaseProps>, GradientBoxBaseProps>(
    <AsComponent extends React.ElementType>(
      { as, gradient, gradientConfig, className, style, ...props }: GradientBoxProps<AsComponent>,
      ref?: Polymorphic.Ref<AsComponent>,
    ) => {
      const Component = (as ?? gradientBoxDefaultElement) satisfies React.ElementType;

      const cssGradient = useMemo(
        () => (gradientConfig ? toCSSLinearGradient(gradientConfig) : undefined),
        [gradientConfig],
      );

      const inlineStyle = useMemo(
        () => ({
          ...(cssGradient ? { backgroundImage: cssGradient } : {}),
          ...style,
        }),
        [cssGradient, style],
      );

      const styles = useMemo(() => getStyles({ gradient }, inlineStyle), [gradient, inlineStyle]);

      return (
        <Box
          ref={ref}
          as={Component}
          className={cx(styles.className, className)}
          style={styles.style}
          {...props}
        />
      );
    },
  ),
);

GradientBox.displayName = 'GradientBox';
