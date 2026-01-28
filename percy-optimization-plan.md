# Percy Screenshot Optimization Plan

## Overview

This document tracks Percy screenshot usage across CDS Storybook components and identifies opportunities to consolidate multiple story exports into single "All" stories (following the pattern used in `LineChart.stories.tsx`).

**Current Total Percy Screenshots:** ~775

---

## Component Screen Count Inventory

| Component                                   | Screens | Verified |
| ------------------------------------------- | ------- | -------- |
| Colors                                      | 1       | ✓        |
| Components/AccessibilityAnnouncer           | 2       | ✓        |
| Components/Accordion                        | 7       | ✓        |
| Components/Alert                            | 5       | ✓        |
| Components/Alpha/Combobox                   | 48      | ✓        |
| Components/Alpha/Select/MultiSelect         | 26      | ✓        |
| Components/Alpha/Select/SingleSelect        | 52      | ✓        |
| Components/Alpha/SelectChip                 | 15      | ✓        |
| Components/alpha/TabbedChips                | 1       | ✓        |
| Components/Avatar                           | 4       | ✓        |
| Components/Banner                           | 5       | ✓        |
| Components/Box/Performance                  | 1       | ✓        |
| Components/Box (tsx)                        | 30      | ✓        |
| Components/Buttons/AvatarButton             | 1       | ✓        |
| Components/Buttons/Button                   | 3       | ✓        |
| Components/Buttons/ButtonGroup              | 3       | ✓        |
| Components/Buttons/IconButton               | 5       | ✓        |
| Components/Buttons/IconCounterButton        | 1       | ✓        |
| Components/Buttons/TileButton               | 1       | ✓        |
| Components/Cards                            | 8       | ✓        |
| Components/Cards/ContainedAssetCard         | 8       | ✓        |
| Components/Cards/ContentCard                | 2       | ✓        |
| Components/Cards/FloatingAssetCard          | 6       | ✓        |
| Components/Cards/NudgeCard                  | 8       | ✓        |
| Components/Cards/UpsellCard                 | 9       | ✓        |
| Components/Carousel                         | 1       | ✓        |
| Components/Cells/ContentCell                | 8       | ✓        |
| Components/Cells/ContentCellFallback        | 1       | ✓        |
| Components/Cells/ListCell                   | 18      | ✓        |
| Components/Cells/ListCellFallback           | 1       | ✓        |
| Components/Chart/AreaChart                  | 1       | ✓        |
| Components/Chart/Axis                       | 1       | ✓        |
| Components/Chart/BarChart                   | 1       | ✓        |
| Components/Chart/CartesianChart             | 1       | ✓        |
| Components/Chart/ChartText                  | 1       | ✓        |
| Components/Chart/Legend                     | 1       | ✓        |
| Components/Chart/LineChart                  | 1       | ✓        |
| Components/Chart/PeriodSelector             | 1       | ✓        |
| Components/Chart/ReferenceLine              | 1       | ✓        |
| Components/Checkbox                         | 11      | ✓        |
| Components/CheckboxCell                     | 13      | ✓        |
| Components/Chips/Chip                       | 1       | ✓        |
| Components/Chips/InputChip                  | 1       | ✓        |
| Components/Chips/MediaChip                  | 1       | ✓        |
| Components/Chips/SelectChip                 | 4       | ✓        |
| Components/Chips/TabbedChips                | 1       | ✓        |
| Components/Coachmark                        | 1       | ✓        |
| Components/Collapsible                      | 5       | ✓        |
| Components/ControlGroup                     | 5       | ✓        |
| Components/Dates/A11yTest                   | 1       | ✓        |
| Components/Dates/Calendar                   | 2       | ✓        |
| Components/Dates/DateInput                  | 3       | ✓        |
| Components/Dates/DatePicker                 | 5       | ✓        |
| Components/Divider                          | 4       | ✓        |
| Components/Dots/DotCount                    | 2       | ✓        |
| Components/Dots/DotStatusColor              | 1       | ✓        |
| Components/Dots/DotSymbol                   | 2       | ✓        |
| Components/Dropdown/Dropdown                | 12      | ✓        |
| Components/Dropdown/DropdownContent         | 1       | ✓        |
| Components/Fallback                         | 3       | ✓        |
| Components/FocusTrap                        | 2       | ✓        |
| Components/FullscreenAlert                  | 2       | ✓        |
| Components/FullscreenModal                  | 6       | ✓        |
| Components/FullscreenModalLayout            | 5       | ✓        |
| Components/Grid                             | 1       | ✓        |
| Components/Inputs/HelperText                | 4       | ✓        |
| Components/Inputs/InputIcon                 | 7       | ✓        |
| Components/Inputs/InputIconButton           | 7       | ✓        |
| Components/Inputs/InputLabel                | 4       | ✓        |
| Components/Inputs/NativeInput               | 4       | ✓        |
| Components/Inputs/SearchInput               | 2       | ✓        |
| Components/Inputs/TextInput                 | 31      | ✓        |
| Components/Inputs/TextInputPerformance      | 1       | ✓        |
| Components/InputStack                       | 3       | ✓        |
| Components/Interactable                     | 1       | ✓        |
| Components/Link                             | 12      | ✓        |
| Components/Loaders/CircularProgress         | 1       | ✓        |
| Components/Loaders/Spinner                  | 3       | ✓        |
| Components/LogoMark                         | 1       | ✓        |
| Components/Lottie                           | 1       | ✓        |
| Components/Motion/AnimatedCaret             | 1       | ✓        |
| Components/Motion/HintMotion                | 3       | ✓        |
| Components/Motion/Tokens                    | 1       | ✓        |
| Components/MultiContentModule               | 5       | ✓        |
| Components/Navigation/NavigationBar         | 6       | ✓        |
| Components/Navigation/NavigationTitle       | 9       | ✓        |
| Components/Navigation/NavigationTitleSelect | 5       | ✓        |
| Components/Navigation/NavLink               | 1       | ✓        |
| Components/Navigation/Sidebar               | 11      | ✓        |
| Components/OverlayContentContext            | 4       | ✓        |
| Components/PageFooter                       | 3       | ✓        |
| Components/PageHeader                       | 4       | ✓        |
| Components/Pagination                       | 2       | ✓        |
| Components/Patterns                         | 5       | ✓        |
| Components/PortalProvider                   | 1       | ✓        |
| Components/Pressable                        | 3       | ✓        |
| Components/ProgressBar                      | 17      | ✓        |
| Components/ProgressCircle                   | 12      | ✓        |
| Components/RadioCell                        | 17      | ✓        |
| Components/RadioGroup                       | 6       | ✓        |
| Components/Recipes/SearchInputMenu          | 1       | ✓        |
| Components/RemoteImage                      | 1       | ✓        |
| Components/RemoteImage/RemoteImageGroup     | 1       | ✓        |
| Components/Responsive Props                 | 7       | ✓        |
| Components/RollingNumber                    | 12      | ✓        |
| Components/SectionHeader                    | 1       | ✓        |
| Components/Segmented Control                | 2       | ✓        |
| Components/Select/Select                    | 9       | ✓        |
| Components/Select/SelectOption              | 1       | ✓        |
| Components/SparklineInteractive             | 24      | ✓        |
| Components/SparklineInteractiveHeader       | 6       | ✓        |
| Components/Stepper/Horizontal               | 8       | ✓        |
| Components/Stepper/Vertical                 | 7       | ✓        |
| Components/Switch                           | 13      | ✓        |
| Components/Table/Table                      | 4       | ✓        |
| Components/Table/TableCaption               | 1       | ✓        |
| Components/Table/TableCell                  | 5       | ✓        |
| Components/Table/TableCellFallback          | 1       | ✓        |
| Components/Table/TableRow                   | 1       | ✓        |
| Components/Table/TableSection               | 3       | ✓        |
| Components/Tabs/Segmented Tabs              | 1       | ✓        |
| Components/Tabs/TabIndicator                | 1       | ✓        |
| Components/Tabs/TabLabel                    | 1       | ✓        |
| Components/Tabs/TabNavigation               | 10      | ✓        |
| Components/Tag                              | 5       | ✓        |
| Components/Text (tsx)                       | 26      | ✓        |
| Components/ThemeProvider                    | 1       | ✓        |
| Components/Toast                            | 1       | ✓        |
| Components/Tooltip/Tooltip                  | 2       | ✓        |
| Components/Tooltip/TooltipContent           | 5       | ✓        |
| Components/Tour                             | 6       | ✓        |
| Components/Tray                             | 1       | ✓        |
| Examples/Layouts                            | 1       | ✓        |
| Hooks/useMediaQuery                         | 1       | ✓        |
| Hooks/useBreakpoints                        | 1       | ✓        |
| Icons                                       | 10      | ✓        |
| Illustrations                               | 13      | ✓        |

---

## ⚠️ Components Excluded from Optimization

The following components are in `.percy.js` exclude list and should **NOT** be modified:

```javascript
exclude: [
  'Core Components/AccessibilityAnnouncer',
  'Interactive/Table',
  'Interactive/TabNavigation',
  'Interactive/Dropdown',
  'Interactive/TextInput',
  'Interactive/Select',
  'Components/Modal',
  'Components/Chart/ChartText: Interactive Chart Text Group',
  'Components/SparklineInteractive: Fallback Compact',
  'Components/SparklineInteractive: Fallback Negative',
  'Components/SparklineInteractive: Fallback Positive',
  'Components/LottieStatusAnimation: Default',
  'Components/Loaders/MaterialSpinner: Material Spinner Default',
  'Components/Chart/LineChart: Transitions',
];
```

This means the following are already excluded or should be approached carefully:

- `Components/Table/*` - covered by `Interactive/Table`
- `Components/Tabs/TabNavigation` - covered by `Interactive/TabNavigation`
- `Components/Dropdown/*` - covered by `Interactive/Dropdown`
- `Components/Inputs/TextInput` - covered by `Interactive/TextInput`
- `Components/Select/*` and `Components/Alpha/Select/*` - covered by `Interactive/Select`

---

## 🎯 Optimization Candidates

### High Priority (10+ screens)

| Component                     | Current | After  | Saved   | Status  |
| ----------------------------- | ------- | ------ | ------- | ------- |
| Components/Box (tsx)          | 30      | 1      | 29      | ✅ DONE |
| Components/Cells/ListCell     | 18      | 1      | 17      | ✅ DONE |
| Components/RadioCell          | 17      | 1      | 16      | ✅ DONE |
| Components/ProgressBar        | 17      | 1      | 16      | ✅ DONE |
| Components/CheckboxCell       | 13      | 1      | 12      | ✅ DONE |
| Components/Switch             | 13      | 1      | 12      | ✅ DONE |
| Components/Link               | 12      | 1      | 11      | ✅ DONE |
| Components/ProgressCircle     | 12      | 1      | 11      | ✅ DONE |
| Components/RollingNumber      | 12      | 1      | 11      | ✅ DONE |
| Components/Checkbox           | 11      | 1      | 10      | ✅ DONE |
| Components/Navigation/Sidebar | 11      | 1      | 10      | ✅ DONE |
| **Subtotal**                  | **166** | **11** | **155** |         |

### Medium Priority (5-9 screens)

| Component                             | Current | After  | Saved  | Status  |
| ------------------------------------- | ------- | ------ | ------ | ------- |
| Components/Navigation/NavigationTitle | 9       | 1      | 8      | ✅ DONE |
| Components/Cards/UpsellCard           | 9       | 1      | 8      | ✅ DONE |
| Components/Cards                      | 8       | 1      | 7      | ✅ DONE |
| Components/Cards/ContainedAssetCard   | 8       | 1      | 7      | ✅ DONE |
| Components/Cards/NudgeCard            | 8       | 1      | 7      | ✅ DONE |
| Components/Cells/ContentCell          | 8       | 1      | 7      | ✅ DONE |
| Components/Stepper/Horizontal         | 8       | 1      | 7      | ✅ DONE |
| Components/Responsive Props           | 7       | 1      | 6      | ✅ DONE |
| Components/Accordion                  | 7       | 1      | 6      | ✅ DONE |
| Components/Inputs/InputIcon           | 7       | 1      | 6      | ✅ DONE |
| Components/Inputs/InputIconButton     | 7       | 1      | 6      | ✅ DONE |
| Components/Stepper/Vertical           | 7       | 1      | 6      | ✅ DONE |
| **Subtotal**                          | **93**  | **12** | **81** |         |

---

## 📊 Projected Savings Summary

| Priority  | Before  | After  | Saved   |
| --------- | ------- | ------ | ------- |
| High      | 166     | 11     | 155     |
| Medium    | 93      | 12     | 81      |
| **Total** | **259** | **23** | **236** |

- **Total reduction:** 236 Percy screenshots (~91% reduction for optimized components)
- **Overall impact:** ~30% reduction in total Percy usage (236 of ~775)

---

## 📝 Implementation Checklist

For each component being consolidated:

- [ ] Create an `All` story that renders all examples in a single view
- [ ] Keep individual stories for development/documentation purposes (they just won't be Percy-tested)
- [ ] Use the `Example` wrapper pattern from `LineChart.stories.tsx` for consistent formatting
- [ ] **Update the storybook link in docs** - links may change from `?path=/story/components-box--default` to `?path=/story/components-box--all`
- [ ] Verify Percy is capturing the consolidated story correctly
- [ ] Update this document with completion status

---

## 🔗 Documentation Link Updates Required

When consolidating stories, the Storybook URLs will change. For example:

**Before:**

```
/story/components-checkbox--normal
/story/components-checkbox--custom-color
/story/components-checkbox--indeterminate
...
```

**After:**

```
/story/components-checkbox--all
```

### Files that may need link updates:

- `apps/docs/` - Documentation website
- README files
- Any internal wikis or Confluence pages
- Figma component documentation links

---

## 📋 Reference Implementation

See `packages/web-visualization/src/chart/line/__stories__/LineChart.stories.tsx` for the pattern:

```tsx
const Example: React.FC<{ title: string; description?: string }> = ({
  children,
  title,
  description,
}) => {
  return (
    <VStack gap={2}>
      <Text as="h2" display="block" font="title3">
        {title}
      </Text>
      {description}
      {children}
    </VStack>
  );
};

export const All = () => {
  return (
    <VStack gap={2}>
      <Example title="Basic">{/* Component example */}</Example>
      <Example title="With Props">{/* Another example */}</Example>
      {/* ... more examples */}
    </VStack>
  );
};
```

---

## 📅 Change Log

| Date       | Change                                      | Author |
| ---------- | ------------------------------------------- | ------ |
| 2026-01-27 | Initial optimization plan created           | -      |
| 2026-01-27 | Completed all 11 high-priority components   | -      |
| 2026-01-27 | Completed all 12 medium-priority components | -      |
