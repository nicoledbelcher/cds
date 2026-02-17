import type { ColorScheme, ThemeVars } from '@coinbase/cds-common/core/theme';
import type { Property } from 'csstype';

import type { SelectBaseProps as AlphaSelectBaseProps } from '../alpha/select/types';
import type { TabbedChipsBaseProps } from '../alpha/tabbed-chips/TabbedChips';
import type { AvatarButtonBaseProps } from '../buttons/AvatarButton';
import type { ButtonBaseProps } from '../buttons/Button';
import type { IconButtonBaseProps } from '../buttons/IconButton';
import type { NudgeCardBaseProps } from '../cards/NudgeCard';
import type { UpsellCardBaseProps } from '../cards/UpsellCard';
import type { ListCellBaseProps } from '../cells/ListCell';
import type { ChipBaseProps } from '../chips/ChipProps';
import type { CoachmarkBaseProps } from '../coachmark/Coachmark';
import type { CheckboxProps } from '../controls/Checkbox';
import type { CheckboxCellBaseProps } from '../controls/CheckboxCell';
import type { InputIconButtonProps } from '../controls/InputIconButton';
import type { NativeTextAreaBaseProp } from '../controls/NativeTextArea';
import type { RadioProps } from '../controls/Radio';
import type { RadioCellBaseProps } from '../controls/RadioCell';
import type { SearchInputBaseProps } from '../controls/SearchInput';
import type { SwitchProps } from '../controls/Switch';
import type { TextInputBaseProps } from '../controls/TextInput';
import type { DatePickerProps } from '../dates/DatePicker';
import type { DotCountBaseProps } from '../dots/DotCount';
import type { DropdownProps } from '../dropdown/DropdownProps';
import type { AvatarBaseProps } from '../media/Avatar';
import type { NavLinkProps } from '../navigation/NavLink';
import type { AlertBaseProps } from '../overlays/Alert';
import type { ModalBaseProps } from '../overlays/modal/Modal';
import type { ToastBaseProps } from '../overlays/Toast';
import type { TooltipBaseProps, TooltipContentBaseProps } from '../overlays/tooltip/TooltipProps';
import type { TableCellProps } from '../tables/TableCell';
import type { TableHeaderProps } from '../tables/TableHeader';
import type { TabsBaseProps } from '../tabs/Tabs';
import type { TagBaseProps } from '../tag/Tag';

/** A config resolver is either a static partial props object or a function that receives the component's props and returns partial props. */
export type ConfigResolver<P> = Partial<P> | ((props: P) => Partial<P>);

export type ComponentTheme = {
  // Buttons
  Button: ConfigResolver<ButtonBaseProps>;
  IconButton: ConfigResolver<IconButtonBaseProps>;
  AvatarButton: ConfigResolver<AvatarButtonBaseProps>;
  // Controls
  TextInput: ConfigResolver<TextInputBaseProps>;
  InputIconButton: ConfigResolver<InputIconButtonProps>;
  SearchInput: ConfigResolver<SearchInputBaseProps>;
  Checkbox: ConfigResolver<CheckboxProps<string>>;
  CheckboxCell: ConfigResolver<CheckboxCellBaseProps<string>>;
  Radio: ConfigResolver<RadioProps<string>>;
  RadioCell: ConfigResolver<RadioCellBaseProps<string>>;
  Switch: ConfigResolver<SwitchProps>;
  NativeTextArea: ConfigResolver<NativeTextAreaBaseProp>;
  // Chips
  Chip: ConfigResolver<ChipBaseProps>;
  TabbedChips: ConfigResolver<TabbedChipsBaseProps>;
  // Select (alpha)
  Select: ConfigResolver<AlphaSelectBaseProps>;
  // Dropdown
  Dropdown: ConfigResolver<DropdownProps>;
  // Overlays
  Modal: ConfigResolver<ModalBaseProps>;
  Alert: ConfigResolver<AlertBaseProps>;
  Toast: ConfigResolver<ToastBaseProps>;
  Tooltip: ConfigResolver<TooltipBaseProps>;
  TooltipContent: ConfigResolver<TooltipContentBaseProps>;
  // Cells
  ListCell: ConfigResolver<ListCellBaseProps>;
  // Media
  Avatar: ConfigResolver<AvatarBaseProps>;
  // Navigation
  NavLink: ConfigResolver<NavLinkProps>;
  // Dots
  DotCount: ConfigResolver<DotCountBaseProps>;
  // Tag
  Tag: ConfigResolver<TagBaseProps>;
  // Tabs
  Tabs: ConfigResolver<TabsBaseProps>;
  // Dates
  DatePicker: ConfigResolver<DatePickerProps>;
  // Cards
  NudgeCard: ConfigResolver<NudgeCardBaseProps>;
  UpsellCard: ConfigResolver<UpsellCardBaseProps>;
  // Tables
  TableCell: ConfigResolver<TableCellProps>;
  TableHeader: ConfigResolver<TableHeaderProps>;
  // Coachmark
  Coachmark: ConfigResolver<CoachmarkBaseProps>;
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
  /** The currently active color scheme for the parent ThemeProvider, either "light" or "dark". */
  activeColorScheme: ColorScheme;
  /** The light or dark spectrum color values, as appropriate based on the activeColorScheme. */
  spectrum: { [key in ThemeVars.SpectrumColor]: string };
  /** The light or dark color palette, as appropriate based on the activeColorScheme. */
  color: { [key in ThemeVars.Color]: Property.Color };
};

/** Alias for Theme, previously excluded `components`. Kept for backward compatibility. */
export type ThemeCore = Theme;

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
} as const satisfies Record<Exclude<keyof Theme, 'id' | 'activeColorScheme'>, string>;

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
