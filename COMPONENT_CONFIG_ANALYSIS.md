# Component Config (`ComponentsConfig`) Analysis

## Overview

The `ComponentsConfig` system allows theme-level default props to be set for CDS components via the `ThemeProvider`. Instead of setting props on each component instance individually, consumers can define default prop values at the theme level that apply globally to all instances of a component within that provider's subtree.

```tsx
<ThemeProvider
  activeColorScheme="dark"
  theme={themeConfig}
  components={{
    Button: { variant: 'secondary', compact: true },
    TextInput: { bordered: false },
  }}
>
  {/* All Buttons here default to secondary + compact */}
  {/* All TextInputs here default to non-bordered */}
</ThemeProvider>
```

---

## Architecture

### Type Definitions

**`packages/web/src/core/theme.ts`**

`ComponentTheme` is a type-map where each key is a component name and each value is `Partial<ComponentBaseProps>`. This means every configurable prop on a supported component can be provided at the theme level.

`ComponentsConfig` is then defined as:

```ts
export type ComponentsConfig<Components = ComponentTheme> = {
  [Key in keyof Components]?: Components[Key];
};
```

This makes every component key optional, so consumers only need to specify config for the components they want to customize.

### Special Flag: `mergeClassNameAndStyle`

`ComponentTheme` includes a top-level flag:

```ts
mergeClassNameAndStyle?: boolean; // default: false
```

- **`false` (default):** Local component props simply override theme config props (standard spread behavior). If a component specifies `className`, it fully replaces the theme config's `className`.
- **`true`:** Special merge logic for styling props:
  - `className` — concatenated via `cx()`
  - `classNames` — object keys merged, each value concatenated with `cx()`
  - `style` — shallow merge (local overrides theme)
  - `styles` — object keys merged, each value shallow merged
  - All other props — local overrides theme

### How ThemeProvider Manages ComponentsConfig

**`packages/web/src/system/ThemeProvider.tsx`**

1. `components` is accepted as a separate prop (not part of `theme`) to keep theme config purely about design tokens.
2. Parent-child `ThemeProvider` nesting uses **shallow merge** for component configs:
   ```ts
   const resolvedComponents = useMemo(
     () => ({ ...parentTheme?.components, ...components }),
     [parentTheme?.components, components],
   );
   ```
   This means a child `ThemeProvider` that sets `Button` config completely replaces the parent's `Button` config (per-component level), but other parent component configs (e.g., `IconButton`) are preserved.
3. The resolved `components` is stored in the `ThemeContext` alongside the theme data.
4. `InvertedThemeProvider` also forwards the `components` config.

> **Note:** There is a commented-out deep merge strategy (`mergeComponentsConfig`) that would perform per-prop merging across nested providers. Currently unused — the shallow merge is considered more predictable.

### How Components Consume the Config

Each supported component follows this pattern:

```ts
// Example from Button.tsx
const theme = useTheme();
const mergedProps = mergeComponentProps(
  theme?.components?.Button, // theme-level defaults (target)
  _props, // local instance props (source)
  theme?.components?.mergeClassNameAndStyle,
);
```

The `mergeComponentProps` utility (`packages/web/src/utils/mergeComponentProps.ts`) handles the merge:

- Theme-level props serve as the **target** (defaults)
- Local instance props serve as the **source** (overrides)
- The `mergeClassNameAndStyle` flag controls whether styling props get special merge treatment

**Key principle:** Local props always take precedence over theme config, ensuring component instances can always override theme defaults.

---

## Supported Components (Web)

All 34 components that currently consume `ComponentsConfig` in `packages/web/`:

| Category       | Component       | Config Key        | Source File                           |
| -------------- | --------------- | ----------------- | ------------------------------------- |
| **Buttons**    | Button          | `Button`          | `buttons/Button.tsx`                  |
|                | IconButton      | `IconButton`      | `buttons/IconButton.tsx`              |
|                | AvatarButton    | `AvatarButton`    | `buttons/AvatarButton.tsx`            |
| **Controls**   | TextInput       | `TextInput`       | `controls/TextInput.tsx`              |
|                | InputIconButton | `InputIconButton` | `controls/InputIconButton.tsx`        |
|                | SearchInput     | `SearchInput`     | `controls/SearchInput.tsx`            |
|                | Checkbox        | `Checkbox`        | `controls/Checkbox.tsx`               |
|                | CheckboxCell    | `CheckboxCell`    | `controls/CheckboxCell.tsx`           |
|                | Radio           | `Radio`           | `controls/Radio.tsx`                  |
|                | RadioCell       | `RadioCell`       | `controls/RadioCell.tsx`              |
|                | Switch          | `Switch`          | `controls/Switch.tsx`                 |
|                | NativeTextArea  | `NativeTextArea`  | `controls/NativeTextArea.tsx`         |
| **Chips**      | Chip            | `Chip`            | `chips/Chip.tsx`                      |
|                | TabbedChips     | `TabbedChips`     | `alpha/tabbed-chips/TabbedChips.tsx`  |
| **Select**     | Select (alpha)  | `Select`          | `alpha/select/Select.tsx`             |
| **Dropdown**   | Dropdown        | `Dropdown`        | `dropdown/Dropdown.tsx`               |
| **Overlays**   | Modal           | `Modal`           | `overlays/modal/Modal.tsx`            |
|                | Alert           | `Alert`           | `overlays/Alert.tsx`                  |
|                | Toast           | `Toast`           | `overlays/Toast.tsx`                  |
|                | Tooltip         | `Tooltip`         | `overlays/tooltip/Tooltip.tsx`        |
|                | TooltipContent  | `TooltipContent`  | `overlays/tooltip/TooltipContent.tsx` |
| **Cells**      | ListCell        | `ListCell`        | `cells/ListCell.tsx`                  |
| **Media**      | Avatar          | `Avatar`          | `media/Avatar.tsx`                    |
| **Navigation** | NavLink         | `NavLink`         | `navigation/NavLink.tsx`              |
| **Dots**       | DotCount        | `DotCount`        | `dots/DotCount.tsx`                   |
| **Tag**        | Tag             | `Tag`             | `tag/Tag.tsx`                         |
| **Tabs**       | Tabs            | `Tabs`            | `tabs/Tabs.tsx`                       |
| **Dates**      | DatePicker      | `DatePicker`      | `dates/DatePicker.tsx`                |
| **Cards**      | NudgeCard       | `NudgeCard`       | `cards/NudgeCard.tsx`                 |
|                | UpsellCard      | `UpsellCard`      | `cards/UpsellCard.tsx`                |
| **Tables**     | TableCell       | `TableCell`       | `tables/TableCell.tsx`                |
|                | TableHeader     | `TableHeader`     | `tables/TableHeader.tsx`              |
| **Coachmark**  | Coachmark       | `Coachmark`       | `coachmark/Coachmark.tsx`             |

### Supported Components (Mobile)

Mobile has a smaller set — only 2 components currently support `ComponentsConfig`:

| Component  | Config Key   | Source File              |
| ---------- | ------------ | ------------------------ |
| Button     | `Button`     | `buttons/Button.tsx`     |
| IconButton | `IconButton` | `buttons/IconButton.tsx` |

Mobile uses `mergeStyleProps` instead of `mergeClassNameAndStyle` (since there are no CSS class names in React Native).

---

## Usage in `apps/vite-themed`

### App Setup (`apps/vite-themed/src/App.tsx`)

The vite-themed app uses `ComponentsConfig` to demonstrate theme-level component customization. It defines two theme options:

```ts
const themes: Record<ThemeOption, ThemeConfig> = {
  default: defaultTheme,
  advanced: advancedTheme,
};

const themeComponents: Record<ThemeOption, ComponentsConfig | undefined> = {
  default: undefined, // No component config for default theme
  advanced: advancedComponents, // Custom component defaults for advanced theme
};
```

The active component config is passed directly to `ThemeProvider`:

```tsx
<ThemeProvider activeColorScheme={activeColorScheme} components={components} theme={themeConfig}>
  {/* App content */}
</ThemeProvider>
```

Users can toggle between "Default" and "Advanced" themes via `SegmentedTabs` in the navigation bar. When "Advanced" is selected, the `advancedComponents` config is applied to all components in the tree.

### Advanced Components Config (`apps/vite-themed/src/themes/advancedComponents.ts`)

```ts
export const advancedComponents: ComponentsConfig = {
  Button: {
    borderRadius: 200,
  },
  IconButton: {
    borderRadius: 200,
  },
  TextInput: {
    inputBackground: 'bgAlternate',
    bordered: false,
  },
  Switch: {
    background: 'bgTertiary',
  },
  Tooltip: {
    invertColorScheme: false,
  },
  TooltipContent: {
    background: 'bgSecondary',
  },
};
```

This config customizes **6 out of 34** supported web components:

| Component        | Props Customized                                    | Effect                                |
| ---------------- | --------------------------------------------------- | ------------------------------------- |
| `Button`         | `borderRadius: 200`                                 | More rounded pill-style buttons       |
| `IconButton`     | `borderRadius: 200`                                 | Matching rounded icon buttons         |
| `TextInput`      | `inputBackground: 'bgAlternate'`, `bordered: false` | Alternate background, no border       |
| `Switch`         | `background: 'bgTertiary'`                          | Tertiary background for switch track  |
| `Tooltip`        | `invertColorScheme: false`                          | Tooltips stay in current color scheme |
| `TooltipContent` | `background: 'bgSecondary'`                         | Secondary background for tooltip body |

### StickerSheet Rendering

The `StickerSheet` component (`apps/vite-themed/src/components/StickerSheet/index.tsx`) renders a comprehensive visual showcase. Since it's wrapped inside the `ThemeProvider` from `App.tsx`, all components rendered in the StickerSheet automatically pick up the `advancedComponents` config when the "Advanced" theme is active.

Components rendered in the StickerSheet that are affected by the advanced config:

- **Button** — rendered in multiple variants, both normal and compact sizes
- **IconButton** — rendered alongside buttons in variant rows
- **TextInput** — rendered via `TextInputExample`
- **Switch** — rendered via `ControlsExample`
- **Tooltip** — wraps `FloatingAssetCard` instances
- **TooltipContent** — rendered by the `Tooltip` component internally

Components rendered in the StickerSheet that _support_ config but are _not_ configured in `advancedComponents`:

- Tag, Avatar, NudgeCard, DatePicker, Banner (not configurable via ComponentsConfig)

---

## Storybook Coverage

The `ThemeProvider.stories.tsx` file provides extensive examples of the `ComponentsConfig` feature:

| Story                                | Description                                                             |
| ------------------------------------ | ----------------------------------------------------------------------- |
| `SimpleComponentsConfig`             | Basic config: all buttons inherit `variant="secondary"`, `compact=true` |
| `ComponentsConfigWithLocalOverrides` | Shows local props overriding theme config                               |
| `NestedComponentsConfig`             | Parent sets Button config, child adds IconButton config (inheritance)   |
| `ComplexNestedComponentsConfig`      | 3-level deep nesting with config at each level                          |
| `NestedWithSelectiveOverrides`       | Mix of child providers with/without config overrides                    |
| `ComprehensiveExample`               | Combines global config, nested overrides, and local prop overrides      |
| `MergeClassNameAndStyleExample`      | Demonstrates `mergeClassNameAndStyle` flag behavior                     |

---

## Merge Utilities

### `mergeComponentProps` (`packages/web/src/utils/mergeComponentProps.ts`)

Used by each component to merge theme config with local props. Handles:

- Simple spread (when `mergeClassNameAndStyle` is false)
- Special `className`/`classNames`/`style`/`styles` merging (when true)

### `mergeComponentsConfig` (`packages/web/src/utils/mergeComponentsConfig.ts`)

A deep merge utility for combining two `ComponentsConfig` objects. **Currently unused** (the import is commented out in `ThemeProvider.tsx`). The current approach uses shallow merge at the component-key level, which is considered more predictable.

---

## Design Decisions & Rationale

1. **Separate from theme config:** Components config is kept separate from `ThemeConfig` to avoid polluting the theme with non-token data. Theme configs drive CSS variables; components config drives React props.

2. **Stored in theme context:** Despite being separate from the theme type, `components` is stored in the same `ThemeContext` (rather than a new context) for simpler access: `const { components, color, space } = useTheme()`.

3. **Inherited across nested ThemeProviders:** Unlike `theme` (which is not inherited), `components` is inherited from parent to child `ThemeProvider` via shallow merge.

4. **Industry alignment:** The pattern follows established libraries (Mantine, Material-UI, React Native Elements) where component defaults are configurable at the theme level.

5. **`Partial<ComponentProps>` typing:** Each component's config uses `Partial<BaseProps>`, allowing any prop to be set as a default. This is simpler than a nested `defaultProps` structure and matches industry conventions.
