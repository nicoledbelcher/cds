# Chart Interaction System - Mobile Implementation Guide

> **Purpose**: This document provides all context needed to implement series-level interaction on mobile, mirroring the web implementation.

## Table of Contents

1. [Background & Context](#background--context)
2. [Web Implementation Summary](#web-implementation-summary)
3. [Mobile Implementation Plan](#mobile-implementation-plan)
4. [API Reference](#api-reference)
5. [Key Learnings & Gotchas](#key-learnings--gotchas)
6. [Testing Requirements](#testing-requirements)

---

## Background & Context

### Problem Statement

The CDS chart interaction system needed to be revamped to support:

- **Series-level interaction**: Knowing which specific series (line, bar) the user is interacting with, not just which data index
- **Controlled state**: External control of the active item via props
- **Multi-touch support**: Multiple simultaneous touch points (mobile)
- **Backward compatibility**: Existing `enableScrubbing` and `onScrubberPositionChange` props must continue working
- **Future polar chart support**: Architecture should be chart-type agnostic

### New Interaction API

```tsx
// New API
<CartesianChart
  interaction="single"  // 'none' | 'single' | 'multi'
  interactionScope={{ dataIndex: true, series: true }}
  activeItem={{ dataIndex: 5, seriesId: 'btc' }}  // Controlled state
  onInteractionChange={(item) => console.log(item)}
/>

// Legacy API (still supported via mapping)
<CartesianChart
  enableScrubbing
  onScrubberPositionChange={(index) => console.log(index)}
/>
```

### Key Types

```typescript
// packages/*/src/chart/utils/context.ts

type InteractionMode = 'none' | 'single' | 'multi';

type InteractionScope = {
  dataIndex?: boolean; // Track which data point (x-axis position)
  series?: boolean; // Track which series (line, bar, etc.)
};

type ActiveItem = {
  dataIndex: number | null;
  seriesId: string | null;
};

type ActiveItems = ActiveItem[]; // For multi-touch

// For controlled state:
// - undefined = uncontrolled (internal state management)
// - null = controlled with no active item (gestures still fire onInteractionChange but don't update internal state)
// - ActiveItem = controlled with specific active item
type InteractionState = ActiveItem | ActiveItems | null | undefined;
```

---

## Web Implementation Summary

### Architecture

```
CartesianChart
  └── InteractionProvider (new)
        ├── Handles mouse/touch events at SVG level
        ├── Calculates dataIndex from x position
        ├── Provides InteractionContext
        └── ScrubberProvider (wrapped for backward compat)
              └── Chart content (Line, Bar, Scrubber, etc.)
```

### How Series Interaction Works on Web

#### For Bars (`DefaultBar.tsx`)

Bars are individual `<rect>` elements with native mouse events:

```tsx
// packages/web-visualization/src/chart/bar/DefaultBar.tsx
const DefaultBar = ({ seriesId, dataIndex, ...props }) => {
  const interactionContext = useOptionalInteractionContext();

  const handleMouseEnter = useCallback(() => {
    if (!interactionContext?.scope.series) return;

    const currentItem = interactionContext.activeItem;
    const currentDataIndex = currentItem?.dataIndex ?? null;

    interactionContext.setActiveItem({
      dataIndex: currentDataIndex,
      seriesId: seriesId ?? null,
    });
  }, [interactionContext, seriesId]);

  const handleMouseLeave = useCallback(() => {
    if (!interactionContext?.scope.series) return;

    const currentDataIndex = interactionContext.activeItem?.dataIndex ?? null;
    interactionContext.setActiveItem({
      dataIndex: currentDataIndex,
      seriesId: null, // Clear series, keep dataIndex
    });
  }, [interactionContext]);

  return <motion.rect onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...props} />;
};
```

#### For Lines (`SolidLine.tsx`, `DottedLine.tsx`)

**CRITICAL**: framer-motion's `motion.path` does NOT reliably forward mouse events. We discovered this through debugging and had to use raw `<path>` elements for event handling.

```tsx
// packages/web-visualization/src/chart/line/SolidLine.tsx
const SolidLine = ({ seriesId, interactionOffset, strokeWidth, d, ...props }) => {
  const interactionContext = useOptionalInteractionContext();

  // Determine if we need event handling
  const needsEventHandling = interactionContext?.scope.series && seriesId;

  // Calculate event path stroke width (includes interactionOffset for larger hit area)
  const eventPathStrokeWidth =
    interactionOffset && interactionOffset > 0 ? strokeWidth + interactionOffset * 2 : strokeWidth;

  const handleMouseEnter = useCallback(() => {
    // Similar to DefaultBar - preserve dataIndex, set seriesId
  }, [interactionContext, seriesId]);

  const handleMouseLeave = useCallback(() => {
    // Similar to DefaultBar - preserve dataIndex, clear seriesId
  }, [interactionContext, seriesId]);

  return (
    <>
      {/* Visible line - MUST have pointerEvents: 'none' when event handling is needed */}
      <Path
        d={d}
        stroke={stroke}
        strokeWidth={strokeWidth}
        style={{ pointerEvents: needsEventHandling ? 'none' : undefined }}
        animate={animate}
        transition={transition}
        {...props}
      />

      {/* 
        Event handling layer - RAW <path>, NOT framer-motion Path!
        This is critical - motion.path doesn't forward mouse events reliably.
      */}
      {needsEventHandling && (
        <path
          d={d}
          fill="none"
          stroke="transparent"
          strokeWidth={eventPathStrokeWidth}
          strokeLinecap={strokeLinecap}
          strokeLinejoin={strokeLinejoin}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ pointerEvents: 'all', cursor: 'pointer' }}
        />
      )}
    </>
  );
};
```

### Z-Order Behavior for Overlapping Elements

When multiple elements overlap (e.g., two bar series at the same x position), the element rendered **last** in the DOM receives mouse events first. This is standard SVG/DOM behavior.

**Example**: If `BarPlot A` is rendered before `BarPlot B`, hovering over an overlapping area will detect `B`.

```tsx
<BarPlot seriesIds={['revenue']} />     {/* Rendered first = underneath */}
<BarPlot seriesIds={['profitMargin']} /> {/* Rendered second = on top, receives events */}
```

This is documented behavior and matches user expectations (what you see on top is what you interact with).

---

## Mobile Implementation Plan

### Key Differences from Web

| Aspect           | Web (SVG)                            | Mobile (Skia)                                       |
| ---------------- | ------------------------------------ | --------------------------------------------------- |
| Rendering        | SVG elements in DOM                  | Skia canvas drawing                                 |
| Element events   | Native `onMouseEnter`/`onMouseLeave` | ❌ Not available                                    |
| Gesture handling | Per-element + chart-level            | Chart-level only via `react-native-gesture-handler` |
| Hit detection    | Browser handles automatically        | **Must implement manually**                         |

### Implementation Strategy

Since Skia paths don't have touch events, we need **coordinate-based hit testing** in the gesture handler.

#### Phase 1: Bar Interaction (Recommended Starting Point)

Bars have known, simple bounding boxes. This is the easiest to implement.

**Step 1**: Create a registry for bar bounds

```typescript
// packages/mobile-visualization/src/chart/utils/context.ts

type ElementBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
  dataIndex: number;
  seriesId: string;
};

type InteractionRegistry = {
  bars: ElementBounds[];
  // Future: points, lines
};

// Add to InteractionContextValue
type InteractionContextValue = {
  // ... existing fields
  registerBar: (bounds: ElementBounds) => void;
  unregisterBar: (seriesId: string, dataIndex: number) => void;
  registry: InteractionRegistry;
};
```

**Step 2**: Register bounds when rendering bars

```typescript
// packages/mobile-visualization/src/chart/bar/DefaultBar.tsx
const DefaultBar = ({ x, y, width, height, dataIndex, seriesId, ...props }) => {
  const interactionContext = useOptionalInteractionContext();

  useEffect(() => {
    if (!interactionContext?.scope.series || !seriesId) return;

    interactionContext.registerBar({
      x, y, width, height,
      dataIndex,
      seriesId,
    });

    return () => {
      interactionContext.unregisterBar(seriesId, dataIndex);
    };
  }, [x, y, width, height, dataIndex, seriesId, interactionContext]);

  return <Rect x={x} y={y} width={width} height={height} {...props} />;
};
```

**Step 3**: Hit test in gesture handler

```typescript
// packages/mobile-visualization/src/chart/interaction/InteractionProvider.tsx

const findBarAtPoint = (
  x: number,
  y: number,
  registry: InteractionRegistry,
): ElementBounds | null => {
  // Iterate in reverse order (last rendered = on top = checked first)
  for (let i = registry.bars.length - 1; i >= 0; i--) {
    const bar = registry.bars[i];
    if (x >= bar.x && x <= bar.x + bar.width && y >= bar.y && y <= bar.y + bar.height) {
      return bar;
    }
  }
  return null;
};

// In gesture handler:
const onGestureEvent = useCallback(
  (event: GestureEvent) => {
    const { x, y } = event;

    // Calculate dataIndex from x position (existing logic)
    const dataIndex = calculateDataIndex(x);

    // Check for series interaction
    let seriesId: string | null = null;
    if (scope.series) {
      const hitBar = findBarAtPoint(x, y, registry);
      if (hitBar) {
        seriesId = hitBar.seriesId;
      }
    }

    setActiveItem({ dataIndex, seriesId });
  },
  [registry, scope],
);
```

#### Phase 2: Point/Scatter Interaction

Points are circles with known centers and radii.

```typescript
type PointBounds = {
  cx: number;
  cy: number;
  radius: number;
  dataIndex: number;
  seriesId: string;
};

const findPointAtTouch = (
  touchX: number,
  touchY: number,
  points: PointBounds[],
  touchTolerance: number = 10, // Extra pixels for easier touch
): PointBounds | null => {
  for (let i = points.length - 1; i >= 0; i--) {
    const point = points[i];
    const distance = Math.sqrt(Math.pow(touchX - point.cx, 2) + Math.pow(touchY - point.cy, 2));
    if (distance <= point.radius + touchTolerance) {
      return point;
    }
  }
  return null;
};
```

#### Phase 3: Line Interaction (Most Complex)

Two approaches:

**Option A: Skia Path Hit Testing (Recommended)**

```typescript
import { Skia, PathOp } from '@shopify/react-native-skia';

type LinePath = {
  pathString: string; // SVG path d attribute
  seriesId: string;
};

const findLineAtTouch = (
  touchX: number,
  touchY: number,
  lines: LinePath[],
  hitAreaWidth: number = 20, // Pixel tolerance
): LinePath | null => {
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    const path = Skia.Path.MakeFromSVGString(line.pathString);

    if (!path) continue;

    // Create a stroked version of the path for hit testing
    const strokePath = path.copy().stroke({
      width: hitAreaWidth,
      cap: Skia.CapStyle.Round,
      join: Skia.JoinStyle.Round,
    });

    if (strokePath?.contains(touchX, touchY)) {
      return line;
    }
  }
  return null;
};
```

**Option B: Distance-Based (Fallback)**

Calculate perpendicular distance from touch point to line segments:

```typescript
const distanceToLineSegment = (
  px: number,
  py: number, // Touch point
  x1: number,
  y1: number, // Line segment start
  x2: number,
  y2: number, // Line segment end
): number => {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  return Math.sqrt(Math.pow(px - xx, 2) + Math.pow(py - yy, 2));
};

const findNearestLine = (
  touchX: number,
  touchY: number,
  lines: LineData[],
  maxDistance: number = 20,
): LineData | null => {
  let nearest: LineData | null = null;
  let minDistance = maxDistance;

  for (const line of lines) {
    for (let i = 0; i < line.points.length - 1; i++) {
      const dist = distanceToLineSegment(
        touchX,
        touchY,
        line.points[i].x,
        line.points[i].y,
        line.points[i + 1].x,
        line.points[i + 1].y,
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearest = line;
      }
    }
  }

  return nearest;
};
```

### Performance Considerations

1. **Registry updates**: Use refs or shared values to avoid re-renders when registering bounds
2. **Hit testing frequency**: Consider throttling hit tests during rapid pan gestures
3. **Path parsing**: Cache parsed Skia paths, don't recreate on every touch
4. **Z-order**: Process elements in reverse render order for correct "topmost wins" behavior

### Mobile Files to Modify

```
packages/mobile-visualization/src/chart/
├── utils/context.ts           # Add InteractionRegistry types
├── interaction/
│   └── InteractionProvider.tsx # Add hit testing logic, registry management
├── bar/
│   ├── DefaultBar.tsx         # Register bounds on mount, unregister on unmount
│   └── BarStack.tsx           # Pass seriesId to DefaultBar (already done)
├── line/
│   ├── SolidLine.tsx          # Register path on mount (Phase 3)
│   └── DottedLine.tsx         # Register path on mount (Phase 3)
└── scatter/
    └── Point.tsx              # Register center/radius (Phase 2)
```

---

## API Reference

### InteractionProvider Props

| Prop                  | Type                                        | Default                              | Description                          |
| --------------------- | ------------------------------------------- | ------------------------------------ | ------------------------------------ |
| `interaction`         | `'none' \| 'single' \| 'multi'`             | `'single'`                           | Interaction mode                     |
| `interactionScope`    | `{ dataIndex?: boolean; series?: boolean }` | `{ dataIndex: true, series: false }` | What to track                        |
| `activeItem`          | `ActiveItem \| null`                        | `undefined`                          | Controlled active item (single mode) |
| `activeItems`         | `ActiveItems \| []`                         | `undefined`                          | Controlled active items (multi mode) |
| `onInteractionChange` | `(state: InteractionState) => void`         | -                                    | Callback when interaction changes    |
| `accessibilityLabel`  | `string \| ((item: ActiveItem) => string)`  | -                                    | Static or dynamic a11y label         |

### InteractionContext Value

```typescript
type InteractionContextValue = {
  mode: InteractionMode;
  scope: InteractionScope;
  activeItem: InteractionState;
  setActiveItem: (item: InteractionState) => void;

  // Mobile-specific (to be added):
  registry: InteractionRegistry;
  registerBar: (bounds: ElementBounds) => void;
  unregisterBar: (seriesId: string, dataIndex: number) => void;
  // Future: registerLine, registerPoint, etc.
};
```

### Controlled State Behavior

| Value                           | Meaning                    | Gesture Behavior                                   |
| ------------------------------- | -------------------------- | -------------------------------------------------- |
| `undefined`                     | Uncontrolled               | Updates internal state, fires callback             |
| `null` (single) or `[]` (multi) | Controlled, no active item | Does NOT update internal state, DOES fire callback |
| `ActiveItem` / `ActiveItems`    | Controlled with value      | Uses provided value, fires callback                |

---

## Key Learnings & Gotchas

### 1. framer-motion Doesn't Forward Mouse Events Reliably

**Problem**: When using framer-motion's `motion.path` for SVG lines, `onMouseEnter`/`onMouseLeave` events don't fire reliably.

**Solution**: Use raw `<path>` elements for event handling, with `motion.path` only for animated visuals.

```tsx
// ❌ WRONG - events don't fire reliably
<motion.path d={d} onMouseEnter={handler} animate={...} />

// ✅ CORRECT - separate visual and event layers
<motion.path d={d} style={{ pointerEvents: 'none' }} animate={...} />
<path d={d} stroke="transparent" onMouseEnter={handler} style={{ pointerEvents: 'all' }} />
```

### 2. Preserve dataIndex When Updating seriesId

When a user hovers over a series element, we should preserve the current `dataIndex` (from mouse x position) while updating `seriesId`:

```typescript
// ✅ CORRECT
const handleMouseEnter = () => {
  const currentDataIndex = interactionContext.activeItem?.dataIndex ?? null;
  interactionContext.setActiveItem({
    dataIndex: currentDataIndex, // Preserve!
    seriesId: seriesId,
  });
};
```

### 3. InteractionProvider Must Preserve seriesId on Pointer Move

The `InteractionProvider.handlePointerMove` fires on every pixel of mouse movement. It must NOT overwrite `seriesId` set by child components:

```typescript
// In InteractionProvider.handlePointerMove:
const newActiveItem = { dataIndex, seriesId: null };

// Preserve existing seriesId if series scope is enabled
if (scope.series) {
  const currentItem = activeItemRef.current;
  const effectiveItem = {
    ...newActiveItem,
    seriesId: currentItem?.seriesId ?? null, // Preserve!
  };
  // Use effectiveItem for state update
}
```

### 4. Z-Order Follows Render Order

Last rendered element is on top and receives events first. This matches visual expectations.

### 5. Mobile Needs Coordinate-Based Hit Testing

Unlike web where the browser handles hit detection, mobile requires manual implementation because Skia canvas elements don't have touch events.

---

## Testing Requirements

### Web Stories (Already Implemented)

Location: `packages/web-visualization/src/chart/__stories__/Interaction.stories.tsx`

- `BasicInteraction` - Single mode interaction
- `ControlledState` - Programmatic control with null handling
- `InteractionDisabled` - `interaction="none"`
- `BackwardsCompatibility` - Legacy props still work
- `AccessibilityLabels` - Static and dynamic labels
- `MultiSeriesInteraction` - Multiple series, single mode
- `InteractionCallbackDetails` - Event logging
- `MultiTouchInteraction` - Multi-touch with reference lines
- `SynchronizedCharts` - Two charts sharing state
- `SeriesInteraction` - Bar hover with seriesId tracking
- `OverlappingBarsZOrder` - Z-order verification
- `LineSeriesInteraction` - Line hover with interactionOffset

### Mobile Tests Needed

1. **Bar interaction**: Touch a bar, verify `seriesId` is set
2. **Overlapping elements**: Touch overlap area, verify topmost element wins
3. **Pan across bars**: Verify `seriesId` updates as finger moves between bars
4. **Controlled state**: Verify `null` prevents internal state update but fires callback
5. **Performance**: Verify smooth interaction with many bars/lines

### Debug Logging

During development, add logging to verify hit detection:

```typescript
console.log('[InteractionProvider] hit test', {
  touchX,
  touchY,
  hitBar: hitBar?.seriesId ?? 'none',
  registeredBars: registry.bars.length,
});
```

Remove all `console.log` statements before merging.

---

## Summary: What Needs to Be Done for Mobile

1. **Add `InteractionRegistry` types** to `context.ts`
2. **Add registry management** to `InteractionProvider` (register/unregister functions, ref storage)
3. **Add hit testing** to gesture handler in `InteractionProvider`
4. **Update `DefaultBar`** to register bounds on mount
5. **Add mobile stories** to test series interaction
6. **Future**: Extend to points and lines

Start with bars - they're the simplest and establish the pattern. Lines are the most complex due to path hit testing requirements.
