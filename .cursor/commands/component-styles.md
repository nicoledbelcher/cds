Add/extend **CDS component styling hooks** (static className + sub-element selectors + `styles`/`classNames` props + `data-*` attributes + docs) for the currently open component.

This command is meant to be a **living playbook**: when we add a new styling hook, we also add it to the catalogs below with the reasoning.

## Goals

- Make it easy to target components in CSS and in QA tooling.
- Keep hooks **stable** across refactors.
- Avoid “over-hooking”: only add what’s useful and maintainable.
- Keep docs accurate via `stylesAPI`.

## Step 1. Identify platform + component shape

- **Web** (`packages/web`) supports: `className`, `style`, `styles`, `classNames`, static class names, and `data-*` attributes.
- **Mobile** (`packages/mobile`) supports: `style`, `styles` (StyleProp<ViewStyle>) — no DOM `className` / `data-*`.

Also classify:

- **Single-root component** vs **compound** (many internal parts)
- **Polymorphic** (supports `as`) vs fixed element
- **Interactive** (pressed/active/loading/disabled) vs display-only

## Step 2. Competitive parity (required for new selectors/attributes)

Before finalizing `selectors` + `dataAttributes`, do a quick pass on similar components in:

- Mantine
- Material UI
- Ant Design
- Radix
- Base UI

Use `.claude/agents/design-system-researcher.md` for the canonical list + repo paths. Goal: match the common “styling surface area” (parts + state hooks) when it maps cleanly to CDS.

## Step 3. Web implementation rules (how to add hooks)

### 3.1 Static root class name

Prefer the standard pattern:

```tsx
export const COMPONENT_STATIC_CLASSNAME = 'cds-ComponentName';
```

Apply to the root element (static first, user class last):

```tsx
<Root
  className={cx(COMPONENT_STATIC_CLASSNAME, /* internal styles */, classNames?.root, className)}
  {...props}
/>
```

### 3.2 `styles` + `classNames` props (slot-based)

Add **only the slots that correspond to stable, user-visible parts**.

```tsx
export type ComponentProps = {
  className?: string;
  style?: React.CSSProperties;
  styles?: {
    root?: React.CSSProperties;
    // other slots…
  };
  classNames?: {
    root?: string;
    // other slots…
  };
  // ...
};
```

Merge styles in the correct order:

```tsx
const rootStyle = useMemo(
  () => ({ ...style, ...styles?.root }),
  [style, styles?.root],
);
```

### 3.3 `data-*` attributes (state hooks)

Rules of thumb:

- **Only add data attributes that map to stable props/state**.
- Prefer **boolean attributes that disappear when false**:
  - `data-disabled={disabled || undefined}`
- Use explicit values when it’s always set:
  - `data-variant={variant}`
- Keep names **kebab-case** and semantic.

### 3.4 Sub-element selectors: when to add static class names for inner parts

Only add sub-element static class names when:

- Users commonly need to target that part from outside (CSS overrides, automation selectors).
- The part is stable (won’t disappear / rename frequently).

Pattern:

- `cds-ComponentName-{slot}` (e.g. `cds-Pagination-pageButton`)

## Step 4. Mobile implementation rules

Use slot-based `styles` with `StyleProp<ViewStyle>` (and similar for Text if applicable).

```tsx
export type ComponentProps = {
  style?: StyleProp<ViewStyle>;
  styles?: {
    root?: StyleProp<ViewStyle>;
    // other slots…
  };
};
```

Apply:

```tsx
<Root style={[styles?.root, style]} />
```

## Step 5. Tests (minimum)

Web (example):

```tsx
it('applies static className to root element', () => {
  render(<Component testID="test" />);
  expect(screen.getByTestId('test').className).toContain('cds-Component');
});

it('merges custom className with static className', () => {
  render(<Component testID="test" className="custom" />);
  const el = screen.getByTestId('test');
  expect(el.className).toContain('cds-Component');
  expect(el.className).toContain('custom');
});
```

If `styles`/`classNames` are introduced, add 1–2 tests that prove:

- `styles.root` applies
- merge order is correct
- `classNames.root` applies

## Step 6. Docs (styles tab)

Add/update `stylesAPI` in `webMetadata.json` / `mobileMetadata.json`.

Guidance:

- **selectors**: list slots (root + key sub-elements)
- **dataAttributes**: list every `data-*` hook we set, with condition + values

Then wire `_webStylesTable.mdx` and pass it to `ComponentTabsContainer` as `webStylesTable`.

## Step 7. Verification

```bash
yarn nx run <project>:test --testNamePattern="Component"
yarn nx run <project>:typecheck
yarn nx format:write
```

---

## Output requirement (agent must flag what it chose + why)

When finishing the implementation, include a section in the response:

- **Styling hooks added (and why)**:
  - **static class names**: list each one + catalog reason
  - **styles/classNames slots**: list each slot + catalog reason
  - **data attributes**: list each attribute + condition + values + catalog reason
  - **docs**: list which `stylesAPI` entries were added/updated

If you introduce a new slot or data attribute **not in the catalogs below**, you must:

- Add it to the catalog in this file with the reasoning
- Call that out in the “Styling hooks added (and why)” section

---

## Catalog: `data-*` attributes already present in this repo (web)

This is the current “known set” observed in `packages/web/src`. When choosing attributes, prefer ones from this list unless there’s a strong reason to introduce a new one.

### State + behavior attributes (reusable)

| Attribute | Values | Set when | Why / reasoning |
| --- | --- | --- | --- |
| `data-active` | boolean | element is active/pressed/selected in a way that changes styling | enables CSS for active/pressed states without coupling to internal classes |
| `data-loading` | boolean | loading UI is shown / interaction disabled | enables CSS targeting during loading states |
| `data-disabled` | boolean | disabled prop/state is true | stable external hook; commonly needed for overrides + QA |

### Variant / layout attributes (reusable)

| Attribute | Values | Set when | Why / reasoning |
| --- | --- | --- | --- |
| `data-variant` | string enum | variant prop is set (usually always) | key styling branch; avoids brittle selectors |
| `data-compact` | boolean | compact prop is true | common size/layout toggle |
| `data-block` | boolean | block prop is true | common layout toggle |
| `data-flush` | string enum | flush prop is set | layout edge-case for spacing |
| `data-transparent` | boolean | transparent prop is true | variant-like styling toggle |

### Component-specific attributes (only use where they apply)

| Attribute | Values | Set when | Why / reasoning |
| --- | --- | --- | --- |
| `data-filled` | boolean | boolean “filled/checked” visual state | used for Switch/Radio-like controls |
| `data-start` | boolean | start slot exists / compact implies start | enables spacing/layout adjustments based on slot presence |
| `data-labelvariant` | string enum | label placement variant is computed | enables style changes for inside/outside label variants |
| `data-shape` | string enum | component shape changes (e.g. avatar/image) | supports shape-specific styling rules |
| `data-colorscheme` | string enum | color scheme is selected | supports palette-specific styling rules |
| `data-selected` | boolean | selected state is true | stable selection hook |
| `data-bordered` | boolean | border is rendered | supports border/no-border rules |
| `data-icon-name` | string | icon glyph name | supports downstream QA tooling / debug selectors |

### Pagination-specific (example of component-scoped hooks)

| Attribute | Values | Set when | Why / reasoning |
| --- | --- | --- | --- |
| `data-direction` | `first \| previous \| next \| last` | navigation button direction | allows styling specific nav buttons without extra components |
| `data-pagenumber` | number | page button renders a given page | enables focus management + styling per page |
| `data-current` | boolean | current page | stable styling hook for “selected page” |
| `data-ellipsis` | boolean | ellipsis is rendered | styling hook for ellipsis element |
| `data-show-first-last-buttons` | boolean | config toggles first/last buttons | lets users style based on presence of extra controls |

### Stepper-specific

| Attribute | Values | Set when | Why / reasoning |
| --- | --- | --- | --- |
| `data-step-active` | boolean | step is active | styling hook for active step |
| `data-step-complete` | boolean | step is complete | styling hook for completed step |
| `data-step-descendent-active` | boolean | active step is a descendent | styling hook for nested-step context |
| `data-step-visited` | boolean | step has been visited | styling hook for visited step |

### Other observed attributes

| Attribute | Values | Set when | Why / reasoning |
| --- | --- | --- | --- |
| `data-offset` | boolean | offset behavior toggles | shape/layout-specific hook (e.g. Hexagon) |
| `data-hiddenunlessfocused` | boolean | “hide unless focused” behavior is enabled | styling hook for focus-driven nav visibility (Carousel nav) |

### Non-styling / testing-only attributes (do not document as styles API)

| Attribute | Why not |
| --- | --- |
| `data-testid` | testing-only; not a styling contract |

---

## Catalog: `styles` / `classNames` slot names already present in this repo (web)

These are slot keys observed in `styles?: { ... }` / `classNames?: { ... }` type definitions. Prefer reusing these names where they fit the same concept.

### Common slots

| Slot | Typical meaning | Why / reasoning |
| --- | --- | --- |
| `root` | outermost wrapper element | baseline styling override point; always include when exposing slots |
| `container` | inner layout wrapper (not necessarily the root) | used when root has multiple children or needs separation |
| `content` | main content wrapper | allows styling layout/content separately from chrome |
| `contentContainer` | wrapper that controls flex/grid behavior for content | common need when adding adornments |
| `childrenContainer` | wrapper around children specifically | separates “children layout” from other parts |
| `pressable` | interactive wrapper element | common override target for hover/active/disabled styling |
| `text` | text node wrapper | stable override point for typography tweaks |
| `label` | label text or label element | common form/control need |

### Text/content slots

| Slot | Typical meaning | Why / reasoning |
| --- | --- | --- |
| `title` | title text/element | common semantics + styling overrides |
| `subtitle` | subtitle text/element | common semantics + styling overrides |
| `description` | descriptive text/element | common semantics + styling overrides |
| `helperText` | helper/secondary text | common form/cell need |
| `meta` | small metadata text/element | supports “secondary info” styling |
| `metaContainer` | wrapper around meta region | layout separation |

### Layout/adornment slots

| Slot | Typical meaning | Why / reasoning |
| --- | --- | --- |
| `start` | left/start region | common header/cell pattern |
| `end` | right/end region | common header/cell pattern |
| `media` | media/avatar/icon slot | common cell/card pattern |
| `accessory` | accessory slot (badges, chevrons, etc.) | common need to style end adornments |
| `intermediary` | middle slot between media and end | supports complex row layouts |
| `logo` | brand/logo region | sidebar/header pattern |
| `icon` | icon element | stable override hook |

### Component-specific slots (use only where they apply)

| Slot | Typical meaning | Why / reasoning |
| --- | --- | --- |
| `navigation` | navigation control region | allows styling nav controls separate from content |
| `navigationButton` | nav button slot | used when you need to target nav buttons as a group |
| `pageButton` | page number button slot | pagination-specific styling |
| `ellipsis` | pagination ellipsis element | pagination-specific styling |
| `pagination` | pagination region | carousel/pagination containers |
| `dot` | pagination dot | carousel pagination dot styling |
| `previousButton` | previous navigation button | carousel navigation |
| `nextButton` | next navigation button | carousel navigation |
| `paddle` | paddle control | tabbed chips paddles |
| `tabs` | nested tabs root | tabbed chips integration |
| `scrollContainer` | scrollable wrapper | tabbed chips/carousel patterns |
| `carousel` | main carousel element | carousel-specific override point |
| `carouselContainer` | outer carousel wrapper | carousel-specific layout |
| `titleStack` | VStack of title/subtitle/description | cell patterns |
| `titleStackContainer` | wrapper controlling title stack flex | cell patterns |
| `step` | step subcomponent | stepper styling |
| `substepContainer` | container for nested steps | stepper styling |
| `header` | header region | stepper styling |
| `progress` | progress indicator element | progress bars/circles/stepper |
| `svg` | svg element | visualization components |
| `circle` | background circle | progress circle |
| `labelContainer` | wrapper around label | visualization components |
| `startLabel` | start label | progress bar w/ fixed labels |
| `endLabel` | end label | progress bar w/ fixed labels |
| `prefix` | prefix slot | rolling number formatting |
| `suffix` | suffix slot | rolling number formatting |
| `i18nPrefix` | Intl-generated prefix | rolling number formatting |
| `i18nSuffix` | Intl-generated suffix | rolling number formatting |
| `visibleContent` | visually rendered/animated wrapper | rolling number formatting |
| `formattedValueSection` | wrapper around formatted numeric value | rolling number formatting |
| `checkboxContainer` | checkbox control region | checkbox cell |
| `radioContainer` | radio control region | radio cell |

---

## Reference implementations

- Simple web: `packages/web/src/buttons/IconButton.tsx`
- Complex web: `packages/web/src/stepper/Stepper.tsx`, `packages/web/src/carousel/Carousel.tsx`
- Mobile: `packages/mobile/src/cells/Cell.tsx`
