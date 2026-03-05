import type { TextStyle, ViewStyle } from 'react-native';
import type { ColorScheme, ThemeVars } from '@coinbase/cds-common/core/theme';

type Coordinate = { x: number; y: number };

/**
 * Configuration for a linear gradient.
 */
export type LinearGradientConfig = {
  /**
   * Colors to be distributed along the gradient line.
   */
  colors: string[];
  /**
   * The relative positions of colors (0 to 1). If not supplied or length
   * doesn't match colors, stops are auto-generated with even distribution.
   */
  stops?: number[];
  /**
   * Gradient angle in degrees. 0 is to top, 90 is to right, 180 is to bottom.
   * @default 180
   */
  angle?: number;
  /**
   * Start position of the gradient as an {x, y} coordinate (0 to 1).
   * Overrides the angle-based calculation when provided.
   */
  start?: Coordinate;
  /**
   * End position of the gradient as an {x, y} coordinate (0 to 1).
   * Overrides the angle-based calculation when provided.
   */
  end?: Coordinate;
};

export type GradientConfig = LinearGradientConfig;

type Shadow = {
  shadowColor?: ViewStyle['shadowColor'];
  shadowOpacity?: ViewStyle['shadowOpacity'];
  shadowOffset?: ViewStyle['shadowOffset'];
  shadowRadius?: ViewStyle['shadowRadius'];
};

export type ThemeConfig = {
  /** A unique identifier for the theme. */
  id?: string;
  /** The light spectrum color values. */
  lightSpectrum?: { [key in ThemeVars.SpectrumColor]: string };
  /** The dark spectrum color values. */
  darkSpectrum?: { [key in ThemeVars.SpectrumColor]: string };
  /** The light color palette. */
  lightColor?: { [key in ThemeVars.Color]: string };
  /** The dark color palette. */
  darkColor?: { [key in ThemeVars.Color]: string };
  /** The space values, used for margin and padding. */
  space: { [key in ThemeVars.Space]: number };
  /** The icon size values. */
  iconSize: { [key in ThemeVars.IconSize]: number };
  /** The avatar size values. */
  avatarSize: { [key in ThemeVars.AvatarSize]: number };
  /** The border width values. */
  borderWidth: { [key in ThemeVars.BorderWidth]: number };
  /** The border radius values. */
  borderRadius: { [key in ThemeVars.BorderRadius]: number };
  /** The font family values. */
  fontFamily: { [key in ThemeVars.FontFamily]: string };
  /** The font family values for monospace fonts. */
  fontFamilyMono?: { [key in ThemeVars.FontFamily]: string };
  /** The font size values. */
  fontSize: { [key in ThemeVars.FontSize]: number };
  /** The font weight values. On react-native, font weights are determined by the fontFamily, so this is just metadata. */
  fontWeight: { [key in ThemeVars.FontWeight]: TextStyle['fontWeight'] };
  /** The line height values. */
  lineHeight: { [key in ThemeVars.LineHeight]: number };
  /** The text transform values. */
  textTransform: { [key in ThemeVars.TextTransform]: TextStyle['textTransform'] };
  /** The shadow values. */
  shadow: { [key in ThemeVars.Shadow]: Shadow };
  /** The control size values. */
  controlSize: { [key in ThemeVars.ControlSize]: number };
  /** Custom gradient presets for light mode. Merged with default presets. */
  lightGradient?: Partial<Record<ThemeVars.Gradient, GradientConfig>>;
  /** Custom gradient presets for dark mode. Merged with default presets. */
  darkGradient?: Partial<Record<ThemeVars.Gradient, GradientConfig>>;
};

export type Theme = ThemeConfig & {
  /** The currently active color scheme for the parent ThemeProvider, either "light" or "dark". */
  activeColorScheme: ColorScheme;
  /** The light or dark spectrum color values, as appropriate based on the activeColorScheme. */
  spectrum: { [key in ThemeVars.SpectrumColor]: string };
  /** The light or dark color palette, as appropriate based on the activeColorScheme. */
  color: { [key in ThemeVars.Color]: string };
  /** The light or dark gradient presets, as appropriate based on the activeColorScheme. */
  gradient?: Partial<Record<ThemeVars.Gradient, GradientConfig>>;
};
