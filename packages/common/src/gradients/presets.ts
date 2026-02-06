import type { GradientPreset, LinearGradientConfig } from '../types/Gradient';

/**
 * Default gradient presets.
 * These can be extended or overridden by theme configuration.
 */
export const gradientPresets: Record<GradientPreset, LinearGradientConfig> = {
  primary: {
    direction: 'to-b',
    colors: ['bgPrimary', { color: 'bgPrimary', opacity: 0.8 }],
  },
  positive: {
    direction: 'to-b',
    colors: ['bgPositive', { color: 'bgPositive', opacity: 0.8 }],
  },
  negative: {
    direction: 'to-b',
    colors: ['bgNegative', { color: 'bgNegative', opacity: 0.8 }],
  },
  brand: {
    direction: 'to-r',
    colors: ['accentBoldBlue', 'accentBoldPurple'],
  },
  premium: {
    direction: 135,
    colors: [
      { color: 'accentBoldPurple', offset: 0 },
      { color: 'accentBoldBlue', offset: 0.5 },
      { color: 'accentBoldGreen', offset: 1 },
    ],
  },
};

/**
 * Resolve a gradient preset or config to a LinearGradientConfig.
 */
export function resolveGradientPreset(
  gradient: GradientPreset | LinearGradientConfig,
): LinearGradientConfig {
  if (typeof gradient === 'string') {
    return gradientPresets[gradient];
  }
  return gradient;
}
