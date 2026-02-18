import type { ThemeConfig } from '../../core/theme';
import { coinbaseTheme } from '../coinbaseTheme';

export const coinbaseGradientThemeId = 'cds-coinbase-gradient';

const { lightColor, darkColor } = coinbaseTheme;

/**
 * Coinbase gradient presets for light mode.
 * Uses color tokens from the Coinbase theme.
 */
export const coinbaseLightGradient = {
  primary: {
    colors: [lightColor.bgPrimary, lightColor.bgPrimary],
    angle: 180,
  },
  positive: {
    colors: [lightColor.bgPositive, lightColor.bgPositive],
    angle: 180,
  },
  negative: {
    colors: [lightColor.bgNegative, lightColor.bgNegative],
    angle: 180,
  },
  brand: {
    colors: [lightColor.accentBoldBlue, lightColor.accentBoldPurple],
    angle: 90,
  },
  premium: {
    colors: [lightColor.accentBoldPurple, lightColor.accentBoldBlue, lightColor.accentBoldGreen],
    stops: [0, 0.5, 1],
    angle: 135,
  },
} as const satisfies ThemeConfig['lightGradient'];

/**
 * Coinbase gradient presets for dark mode.
 * Uses color tokens from the Coinbase theme.
 */
export const coinbaseDarkGradient = {
  primary: {
    colors: [darkColor.bgPrimary, darkColor.bgPrimary],
    angle: 180,
  },
  positive: {
    colors: [darkColor.bgPositive, darkColor.bgPositive],
    angle: 180,
  },
  negative: {
    colors: [darkColor.bgNegative, darkColor.bgNegative],
    angle: 180,
  },
  brand: {
    colors: [darkColor.accentBoldBlue, darkColor.accentBoldPurple],
    angle: 90,
  },
  premium: {
    colors: [darkColor.accentBoldPurple, darkColor.accentBoldBlue, darkColor.accentBoldGreen],
    stops: [0, 0.5, 1],
    angle: 135,
  },
} as const satisfies ThemeConfig['darkGradient'];

/**
 * Coinbase theme with gradient presets enabled.
 * A complete theme configuration ready to use with ThemeProvider.
 *
 * @example
 * ```tsx
 * import { coinbaseGradientTheme } from '@coinbase/cds-mobile/themes/gradients';
 *
 * <ThemeProvider theme={coinbaseGradientTheme} activeColorScheme="light">
 *   <App />
 * </ThemeProvider>
 * ```
 */
export const coinbaseGradientTheme = {
  ...coinbaseTheme,
  id: coinbaseGradientThemeId,
  lightGradient: coinbaseLightGradient,
  darkGradient: coinbaseDarkGradient,
} as const satisfies ThemeConfig;
