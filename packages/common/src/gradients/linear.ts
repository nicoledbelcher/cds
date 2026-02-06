import type {
  GradientColorInput,
  GradientDirection,
  LinearGradientConfig,
} from '../types/Gradient';

/**
 * Helper function to create a linear gradient configuration.
 *
 * @param direction - Direction shorthand ('to-r', 'to-b', etc.) or angle in degrees.
 * @param colors - Array of colors (min 2). Can be CDS tokens, hex values, or stop objects.
 * @returns LinearGradientConfig object
 *
 * @example
 * // Using direction shorthand
 * linear('to-r', 'bgPrimary', 'accentBoldBlue')
 *
 * // Using angle in degrees
 * linear(45, 'bgPrimary', 'accentBoldBlue')
 *
 * // With custom offsets
 * linear('to-r', { color: 'bgPrimary', offset: 0 }, { color: 'accentBoldBlue', offset: 0.7 })
 *
 * // Multi-color gradient
 * linear('to-b', 'accentBoldPurple', 'accentBoldBlue', 'accentBoldGreen')
 */
export function linear(
  direction: GradientDirection | number,
  ...colors: [GradientColorInput, GradientColorInput, ...GradientColorInput[]]
): LinearGradientConfig {
  return {
    direction,
    colors,
  };
}
