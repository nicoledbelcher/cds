import type { ColorScheme, ThemeVars } from '@coinbase/cds-common/core/theme';
import type { Property } from 'csstype';

import type { ButtonBaseProps } from '../buttons/Button';
import type { IconButtonBaseProps } from '../buttons/IconButton';

// TODO: Review the component config structure and allowed props. Using Partial<ComponentProps> for the following reasons:
// 1. Simpler architecture: Avoids nested `defaultProps` structure, keeping config flat and intuitive (e.g., `Button: { variant: 'primary' }` instead of `Button: { defaultProps: { variant: 'primary' } }`).
// 2. Type flexibility: Not all components expose className, classNames, style, and styles props. Partial<ComponentProps> accommodates varying component APIs.
// 3. Industry alignment: Most component libraries use `any` or `Partial<ComponentProps>` for component configuration (see Mantine, Material-UI, React Native Elements below).
// Mantine component config structure (https://github.com/mantinedev/mantine/blob/master/packages/@mantine/core/src/core/MantineProvider/theme.types.ts#L145).
// Material UI component config structure (https://github.com/mui/material-ui/blob/master/packages/mui-system/src/DefaultPropsProvider/DefaultPropsProvider.tsx#L32).
// React Native Elements component config structure (https://github.com/react-native-elements/react-native-elements/blob/next/packages/themed/src/config/theme.component.ts#L44-L100).
export type ComponentTheme = {
  Button: Partial<ButtonBaseProps>;
  IconButton: Partial<IconButtonBaseProps>;
  /**
   * Controls how component props from theme config are merged with local component props.
   * @default false
   *
   * - When `false` (default): Local props simply override theme config props (standard object spread behavior).
   * - When `true`: Special merging behavior for styling props:
   *   - `className`: Concatenated using cx()
   *   - `classNames`: Object keys merged, each value concatenated with cx()
   *   - `style`: Shallow merge (local props override theme config)
   *   - `styles`: Object keys merged, each value shallow merged
   *   - All other props: Local props override theme config
   */
  mergeClassNameAndStyle?: boolean;
};
export type ComponentsConfig<Components = ComponentTheme> = {
  [Key in keyof Components]?: Components[Key];
};

export type ThemeConfig = {
  /** A unique identifier for the theme. Must be a valid CSS class name. */
  id?: string;
  /** The light spectrum color values. */
  lightSpectrum?: { [key in ThemeVars.SpectrumColor]: string };
  /** The dark spectrum color values. */
  darkSpectrum?: { [key in ThemeVars.SpectrumColor]: string };
  /** The light color palette. */
  lightColor?: { [key in ThemeVars.Color]: Property.Color };
  /** The dark color palette. */
  darkColor?: { [key in ThemeVars.Color]: Property.Color };
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
  fontFamily: { [key in ThemeVars.FontFamily]: Property.FontFamily };
  /** The font family values for monospace fonts. */
  fontFamilyMono?: { [key in ThemeVars.FontFamily]: Property.FontFamily };
  /** The font size values. */
  fontSize: { [key in ThemeVars.FontSize]: Property.FontSize };
  /** The font weight values. */
  fontWeight: { [key in ThemeVars.FontWeight]: Property.FontWeight };
  /** The line height values. */
  lineHeight: { [key in ThemeVars.LineHeight]: Property.LineHeight };
  /** The text transform values. */
  textTransform: { [key in ThemeVars.TextTransform]: Property.TextTransform };
  /** The shadow values. */
  shadow: { [key in ThemeVars.Shadow]: Property.BoxShadow };
  /** The control size values. */
  controlSize: { [key in ThemeVars.ControlSize]: number };
};

export type Theme = ThemeConfig & {
  /**
   * Optional component configs at theme level.
   * Allows configuring default props for specific components throughout the theme.
   * These are merged with props passed directly to components, with local props taking precedence.
   * Supports nested ThemeProvider inheritance with shallow merge.
   */
  components?: ComponentsConfig;
  /** The currently active color scheme for the parent ThemeProvider, either "light" or "dark". */
  activeColorScheme: ColorScheme;
  /** The light or dark spectrum color values, as appropriate based on the activeColorScheme. */
  spectrum: { [key in ThemeVars.SpectrumColor]: string };
  /** The light or dark color palette, as appropriate based on the activeColorScheme. */
  color: { [key in ThemeVars.Color]: Property.Color };
};

/** The core theme data used to create CSS variables, excluding the components config. */
export type ThemeCore = Omit<Theme, 'components'>;

/** Maps our StyleVars to their CSS variable prefixes. For example, the names of CSS vars generated from `iconSize` vars will be prefixed with `--iconSize-`. */
export const styleVarPrefixes = {
  lightSpectrum: 'light',
  darkSpectrum: 'dark',
  lightColor: 'lightColor',
  darkColor: 'darkColor',
  spectrum: '',
  color: 'color',
  space: 'space',
  iconSize: 'iconSize',
  avatarSize: 'avatarSize',
  borderWidth: 'borderWidth',
  borderRadius: 'borderRadius',
  fontFamily: 'fontFamily',
  fontFamilyMono: 'fontFamilyMono',
  fontSize: 'fontSize',
  fontWeight: 'fontWeight',
  lineHeight: 'lineHeight',
  textTransform: 'textTransform',
  shadow: 'shadow',
  controlSize: 'controlSize',
} as const satisfies Record<
  Exclude<keyof Theme, 'id' | 'activeColorScheme' | 'components'>,
  string
>;

/** Used to generate intellisense via ThemeCSSVars below. */
type ThemeObjectCssVars = {
  spectrum: {
    [key in ThemeVars.SpectrumColor as `--${key}`]: string;
  };
  color: {
    [key in ThemeVars.Color as `--${typeof styleVarPrefixes.color}-${key}`]: Property.Color;
  };
  space: {
    [key in ThemeVars.Space as `--${typeof styleVarPrefixes.space}-${key}`]: Property.Padding;
  };
  iconSize: {
    [key in ThemeVars.IconSize as `--${typeof styleVarPrefixes.iconSize}-${key}`]: Property.Width;
  };
  avatarSize: {
    [key in ThemeVars.AvatarSize as `--${typeof styleVarPrefixes.avatarSize}-${key}`]: Property.Width;
  };
  borderWidth: {
    [key in ThemeVars.BorderWidth as `--${typeof styleVarPrefixes.borderWidth}-${key}`]: Property.BorderWidth;
  };
  borderRadius: {
    [key in ThemeVars.BorderRadius as `--${typeof styleVarPrefixes.borderRadius}-${key}`]: Property.BorderRadius;
  };
  fontFamily: {
    [key in ThemeVars.FontFamily as `--${typeof styleVarPrefixes.fontFamily}-${key}`]: Property.FontFamily;
  };
  fontSize: {
    [key in ThemeVars.FontSize as `--${typeof styleVarPrefixes.fontSize}-${key}`]: Property.FontSize;
  };
  fontWeight: {
    [key in ThemeVars.FontWeight as `--${typeof styleVarPrefixes.fontWeight}-${key}`]: Property.FontWeight;
  };
  lineHeight: {
    [key in ThemeVars.LineHeight as `--${typeof styleVarPrefixes.lineHeight}-${key}`]: Property.LineHeight;
  };
  textTransform: {
    [key in ThemeVars.TextTransform as `--${typeof styleVarPrefixes.textTransform}-${key}`]: Property.TextTransform;
  };
  shadow: {
    [key in ThemeVars.Shadow as `--${typeof styleVarPrefixes.shadow}-${key}`]: Property.BoxShadow;
  };
  controlSize: {
    [key in ThemeVars.ControlSize as `--${typeof styleVarPrefixes.controlSize}-${key}`]: Property.Width;
  };
};

type UnionToIntersection<U> = (U extends unknown ? (x: U) => void : never) extends (
  x: infer I,
) => void
  ? I
  : never;

/** A flat object of the CSS variable names of all themeable vars, based on the Theme type. */
export type ThemeCSSVars = UnionToIntersection<ThemeObjectCssVars[keyof ThemeObjectCssVars]>;
