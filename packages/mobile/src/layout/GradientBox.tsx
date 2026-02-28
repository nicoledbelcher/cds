import React, { forwardRef, memo, useMemo } from 'react';
import type { View } from 'react-native';
import type { ThemeVars } from '@coinbase/cds-common/core/theme';

import { LinearGradientFill, type LinearGradientFillProps } from '../gradients/LinearGradientFill';
import { useTheme } from '../hooks/useTheme';

import { Box, type BoxProps } from './Box';

export { LinearGradientFill, type LinearGradientFillProps } from '../gradients/LinearGradientFill';
export { RadialGradientFill, type RadialGradientFillProps } from '../gradients/RadialGradientFill';

export type GradientBoxBaseProps = {
  /**
   * Theme gradient preset name. Resolved from theme configuration.
   * @example "brand", "primary", "positive"
   */
  gradient?: ThemeVars.Gradient;
  /**
   * Custom linear gradient configuration. Rendered as SVG LinearGradient.
   * Use this for dynamic or non-theme gradients.
   * @example { colors: ['#0052FF', '#7B3FE4'], angle: 90 }
   */
  gradientConfig?: LinearGradientFillProps;
  /**
   * @default false
   * Gradient will overlay the children content when true.
   */
  elevated?: boolean;
  /**
   * Override the default linear gradient with a custom gradient component.
   * Use for radial, conic, or other gradient types.
   * @example <RadialGradientFill colors={['#0052FF', '#7B3FE4']} />
   */
  GradientComponent?: React.ReactNode;
};

export type GradientBoxProps = GradientBoxBaseProps & BoxProps;

export const GradientBox = memo(
  forwardRef<View, GradientBoxProps>(
    (
      {
        elevated,
        children,
        gradient,
        gradientConfig,
        overflow = 'hidden',
        GradientComponent,
        ...props
      },
      ref,
    ) => {
      const theme = useTheme();

      const resolvedConfig = useMemo(() => {
        if (gradientConfig) return gradientConfig;
        if (gradient && theme.gradient?.[gradient]) return theme.gradient[gradient];
        return undefined;
      }, [gradient, gradientConfig, theme.gradient]);

      // TO DO: This is temporarily set to LinearGradientFillProps, and subject to change based on design decisions.
      const defaultGradient = useMemo(() => {
        if (!resolvedConfig?.colors) return null;
        return <LinearGradientFill key="GradientFillContainer" {...resolvedConfig} />;
      }, [resolvedConfig]);

      const renderedGradient = GradientComponent ?? defaultGradient;

      const items = elevated ? [children, renderedGradient] : [renderedGradient, children];

      return (
        <Box ref={ref} overflow={overflow} {...props}>
          {items}
        </Box>
      );
    },
  ),
);

GradientBox.displayName = 'GradientBox';
