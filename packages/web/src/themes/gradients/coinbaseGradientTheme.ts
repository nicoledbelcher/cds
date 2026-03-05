// TO DO: This is temporary, and subject to change based on design decisions.
import type { ThemeConfig } from '../../core/theme';
import { coinbaseTheme } from '../coinbaseTheme';

const { lightColor, darkColor } = coinbaseTheme;

/**
 * Coinbase gradient presets for light mode.
 * Uses color tokens from the Coinbase theme.
 */
export const coinbaseLightGradient = {
  primary: `linear-gradient(180deg, ${lightColor.bgPrimary}, ${lightColor.bgPrimary})`,
  positive: `linear-gradient(180deg, ${lightColor.bgPositive}, ${lightColor.bgPositive})`,
  negative: `linear-gradient(180deg, ${lightColor.bgNegative}, ${lightColor.bgNegative})`,
  brand: `linear-gradient(90deg, ${lightColor.accentBoldBlue}, ${lightColor.accentBoldPurple})`,
  premium: `linear-gradient(135deg, ${lightColor.accentBoldPurple} 0%, ${lightColor.accentBoldBlue} 50%, ${lightColor.accentBoldGreen} 100%)`,
} as const satisfies ThemeConfig['lightGradient'];

/**
 * Coinbase gradient presets for dark mode.
 * Uses color tokens from the Coinbase theme.
 */
export const coinbaseDarkGradient = {
  primary: `linear-gradient(180deg, ${darkColor.bgPrimary}, ${darkColor.bgPrimary})`,
  positive: `linear-gradient(180deg, ${darkColor.bgPositive}, ${darkColor.bgPositive})`,
  negative: `linear-gradient(180deg, ${darkColor.bgNegative}, ${darkColor.bgNegative})`,
  brand: `linear-gradient(90deg, ${darkColor.accentBoldBlue}, ${darkColor.accentBoldPurple})`,
  premium: `linear-gradient(135deg, ${darkColor.accentBoldPurple} 0%, ${darkColor.accentBoldBlue} 50%, ${darkColor.accentBoldGreen} 100%)`,
} as const satisfies ThemeConfig['darkGradient'];

/**
 * Coinbase theme with gradient presets enabled.
 * A complete theme configuration ready to use with ThemeProvider.
 *
 * @example
 * ```tsx
 * import { coinbaseGradientTheme } from '@coinbase/cds-web/themes/gradients';
 *
 * <ThemeProvider theme={coinbaseGradientTheme} activeColorScheme="light">
 *   <App />
 * </ThemeProvider>
 * ```
 */
export const coinbaseGradientTheme = {
  ...coinbaseTheme,
  lightGradient: coinbaseLightGradient,
  darkGradient: coinbaseDarkGradient,
} as const satisfies ThemeConfig;
