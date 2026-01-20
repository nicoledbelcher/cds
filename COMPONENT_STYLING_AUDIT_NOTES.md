# Component styling audit notes (static classNames + data attributes)

This file consolidates the notes from our audit work around:

- **Static className hooks** (root + sub-elements)
- **State/prop-driven data attributes** (for CSS targeting)
- **Docs wiring** (styles tab via `stylesAPI` metadata)

These notes are **best-effort** and based on repo scans plus the “missing features” discussion; they’re meant as a worklist, not an exhaustive guarantee.

---

## Terminology / patterns used in this repo

### Static className patterns observed

- **Standard pattern** (most common):
  - `COMPONENT_STATIC_CLASSNAME = 'cds-ComponentName'`
  - Applied to the component’s **root element** via `cx(COMPONENT_STATIC_CLASSNAME, …)`
- **Alternate exported constants** (already present in some components):
  - `tagStaticClassName = 'cds-tag'` (`packages/web/src/tag/Tag.tsx`)
  - `tableHeaderStaticClassName = 'cds-table-header'` (`packages/web/src/tables/TableHeader.tsx`)
  - `selectOptionStaticClassName = 'cds-select-option'` (`packages/web/src/controls/SelectOption.tsx`)
  - `dropdownStaticClassName = 'cds-dropdown'` (`packages/web/src/dropdown/DropdownContent.tsx`)

### Data attribute patterns observed

Common state hooks used across web components:

- `data-disabled`
- `data-active`
- `data-loading`
- `data-variant`
- `data-compact`
- plus component-specific attributes (e.g. `data-shape`, `data-filled`, `data-step-active`, etc.)

---

## Components that currently include `COMPONENT_STATIC_CLASSNAME` (packages/web)

Repo scan results (files containing `COMPONENT_STATIC_CLASSNAME`):

- `packages/web/src/buttons/Button.tsx`
- `packages/web/src/buttons/IconButton.tsx`
- `packages/web/src/cells/Cell.tsx`
- `packages/web/src/cells/ListCell.tsx`
- `packages/web/src/collapsible/Collapsible.tsx`
- `packages/web/src/controls/Control.tsx`
- `packages/web/src/controls/Switch.tsx`
- `packages/web/src/icons/Icon.tsx`
- `packages/web/src/loaders/Spinner.tsx`
- `packages/web/src/media/Avatar.tsx`
- `packages/web/src/media/RemoteImage.tsx`
- `packages/web/src/navigation/NavigationBar.tsx`
- `packages/web/src/system/Interactable.tsx`
- `packages/web/src/pagination/Pagination.tsx`

---

## Components that already have “styling hooks” (starter inventory table)

This is a **starter set** to help pick “easy wins”. “Yes” is based on quick repo scans and/or known implementations; “Partial” means the hook exists but not uniformly (e.g., only in subcomponents).

| Component | Static class hook | Meaningful data attrs | `styles`/`classNames` API | Docs `stylesAPI` + styles tab |
| --- | --- | --- | --- | --- |
| `Button` (`packages/web/src/buttons/Button.tsx`) | Yes (`COMPONENT_STATIC_CLASSNAME`) | Yes (`data-variant`, `data-disabled`, …) | No (no `styles`/`classNames` object props found in scan) | Yes (`apps/docs/.../Button/webMetadata.json`) |
| `IconButton` (`packages/web/src/buttons/IconButton.tsx`) | Yes (`COMPONENT_STATIC_CLASSNAME`) | Yes (`data-variant`, `data-compact`, …) | No (no `styles`/`classNames` object props found in scan) | No |
| `Pagination` (`packages/web/src/pagination/Pagination.tsx`) | Yes (`COMPONENT_STATIC_CLASSNAME`) | Yes (`data-disabled`, `data-pagenumber`, …) | Yes (`styles` + `classNames`) | Yes (`apps/docs/.../Pagination/webMetadata.json`) |
| `Cell` (`packages/web/src/cells/Cell.tsx`) | Yes (`COMPONENT_STATIC_CLASSNAME`) | No/Unknown | Yes (`styles` + `classNames`) | No |
| `ListCell` (`packages/web/src/cells/ListCell.tsx`) | Yes (`COMPONENT_STATIC_CLASSNAME`) | No/Unknown | Yes (`styles` + `classNames`) | No |
| `Icon` (`packages/web/src/icons/Icon.tsx`) | Yes (`COMPONENT_STATIC_CLASSNAME`) | Yes (e.g. `data-icon-name`) | Yes (`styles` + `classNames`) | No |
| `Avatar` (`packages/web/src/media/Avatar.tsx`) | Yes (`COMPONENT_STATIC_CLASSNAME`) | Yes (`data-colorscheme`, `data-selected`, `data-shape`, …) | No/Unknown | No |
| `RemoteImage` (`packages/web/src/media/RemoteImage.tsx`) | Yes (`COMPONENT_STATIC_CLASSNAME`) | Yes (`data-shape`) | No/Unknown | No |
| `Switch` (`packages/web/src/controls/Switch.tsx`) | Yes (`COMPONENT_STATIC_CLASSNAME`) | Yes (`data-filled`) | No/Unknown | No |
| `Interactable` (`packages/web/src/system/Interactable.tsx`) | Yes (`COMPONENT_STATIC_CLASSNAME`) | Yes (`data-disabled`) | No/Unknown | No |
| `Pressable` (`packages/web/src/system/Pressable.tsx`) | No | Yes (`data-active`, `data-loading`) | No/Unknown | No |
| `Stepper` (`packages/web/src/stepper/Stepper.tsx`) | No/Unknown | Partial (mostly in `DefaultStepper*` pieces) | Yes (`styles` + `classNames`) | No |
| `Carousel` (`packages/web/src/carousel/Carousel.tsx`) | No/Unknown | Partial (e.g. `DefaultCarouselPagination`) | Yes (`styles` + `classNames`) | No |
| `Sidebar` (`packages/web/src/navigation/Sidebar.tsx`) | No/Unknown | No/Unknown | Yes (`styles` + `classNames`) | No |

### Alternate static class hook pattern (not `COMPONENT_STATIC_CLASSNAME`)

These already have a static class hook, just using a different constant name:

- `Tag` (`packages/web/src/tag/Tag.tsx`) — `tagStaticClassName = 'cds-tag'`
- `TableHeader` (`packages/web/src/tables/TableHeader.tsx`) — `tableHeaderStaticClassName = 'cds-table-header'`
- `SelectOption` (`packages/web/src/controls/SelectOption.tsx`) — `selectOptionStaticClassName = 'cds-select-option'`
- `DropdownContent` (`packages/web/src/dropdown/DropdownContent.tsx`) — `dropdownStaticClassName = 'cds-dropdown'`

---

## Components that already expose `styles` / `classNames` object props (web)

These are often **easy wins** for adding a static root class hook + styles docs, since the public “styling surface” already exists.

Repo scan results:

- `packages/web/src/alpha/tabbed-chips/TabbedChips.tsx`
- `packages/web/src/carousel/Carousel.tsx`
- `packages/web/src/carousel/DefaultCarouselNavigation.tsx`
- `packages/web/src/carousel/DefaultCarouselPagination.tsx`
- `packages/web/src/cells/Cell.tsx`
- `packages/web/src/cells/ContentCell.tsx`
- `packages/web/src/cells/ListCell.tsx`
- `packages/web/src/cells/ListCellFallback.tsx`
- `packages/web/src/controls/CheckboxCell.tsx`
- `packages/web/src/controls/RadioCell.tsx`
- `packages/web/src/dots/DotCount.tsx`
- `packages/web/src/icons/Icon.tsx`
- `packages/web/src/navigation/Sidebar.tsx`
- `packages/web/src/numbers/RollingNumber/RollingNumber.tsx`
- `packages/web/src/page/PageHeader.tsx`
- `packages/web/src/pagination/Pagination.tsx`
- `packages/web/src/stepper/Stepper.tsx`
- `packages/web/src/visualizations/ProgressBar.tsx`
- `packages/web/src/visualizations/ProgressBarWithFixedLabels.tsx`
- `packages/web/src/visualizations/ProgressBarWithFloatLabel.tsx`
- `packages/web/src/visualizations/ProgressCircle.tsx`

---

## Components that already set “meaningful” `data-*` attributes (web)

These already have state/prop hooks suitable for CSS targeting (excluding `data-testid`-only usage).

Repo scan results (representative files):

- `packages/web/src/buttons/Button.tsx`
- `packages/web/src/buttons/IconButton.tsx`
- `packages/web/src/controls/TextInput.tsx`
- `packages/web/src/controls/Checkbox.tsx`
- `packages/web/src/controls/Radio.tsx`
- `packages/web/src/controls/Switch.tsx`
- `packages/web/src/controls/NativeTextArea.tsx`
- `packages/web/src/media/Avatar.tsx`
- `packages/web/src/media/RemoteImage.tsx`
- `packages/web/src/navigation/NavLink.tsx`
- `packages/web/src/system/ButtonOrLink.tsx`
- `packages/web/src/system/Interactable.tsx`
- `packages/web/src/system/Pressable.tsx`
- `packages/web/src/stepper/DefaultStepperStepHorizontal.tsx` (and other `DefaultStepper*` files)
- `packages/web/src/carousel/DefaultCarouselPagination.tsx`
- `packages/web/src/pagination/DefaultPaginationNavigationButton.tsx`
- `packages/web/src/pagination/Pagination.tsx`
- `packages/web/src/typography/Link.tsx`

---

## Docs that already have `stylesAPI` metadata wired (web)

Repo scan results (`apps/docs/docs/components/**/webMetadata.json` containing `"stylesAPI": { ... }`):

- `apps/docs/docs/components/inputs/Button/webMetadata.json`
- `apps/docs/docs/components/navigation/Pagination/webMetadata.json`

---

## Components we previously identified as missing `COMPONENT_STATIC_CLASSNAME` (high-signal list)

These were called out during the audit as **user-facing components** that would benefit from the standard static-root class hook, but did not appear to use `COMPONENT_STATIC_CLASSNAME` at the time they were reviewed.

### Typography

- `packages/web/src/typography/Text.tsx`
- `packages/web/src/typography/Link.tsx`

### Banner / Cards / Carousel

- `packages/web/src/banner/Banner.tsx`
- `packages/web/src/cards/Card.tsx` (and many related card components)
- `packages/web/src/carousel/Carousel.tsx`

### Chips

- `packages/web/src/chips/Chip.tsx`
- `packages/web/src/chips/InputChip.tsx`
- `packages/web/src/chips/SelectChip.tsx`
- `packages/web/src/chips/MediaChip.tsx`
- `packages/web/src/chips/TabbedChips.tsx`

### Controls

- `packages/web/src/controls/TextInput.tsx`

### Tabs / Pagination / Tables

- `packages/web/src/tabs/Tabs.tsx`
- `packages/web/src/tabs/SegmentedTabs.tsx`
- `packages/web/src/pagination/Pagination.tsx` (**now implemented**)
- `packages/web/src/tables/Table.tsx`

### Overlays

- `packages/web/src/overlays/modal/Modal.tsx`
- `packages/web/src/overlays/Alert.tsx`
- `packages/web/src/overlays/tooltip/Tooltip.tsx`
- `packages/web/src/overlays/popover/Popover.tsx`
- `packages/web/src/overlays/tray/Tray.tsx`

### Navigation / Other

- `packages/web/src/navigation/Sidebar.tsx`
- `packages/web/src/accordion/Accordion.tsx`
- `packages/web/src/dropdown/Dropdown.tsx`
- `packages/web/src/dates/DatePicker.tsx`
- `packages/web/src/dates/Calendar.tsx`
- `packages/web/src/numbers/RollingNumber/RollingNumber.tsx`
- `packages/web/src/section-header/SectionHeader.tsx`
- `packages/web/src/page/PageHeader.tsx`
- `packages/web/src/page/PageFooter.tsx`
- `packages/web/src/stepper/Stepper.tsx`
- `packages/web/src/tour/Tour.tsx`
- `packages/web/src/alpha/select/Select.tsx`
- `packages/web/src/alpha/combobox/Combobox.tsx`

### Note on “missing” vs “alternate pattern”

Some components already had static class hooks but **not** via `COMPONENT_STATIC_CLASSNAME` (see “Alternate exported constants” above).

---

## Components that would benefit from *more* data attributes (high-signal list)

The goal here is to add stable “styling hooks” driven by state/props (not to replace ARIA attributes).

### Overlays (visible/open state)

Common candidates:

- `Modal` — `data-visible`, potentially `data-disable-overlay-press`, etc.
- `Alert` — `data-visible`, `data-stacked`, `data-action-layout`
- `Tooltip` — `data-visible` (open state)
- `Popover` — `data-visible`, `data-disabled`, `data-block`
- `Tray` — `data-visible`
- `Dropdown` — `data-visible`, `data-disabled`

### Variant / configuration driven

Common candidates:

- `Banner` — `data-variant`, `data-style-variant`, `data-collapsed` (if collapsible)
- `Card` — `data-size`, `data-clickable` (if linkable/button-like)
- `Chip` family — `data-compact`, `data-selected`, `data-inverted`
- `Carousel` — `data-drag`, `data-snap-mode`, `data-hide-navigation`, `data-hide-pagination`

### Navigation / selection state

Common candidates:

- `Tabs` — `data-disabled`, maybe `data-active-tab` on root (careful: avoid huge attribute values)
- `Sidebar` — `data-collapsed` (if applicable) + active item hooks
- `Accordion` — `data-active-key`/active state hooks (may be better on items than provider)
- `Pagination` — good candidates are `data-disabled`, `data-current-page`, `data-show-first-last-buttons`

### Input state

Common candidates:

- `TextInput` — already has `data-compact`, `data-labelvariant`, `data-start`; could consider:
  - `data-disabled`
  - `data-variant`
  - `data-focused` (if focus state is tracked at the container level)

---

## Pagination: what was implemented (static classNames + data attributes + docs)

Pagination received a more complete “styles API”:

### Static classNames

- Root: `cds-Pagination`
- Sub-elements:
  - `cds-Pagination-navigationButton`
  - `cds-Pagination-pageButton`
  - `cds-Pagination-ellipsis`

### Data attributes

- Root:
  - `data-disabled`
  - `data-show-first-last-buttons`
- Child hooks (as implemented):
  - `data-pagenumber` (page buttons)
  - `data-direction` (navigation buttons)

### Docs wiring

Pagination docs now include:

- `apps/docs/docs/components/navigation/Pagination/webMetadata.json`:
  - `stylesAPI.staticClassName`
  - `stylesAPI.selectors` for root + sub-elements
  - `stylesAPI.dataAttributes` describing the data hooks
- `apps/docs/docs/components/navigation/Pagination/_webStylesTable.mdx`
- `apps/docs/docs/components/navigation/Pagination/index.mdx` updated to pass `webStylesTable`

---

## Docs + troubleshooting notes

### Styles tab wiring checklist

When adding styles docs for a web component:

- Add `stylesAPI` to the component’s `webMetadata.json`
- Add `_webStylesTable.mdx`:
  - `import webMetadata from './webMetadata.json';`
  - `<ComponentStylesTable stylesAPI={webMetadata.stylesAPI} />`
- Pass `webStylesTable={<WebStylesTable />}` into `ComponentTabsContainer` in `index.mdx`

### If you see MDX runtime errors when adding `_webStylesTable.mdx`

Example error observed:

- `Cannot read properties of undefined (reading 'default')`

Notes:

- The import pattern matches other working docs (e.g. Button). If it fails in dev, try restarting the Docusaurus dev server and/or clearing `.docusaurus` output caches.

---

## Suggested “next components” worklist (high priority)

If continuing the “add styling hooks” rollout, these are good candidates based on usage + configurability:

- `Text`, `Link` (typography fundamentals)
- `Banner`
- `Card` (and primary card variants)
- `Chip` (and Chip variants)
- `Modal` / `Alert` / `Tooltip` / `Tray` / `Dropdown`
- `Tabs`
- `Carousel`

