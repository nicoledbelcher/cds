# Theme-Level Component Props — Progress Tracker

Tracking adoption of `mergeComponentProps` + `ComponentTheme` registration across CDS web components so that themes can configure default props at the `ThemeProvider` level.

**Pattern reference**: See `.cursor/rules/theme-level-component-props.mdc` for implementation instructions.

**Key files**:

- `packages/web/src/core/theme.ts` — `ComponentTheme` type (register components here)
- `packages/web/src/utils/mergeComponentProps.ts` — merge utility
- `packages/web/src/buttons/Button.tsx` — canonical reference implementation

---

## Status

| Component        | Priority | Location                       | Alpha?               | Status          |
| ---------------- | -------- | ------------------------------ | -------------------- | --------------- |
| Button           | **High** | `buttons/Button.tsx`           | No                   | Done            |
| IconButton       | **High** | `buttons/IconButton.tsx`       | No                   | Done            |
| TextInput        | **High** | `controls/TextInput.tsx`       | No                   | Done            |
| InputIconButton  | **High** | `controls/InputIconButton.tsx` | No                   | Done            |
| Select           | **High** | `alpha/select/Select.tsx`      | **Yes — alpha only** | Done            |
| SearchInput      | **High** | `controls/SearchInput.tsx`     | No                   | Done            |
| Checkbox         | **High** | `controls/Checkbox.tsx`        | No                   | Done            |
| Chip (all chips) | **High** | `chips/Chip.tsx`               | No                   | Done            |
| Radio            | **High** | `controls/Radio.tsx`           | No                   | Done            |
| Switch           | **High** | `controls/Switch.tsx`          | No                   | Done            |
| Dropdown         | **High** | `dropdown/Dropdown.tsx`        | No                   | Done            |
| Modal            | **High** | `overlays/modal/Modal.tsx`     | No                   | Done            |
| ListCell         | **High** | `cells/ListCell.tsx`           | No                   | Done            |
| DotCount         | **High** | `dots/DotCount.tsx`            | No                   | Done            |
| Tag              | Normal   | `tag/Tag.tsx`                  | No                   | Done            |
| SegmentedTabs    | Normal   | `tabs/SegmentedTabs.tsx`       | No                   | Done (via Tabs) |
| DatePicker       | Normal   | `dates/DatePicker.tsx`         | No                   | Done            |
| Tabs             | Normal   | `tabs/Tabs.tsx`                | No                   | Done            |
| NudgeCard        | Normal   | `cards/NudgeCard.tsx`          | No                   | Done            |
| UpsellCard       | Normal   | `cards/UpsellCard.tsx`         | No                   | Done            |
| TableCell        | Normal   | `tables/TableCell.tsx`         | No                   | Done            |
| TableHeader      | Normal   | `tables/TableHeader.tsx`       | No                   | Done            |
| Alert            | Normal   | `overlays/Alert.tsx`           | No                   | Done            |
| Coachmark        | Normal   | `coachmark/Coachmark.tsx`      | No                   | Done            |
| StickyFooter     | Normal   | TBD                            | No                   | Not started     |
| Toast            | Normal   | `overlays/Toast.tsx`           | No                   | Done            |
| Tooltip          | Normal   | `overlays/tooltip/Tooltip.tsx` | No                   | Done            |

---

## Notes

- **Alpha rule**: If a component has an alpha version, apply the pattern **only to the alpha version**.
  - Current alpha components: `alpha/select`, `alpha/combobox`, `alpha/data-card`
- **SegmentedTabs**: Inherits theme config through `Tabs` — no separate registration needed.
- **Chip**: The base `Chip` component is registered. `InputChip`, `SelectChip`, and `MediaChip` all compose `Chip` internally so they inherit the theme config.
- **StickyFooter**: Specifically the Button within it needs theme prop support. Pending — location TBD.
- More components may be added to this list.
