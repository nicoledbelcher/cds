import React, { forwardRef, memo, useMemo } from 'react';
import type { View } from 'react-native';
import type { ThemeVars } from '@coinbase/cds-common/core/theme';

import type { GradientConfig } from '../core/theme';
import { LinearGradientFill } from '../gradients/LinearGradientFill';
import { useTheme } from '../hooks/useTheme';

import { Box, type BoxProps } from './Box';

export type GradientBoxBaseProps = {
  /**
   * Theme gradient preset name. Resolved from theme configuration.
   * Ignored when `gradientConfig` is provided.
   * @example "brand", "primary", "positive"
   */
  gradient?: ThemeVars.Gradient;
  /**
   * Custom linear gradient configuration. Rendered as SVG LinearGradient.
   * Use this for dynamic or non-theme gradients.
   * Takes precedence over `gradient` when both are provided.
   * @example { colors: ['#0052FF', '#7B3FE4'], angle: 90 }
   */
  gradientConfig?: GradientConfig;
  /**
   * @default false
   * Gradient will overlay the children content when true.
   */
  elevated?: boolean;
  /**
   * Override the default linear gradient with a custom gradient node.
   * Use for radial, conic, or other gradient types.
   * @example <RadialGradientFill colors={['#0052FF', '#7B3FE4']} />
   */
  gradientNode?: React.ReactNode;
};

export type GradientBoxProps = GradientBoxBaseProps & BoxProps;

export const GradientBox = memo(
  forwardRef<View, GradientBoxProps>(
    (
      { elevated, children, gradient, gradientConfig, overflow = 'hidden', gradientNode, ...props },
      ref,
    ) => {
      const theme = useTheme();

      const resolvedConfig = useMemo(() => {
        if (gradientConfig) return gradientConfig;
        if (gradient && theme.gradient?.[gradient]) return theme.gradient[gradient];
        return undefined;
      }, [gradient, gradientConfig, theme.gradient]);

      const defaultGradient = useMemo(() => {
        if (!resolvedConfig?.colors) return null;
        return <LinearGradientFill key="GradientFillContainer" {...resolvedConfig} />;
      }, [resolvedConfig]);

      const renderedGradient = gradientNode ?? defaultGradient;

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
