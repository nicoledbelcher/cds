# Chart Interaction Experience Revamp - Research Document

## Overview

This document outlines research and recommendations for revamping the chart interaction experience in CDS visualization packages (`@coinbase/cds-web-visualization` and `@coinbase/cds-mobile-visualization`).

### Goals

1. Support future **polar charts** (radar, pie, donut, etc.)
2. Improve **mobile accessibility** (currently lacking in charts, but present in deprecated Sparkline)
3. Support **controlled state** for interactions
4. Add **series-level and data-index-level interaction scope** (similar to MUI X Charts' tooltip triggers)
5. Support **multi-touch** interactions
6. Maintain **backwards compatibility** with existing `enableScrubbing` and `onScrubberPositionChange` props
7. Reserve **"highlight" terminology** for future programmatic visual emphasis features

---

## Industry Terminology Comparison

| Concept                             | MUI X Charts                                     | Recharts                                    | CDS (Proposed)                          |
| ----------------------------------- | ------------------------------------------------ | ------------------------------------------- | --------------------------------------- |
| **Enable/disable user interaction** | Tooltip `trigger: 'none'`, `disableAxisListener` | `<Tooltip content={() => null} />`          | `interaction="none"`                    |
| **Single-point interaction**        | Tooltip `trigger: 'item'`                        | Tooltip `trigger: 'hover'`                  | `interaction="single"`                  |
| **Axis-based interaction**          | Tooltip `trigger: 'axis'`                        | Tooltip `shared={true}`                     | `interactionScope: { dataIndex: true }` |
| **Currently active item**           | `highlightedItem`                                | `activeIndex` (deprecated), `activePayload` | `activeItem`                            |
| **Callback on change**              | `onHighlightChange`                              | N/A (managed internally)                    | `onInteractionChange`                   |
| **Scope of what's affected**        | `highlighting.highlight`, `highlighting.fade`    | N/A                                         | `interactionScope`                      |
| **Programmatic visual emphasis**    | `highlighting` prop                              | N/A                                         | Future: `highlightedItems`              |

**Key Insight**: MUI conflates "highlighting" (visual emphasis) with "interaction" (user engagement). Recharts uses "active" terminology. We recommend separating these concepts.

---

## Current Implementation Analysis

### Web (`ScrubberProvider.tsx`)

- Manages scrubber position via local `useState`
- Attaches mouse/touch/keyboard event listeners to SVG element
- Converts pointer X position to data index
- Handles keyboard navigation (Arrow keys, Home, End, Escape)
- Tightly coupled to Cartesian chart coordinate system

### Mobile (`ScrubberProvider.tsx`)

- Uses `react-native-reanimated` `SharedValue` for scrubber position
- Uses `react-native-gesture-handler` for long-press pan gesture
- Converts touch X position to data index via worklet-compatible functions
- Provides haptic feedback
- **Not accessible** - no VoiceOver/TalkBack support

### Mobile Sparkline Accessibility (`SparklineAccessibleView.tsx`)

- Chunks data into ~10 accessible regions
- Each region has `accessibilityLabel` with date and value
- Provides basic screen reader support

---

## Industry Research

### MUI X Charts

MUI X Charts provides a comprehensive highlighting system with several key concepts:

#### Highlighting API

```tsx
<BarChart
  highlighting={{
    highlight: 'item', // 'none' | 'item' | 'series'
    fade: 'global', // 'none' | 'series' | 'global'
  }}
  onHighlightChange={(highlightedItem) => {
    // { seriesId: string | null, dataIndex: number | null }
  }}
/>
```

#### Key Concepts

| Concept          | Description                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `highlight`      | What gets emphasized: `'none'`, `'item'` (single data point), `'series'` (entire series)                      |
| `fade`           | What gets de-emphasized: `'none'`, `'series'` (same series stays visible), `'global'` (everything else fades) |
| `highlightScope` | Granular control: `{ highlight: string, fade: string }`                                                       |

#### Tooltip Trigger Types

| Trigger  | Behavior                                                  |
| -------- | --------------------------------------------------------- |
| `'item'` | Shows tooltip when hovering over a specific data point    |
| `'axis'` | Shows tooltip for all series at the current axis position |
| `'none'` | Tooltip disabled                                          |

#### Controlled State

```tsx
const [highlightedItem, setHighlightedItem] = useState<{
  seriesId: string | null;
  dataIndex: number | null;
} | null>(null);

<LineChart highlightedItem={highlightedItem} onHighlightChange={setHighlightedItem} />;
```

### Recharts

Recharts takes a different approach with more implicit highlighting:

#### Active Index System (Pre-v3.0)

```tsx
// Deprecated in v3.0 - internal state conflicts
<LineChart activeIndex={2}>
```

#### Tooltip-Driven Highlighting (v3.0+)

```tsx
<Tooltip
  trigger="hover" | "click"
  shared={true}  // Show all series at axis position
  active={true}  // Controlled visibility
  defaultIndex={0}  // Initial position
/>
```

#### Event Types

| Event Type | Behavior                                    |
| ---------- | ------------------------------------------- |
| `'axis'`   | Triggers tooltip for all data at X position |
| `'item'`   | Triggers tooltip for specific data point    |

#### Accessibility Layer

```tsx
<LineChart accessibilityLayer>{/* Adds ARIA labels, roles, keyboard controls */}</LineChart>
```

Keyboard navigation:

- `←` / `→`: Navigate data points
- `Home` / `End`: Jump to first/last
- Announces data via ARIA live regions

### Victory Charts (React Native)

Victory provides accessibility through:

- `aria-label` and `tabIndex` props on data components
- Custom `VictoryVoronoiContainer` for nearest-point detection
- No built-in chunked accessibility regions

### SciChart (Polar Charts Reference)

SciChart demonstrates polar chart interactions:

- Radial highlighting based on angle and radius
- Different interaction patterns than Cartesian (no left/right navigation)
- Touch interactions map to polar coordinates

---

## Proposed Architecture

### Naming Recommendations

**Important Distinction**: "Highlight" should be reserved for **programmatic visual emphasis** (a future feature), while what we're building is **user interaction** handling.

| Concept         | Description                                              | Future Use      |
| --------------- | -------------------------------------------------------- | --------------- |
| **Interaction** | How users engage with the chart (touch, hover, keyboard) | Current feature |
| **Active Item** | Which item the user is currently interacting with        | Current feature |
| **Highlight**   | Visual emphasis on specific data (could be programmatic) | Future feature  |
| **Selection**   | User explicitly chose items (persistent)                 | Future feature  |

#### Provider Naming Options

| Name                      | Pros                                                     | Cons                                  |
| ------------------------- | -------------------------------------------------------- | ------------------------------------- |
| **`InteractionProvider`** | Clear intent, leaves room for future `HighlightProvider` | Slightly generic                      |
| **`ActiveItemProvider`**  | Specific about what it manages                           | Doesn't convey multi-touch            |
| **`FocusProvider`**       | Accessibility-oriented                                   | Conflicts with browser focus concepts |

**Recommendation**: Use `InteractionProvider` internally, expose as `interaction*` props on charts. Reserve `highlight*` for future programmatic highlighting features.

### Core Types

```typescript
// Interaction mode - how many simultaneous interactions to track
type InteractionMode = 'none' | 'single' | 'multi';

// What aspects of the data can be interacted with
type InteractionScope = {
  dataIndex?: boolean; // Default: true for Cartesian
  series?: boolean; // Default: false for Cartesian
};

// Single active item state
type ActiveItem = {
  dataIndex: number | null; // null = interacting but not on a point
  seriesId: string | null; // null = no specific series (or series scope disabled)
};

// Multi-touch active items state
type ActiveItems = Array<ActiveItem>;

// Unified interaction state
type InteractionState = ActiveItem | ActiveItems | undefined;

// undefined = not interacting
// null values = interacting but not over specific item/series
// defined values = interacting with specific item/series
```

### Null vs Undefined Convention

| Value                                   | Meaning                                                                       |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| `undefined`                             | User is not interacting with the chart                                        |
| `{ dataIndex: null, seriesId: null }`   | User is interacting but not over a data point                                 |
| `{ dataIndex: 5, seriesId: null }`      | User is over data index 5 (series scope disabled or not over specific series) |
| `{ dataIndex: 5, seriesId: 'revenue' }` | User is over data index 5 on the 'revenue' series                             |

### API Design

#### Chart-Level Props

```tsx
// Basic usage (backwards compatible)
<CartesianChart
  enableScrubbing
  onScrubberPositionChange={(index) => console.log(index)}
/>

// New interaction API
<CartesianChart
  interaction="single"
  interactionScope={{ dataIndex: true, series: false }}
  onInteractionChange={(activeItem) => {
    // { dataIndex: number | null, seriesId: string | null } | undefined
  }}
/>

// Multi-touch / multi-pointer
<CartesianChart
  interaction="multi"
  onInteractionChange={(activeItems) => {
    // Array<{ dataIndex: number | null, seriesId: string | null }>
  }}
/>

// Disabled (default - opt-in interaction)
<CartesianChart interaction="none" />

// Controlled state
<CartesianChart
  interaction="single"
  activeItem={{ dataIndex: 5, seriesId: 'revenue' }}
  onInteractionChange={setActiveItem}
/>
```

#### Accessibility Props

```tsx
<CartesianChart
  interaction="single"
  getInteractionAccessibilityLabel={(activeItem, context) => {
    // activeItem: { dataIndex: number, seriesId: string | null }
    // context: { series: Series[], xAxis: AxisConfig, ... }
    const value = context.getSeriesValue(activeItem.seriesId, activeItem.dataIndex);
    const label = context.getXAxisLabel(activeItem.dataIndex);
    return `${label}: ${formatCurrency(value)}`;
  }}
/>
```

#### Future Programmatic Highlighting (Separate Feature)

```tsx
// This would be a SEPARATE feature from interaction
<BarChart
  // Programmatic visual emphasis - not tied to user interaction
  highlightedItems={[
    { seriesId: 'revenue', dataIndex: 5 },
    { seriesId: 'expenses', dataIndex: 5 },
  ]}
  highlightStyle="emphasized" // or custom styles
  fadedOpacity={0.3}
/>
```

### Provider Architecture

```
┌─────────────────────────────────────────────────────────┐
│ CartesianChart / PolarChart                             │
│  ┌───────────────────────────────────────────────────┐  │
│  │ ChartProvider (series, axes, scales, dimensions)  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │ InteractionProvider                         │  │  │
│  │  │  - interaction mode (none/single/multi)    │  │  │
│  │  │  - interaction scope                       │  │  │
│  │  │  - activeItem state                        │  │  │
│  │  │  - controlled/uncontrolled support         │  │  │
│  │  │  ┌───────────────────────────────────────┐ │  │  │
│  │  │  │ InputHandler (Web/Mobile)             │ │  │  │
│  │  │  │  - Pointer/Touch/Gesture handling     │ │  │  │
│  │  │  │  - Coordinate → activeItem conversion │ │  │  │
│  │  │  └───────────────────────────────────────┘ │  │  │
│  │  │  ┌───────────────────────────────────────┐ │  │  │
│  │  │  │ KeyboardHandler (Web only)            │ │  │  │
│  │  │  │  - Arrow/Home/End/Escape navigation   │ │  │  │
│  │  │  │  - Chart-type agnostic interface     │ │  │  │
│  │  │  └───────────────────────────────────────┘ │  │  │
│  │  │  ┌───────────────────────────────────────┐ │  │  │
│  │  │  │ AccessibilityHandler (Mobile)         │ │  │  │
│  │  │  │  - Chunked regions for VoiceOver      │ │  │  │
│  │  │  │  - Per-item/per-series navigation     │ │  │  │
│  │  │  └───────────────────────────────────────┘ │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Keyboard Navigation Strategy

Current issue: Keyboard navigation in `ScrubberProvider` assumes Cartesian charts (left/right = data index).

**Proposed Solution**: Abstract navigation into chart-type-specific handlers:

```typescript
interface NavigationHandler {
  // Returns the next active item for a given navigation action
  getNextActiveItem(
    action: 'previous' | 'next' | 'first' | 'last' | 'clear',
    currentItem: ActiveItem | undefined,
    context: ChartContext,
  ): ActiveItem | undefined;
}

// Cartesian implementation
const cartesianNavigation: NavigationHandler = {
  getNextActiveItem(action, current, context) {
    switch (action) {
      case 'previous':
        return { ...current, dataIndex: Math.max(0, (current?.dataIndex ?? 0) - 1) };
      case 'next':
        return {
          ...current,
          dataIndex: Math.min(context.dataLength - 1, (current?.dataIndex ?? -1) + 1),
        };
      // ...
    }
  },
};

// Future polar implementation
const polarNavigation: NavigationHandler = {
  getNextActiveItem(action, current, context) {
    // Navigate by angle/segment instead of data index
    // ...
  },
};
```

### Mobile Accessibility Strategy

Current issue: Mobile charts have no accessibility support.

**Proposed Solution**: Configurable accessibility regions based on chart type and highlight scope:

#### Option 1: Chunked Regions (Default for Line Charts)

```tsx
// Similar to SparklineAccessibleView
<CartesianChart
  accessibilityMode="chunked"
  accessibilityChunkCount={10} // Default: 10
/>
```

- Divides chart into N accessible regions
- Each region announces first data point in chunk
- Good for continuous data (line charts, area charts)

#### Option 2: Per-Item Regions (Default for Bar Charts)

```tsx
<CartesianChart accessibilityMode="item" />
```

- Each data point is an accessible region
- User can swipe through each bar/point
- Good for discrete data (bar charts, scatter plots)

#### Option 3: Per-Series Regions

```tsx
<CartesianChart accessibilityMode="series" />
```

- Each series is an accessible region
- Good for comparing series values at a glance
- Can combine with item mode for drill-down

#### Mobile Accessibility Implementation

```tsx
// Internal: AccessibilityOverlay component
const AccessibilityOverlay: React.FC<{
  mode: 'chunked' | 'item' | 'series';
  chunkCount?: number;
  getAccessibilityLabel: (activeItem: ActiveItem) => string;
}> = ({ mode, chunkCount = 10, getAccessibilityLabel }) => {
  const chartContext = useChartContext();
  const { onInteractionChange } = useInteractionContext();

  const regions = useMemo(() => {
    switch (mode) {
      case 'chunked':
        return createChunkedRegions(chartContext.dataLength, chunkCount);
      case 'item':
        return createItemRegions(chartContext.dataLength);
      case 'series':
        return createSeriesRegions(chartContext.series);
    }
  }, [mode, chartContext, chunkCount]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {regions.map((region) => (
        <View
          key={region.id}
          accessible
          accessibilityRole="button"
          accessibilityLabel={getAccessibilityLabel(region.activeItem)}
          onAccessibilityTap={() => onInteractionChange(region.activeItem)}
          style={region.style}
        />
      ))}
    </View>
  );
};
```

### Multi-Touch Support

#### Web Implementation

```typescript
// Track multiple active pointers
const [activePointers, setActivePointers] = useState<Map<number, PointerEvent>>(new Map());

const handlePointerDown = (e: PointerEvent) => {
  setActivePointers((prev) => new Map(prev).set(e.pointerId, e));
};

const handlePointerMove = (e: PointerEvent) => {
  if (!activePointers.has(e.pointerId)) return;

  // Convert each pointer to an active item
  const activeItems = Array.from(activePointers.values()).map((pointer) =>
    getActiveItemFromPointer(pointer),
  );

  onInteractionChange(activeItems);
};

const handlePointerUp = (e: PointerEvent) => {
  setActivePointers((prev) => {
    const next = new Map(prev);
    next.delete(e.pointerId);
    return next;
  });
};
```

#### Mobile Implementation

```typescript
// Use react-native-gesture-handler's multi-touch support
const gesture = Gesture.Manual()
  .onTouchesDown((event) => {
    const activeItems = event.allTouches.map((touch) => getActiveItemFromTouch(touch));
    onInteractionChange(activeItems);
  })
  .onTouchesMove((event) => {
    const activeItems = event.allTouches.map((touch) => getActiveItemFromTouch(touch));
    onInteractionChange(activeItems);
  })
  .onTouchesUp((event) => {
    // Update with remaining touches
    const activeItems = event.allTouches
      .filter((t) => t.state !== State.END)
      .map((touch) => getActiveItemFromTouch(touch));
    onInteractionChange(activeItems.length > 0 ? activeItems : undefined);
  });
```

---

## Backwards Compatibility

### Migration Path

The new API should be fully backwards compatible:

```tsx
// OLD API (continues to work)
<CartesianChart
  enableScrubbing
  onScrubberPositionChange={(index) => console.log(index)}
/>

// Internally translates to:
<CartesianChart
  interaction="single"
  interactionScope={{ dataIndex: true, series: false }}
  onInteractionChange={(activeItem) => {
    onScrubberPositionChange?.(activeItem?.dataIndex);
  }}
/>
```

### Deprecation Strategy

1. **Phase 1**: Add new `interaction*` props alongside existing `enableScrubbing` / `onScrubberPositionChange`
2. **Phase 2**: Add deprecation warnings to old props
3. **Phase 3**: Remove old props in next major version

---

## Open Questions

### 1. Default Interaction Mode

Should interaction be opt-in (current) or opt-out?

| Option                                       | Pros                             | Cons                                  |
| -------------------------------------------- | -------------------------------- | ------------------------------------- |
| **Opt-in** (`interaction="none"` default)    | Explicit, no unexpected behavior | More boilerplate for common use cases |
| **Opt-out** (`interaction="single"` default) | Better DX for interactive charts | May cause unexpected behavior         |

**Recommendation**: Keep opt-in for backwards compatibility, but provide `<InteractiveLineChart>` etc. preset components.

### 2. Interaction Mode Naming

Alternative names for `interaction` prop values:

| Current    | Alternative 1 | Alternative 2   |
| ---------- | ------------- | --------------- |
| `'none'`   | `'disabled'`  | `false`         |
| `'single'` | `'item'`      | `'point'`       |
| `'multi'`  | `'multiple'`  | `'multi-touch'` |

### 3. Series Interaction Default

For multi-series charts, should series interaction scope be:

| Option                     | Behavior                                    |
| -------------------------- | ------------------------------------------- |
| **All series at index**    | All bars/points at x=5 become active        |
| **Only interacted series** | Only the specific bar/point touched/hovered |

**Recommendation**: Make this configurable via `interactionScope.series`.

### 4. Z-Order Behavior for Overlapping Elements

When multiple chart elements (bars, lines, areas) overlap at the same position, the **topmost element in the DOM (last rendered)** receives mouse/touch events. This is standard SVG/DOM behavior.

#### Key Points for Documentation

1. **SVG rendering order**: Elements rendered later in JSX appear visually on top
2. **Event propagation**: The topmost element receives mouse events first
3. **No automatic "nearest" detection**: Unlike some libraries with Voronoi-based detection, we rely on direct element hit testing

#### Example: Overlapping Bars

```tsx
<CartesianChart>
  {/* Revenue bars rendered first - underneath */}
  <BarPlot BarComponent={InteractiveBar} seriesIds={['revenue']} />
  {/* Profit margin bars rendered second - on top */}
  <BarPlot BarComponent={InteractiveBar} seriesIds={['profitMargin']} />
</CartesianChart>
```

In this example:
- Where bars overlap, hovering will **always detect `profitMargin`** (the topmost element)
- The `revenue` bars are only detectable in areas where they extend beyond the `profitMargin` bars

#### Documentation Guidance

Users should be aware that:
1. **Render order matters** - the last-rendered series will capture interactions in overlapping regions
2. **Use separate y-axes carefully** - when series have different scales, bars may overlap unexpectedly
3. **Consider visual clarity** - if users need to interact with both overlapping series, consider alternative visualizations (grouped bars, separate charts, or tooltips that show all series at an index)

This behavior is consistent with how other charting libraries handle overlapping elements (Chart.js, SciChart, Syncfusion, etc.).

### 4. Polar Chart Navigation

How should keyboard navigation work for polar charts?

| Option         | Behavior                                          |
| -------------- | ------------------------------------------------- |
| **By segment** | Arrow keys move between pie slices / radar points |
| **By angle**   | Arrow keys rotate around the chart                |
| **By radius**  | Arrow keys move in/out (for nested polar charts)  |

---

## Implementation Plan

### Phase 1: Core Infrastructure

1. Create `InteractionContext` and `InteractionProvider` types
2. Implement uncontrolled `activeItem` state management
3. Add backwards-compatible prop handling (`enableScrubbing` → `interaction`)

### Phase 2: Input Handlers

1. Refactor web pointer/touch handlers
2. Refactor mobile gesture handlers
3. Add multi-touch support

### Phase 3: Keyboard Navigation

1. Abstract navigation into `NavigationHandler` interface
2. Implement Cartesian navigation handler
3. Move keyboard handling to dedicated component

### Phase 4: Mobile Accessibility

1. Create `AccessibilityOverlay` component
2. Implement chunked regions (like Sparkline)
3. Implement per-item regions
4. Add accessibility label customization

### Phase 5: Advanced Features

1. Add series-level interaction scope
2. Add controlled state support (`activeItem` prop)
3. Prepare polar chart navigation interface

### Phase 6: Future - Programmatic Highlighting (Separate Feature)

1. Add `highlightedItems` prop for visual emphasis
2. Add highlight/fade visual effects
3. Support programmatic highlighting independent of interaction

---

## References

- [MUI X Charts - Highlighting](https://mui.com/x/react-charts/highlighting/)
- [MUI X Charts - Tooltip](https://mui.com/x/react-charts/tooltip/)
- [Recharts - Accessibility](https://github.com/recharts/recharts/wiki/Recharts-and-accessibility)
- [Recharts - Tooltip](https://github.com/recharts/recharts/wiki/Tooltip-event-type-and-shared-prop)
- [WAI-ARIA Authoring Practices - Data Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
