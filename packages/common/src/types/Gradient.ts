import type { ThemeVars } from '../core/theme';

// ============================================
// Direction Types
// ============================================

/**
 * Direction shorthand for linear gradients (CSS-inspired).
 * Maps to CSS gradient directions.
 */
export type GradientDirection =
  | 'to-r' // to right (90deg)
  | 'to-l' // to left (270deg)
  | 'to-t' // to top (0deg)
  | 'to-b' // to bottom (180deg)
  | 'to-tr' // to top-right (45deg)
  | 'to-tl' // to top-left (315deg)
  | 'to-br' // to bottom-right (135deg)
  | 'to-bl'; // to bottom-left (225deg)

// ============================================
// Color Stop Types
// ============================================

/**
 * A single color stop in a gradient with optional offset and opacity.
 */
export type GradientColorStop = {
  /** Color value - accepts CDS tokens or raw color values (hex, rgb, etc.) */
  color: ThemeVars.Color | string;
  /** Position in gradient (0-1). If omitted, colors are evenly distributed. */
  offset?: number;
  /** Opacity override (0-1). */
  opacity?: number;
};

/**
 * Simplified color input - can be a CDS token, raw color string, or full stop config.
 */
export type GradientColorInput = ThemeVars.Color | string | GradientColorStop;

// ============================================
// Linear Gradient Configuration
// ============================================

/**
 * Linear gradient configuration object.
 */
export type LinearGradientConfig = {
  /**
   * Direction shorthand ('to-r', 'to-b', etc.) or angle in degrees.
   * @default 'to-b' (180deg, top to bottom)
   */
  direction?: GradientDirection | number;
  /**
   * Array of colors/stops (minimum 2).
   * Colors are evenly distributed unless offset is specified.
   */
  colors: [GradientColorInput, GradientColorInput, ...GradientColorInput[]];
};

// ============================================
// Gradient Presets (Theme-defined)
// ============================================

/**
 * Preset gradient names defined in the theme.
 * These map to pre-configured LinearGradientConfig values.
 */
export type GradientPreset = 'primary' | 'positive' | 'negative' | 'brand' | 'premium';

// ============================================
// Main Gradient Type
// ============================================

/**
 * Main gradient prop type.
 * Accepts a preset name or a linear gradient configuration.
 *
 * @example
 * // Using a preset
 * gradient="primary"
 *
 * // Using a configuration object
 * gradient={{ direction: 'to-r', colors: ['bgPrimary', 'accentBoldBlue'] }}
 */
export type Gradient = GradientPreset | LinearGradientConfig;

// ============================================
// Type Guards
// ============================================

/**
 * Check if a gradient value is a preset name.
 */
export function isGradientPreset(gradient: Gradient): gradient is GradientPreset {
  return typeof gradient === 'string';
}

/**
 * Check if a gradient value is a configuration object.
 */
export function isLinearGradientConfig(gradient: Gradient): gradient is LinearGradientConfig {
  return typeof gradient === 'object' && 'colors' in gradient;
}

/**
 * Check if a color input is a color stop object.
 */
export function isGradientColorStop(color: GradientColorInput): color is GradientColorStop {
  return typeof color === 'object' && 'color' in color;
}
