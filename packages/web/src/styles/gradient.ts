import { resolveGradientPreset } from '@coinbase/cds-common/gradients/presets';
import { resolveDirection } from '@coinbase/cds-common/gradients/utils';
import type {
  Gradient,
  GradientColorInput,
  LinearGradientConfig,
} from '@coinbase/cds-common/types/Gradient';
import { isGradientColorStop, isGradientPreset } from '@coinbase/cds-common/types/Gradient';

import type { Theme } from '../core/theme';

/**
 * Checks if a color string is a CDS theme token.
 * Theme tokens don't contain special characters like #, rgb, hsl, etc.
 */
function isThemeToken(color: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9]*$/.test(color);
}

/**
 * Resolves a color value to a CSS color string.
 * Theme tokens are converted to CSS variables.
 */
function resolveColor(color: string, theme: Theme): string {
  if (isThemeToken(color)) {
    // Use the actual color value from theme for gradient rendering
    const colorValue = theme.color[color as keyof typeof theme.color];
    return colorValue ?? `var(--cds-color-${color})`;
  }
  return color;
}

/**
 * Resolves a gradient color input to a CSS color stop string.
 */
function resolveColorStop(
  colorInput: GradientColorInput,
  theme: Theme,
): { color: string; offset?: number; opacity?: number } {
  if (isGradientColorStop(colorInput)) {
    return {
      color: resolveColor(colorInput.color, theme),
      offset: colorInput.offset,
      opacity: colorInput.opacity,
    };
  }
  return {
    color: resolveColor(colorInput, theme),
  };
}

/**
 * Applies opacity to a color value.
 * Handles hex, rgb, rgba, and other color formats.
 */
function applyOpacity(color: string, opacity: number): string {
  // For CSS variables, use color-mix
  if (color.startsWith('var(')) {
    return `color-mix(in srgb, ${color} ${Math.round(opacity * 100)}%, transparent)`;
  }
  // For hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const alphaHex = Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0');
    if (hex.length === 3) {
      return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}${alphaHex}`;
    }
    if (hex.length === 6) {
      return `#${hex}${alphaHex}`;
    }
    if (hex.length === 8) {
      return `#${hex.slice(0, 6)}${alphaHex}`;
    }
  }
  // For rgb colors
  if (color.startsWith('rgb(')) {
    const match = color.match(/rgb\(([^)]+)\)/);
    if (match) {
      return `rgba(${match[1]}, ${opacity})`;
    }
  }
  // For rgba colors, replace the alpha
  if (color.startsWith('rgba(')) {
    const match = color.match(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/);
    if (match) {
      return `rgba(${match[1]},${match[2]},${match[3]}, ${opacity})`;
    }
  }
  return color;
}

/**
 * Converts a LinearGradientConfig to a CSS linear-gradient string.
 */
export function linearGradientToCSS(config: LinearGradientConfig, theme: Theme): string {
  const angle = resolveDirection(config.direction);

  const colorStops = config.colors.map((colorInput, index) => {
    const stop = resolveColorStop(colorInput, theme);
    let colorValue = stop.color;

    if (stop.opacity !== undefined) {
      colorValue = applyOpacity(colorValue, stop.opacity);
    }

    if (stop.offset !== undefined) {
      return `${colorValue} ${stop.offset * 100}%`;
    }

    // If no offset is specified, colors are evenly distributed
    return colorValue;
  });

  return `linear-gradient(${angle}deg, ${colorStops.join(', ')})`;
}

/**
 * Converts a Gradient prop value to a CSS linear-gradient string.
 */
export function gradientToCSS(gradient: Gradient, theme: Theme): string {
  const config = isGradientPreset(gradient) ? resolveGradientPreset(gradient) : gradient;

  return linearGradientToCSS(config, theme);
}
