# Web InteractionProvider: Pointer Events Simplification

> **Purpose**: Document the proposed simplification of the web `InteractionProvider` from separate mouse/touch events to unified Pointer Events.

## Table of Contents

1. [Current Implementation](#current-implementation)
2. [Pointer Events Overview](#pointer-events-overview)
3. [Proposed Changes](#proposed-changes)
4. [Implementation Plan](#implementation-plan)
5. [Browser Compatibility](#browser-compatibility)
6. [Migration Guide](#migration-guide)

---

## Current Implementation

### Event Handlers

The current `InteractionProvider.tsx` uses separate event handlers for mouse and touch:

```typescript
// Mouse event handlers (lines 300-312)
const handleMouseMove = useCallback((event: MouseEvent) => {
  const target = event.currentTarget as SVGSVGElement;
  handlePointerMove(event.clientX, event.clientY, target);
}, [handlePointerMove]);

const handleMouseLeave = useCallback(() => {
  if (interaction === 'none') return;
  setActiveState(interaction === 'multi' ? [] : undefined);
}, [interaction, setActiveState]);

// Touch event handlers (lines 314-388)
const handleTouchStart = useCallback((event: TouchEvent) => {
  // Track touches, update state
}, [...]);

const handleTouchMove = useCallback((event: TouchEvent) => {
  event.preventDefault(); // Prevent scrolling
  // Update state based on touch positions
}, [...]);

const handleTouchEnd = useCallback((event: TouchEvent) => {
  // Remove ended touches, clear state if empty
}, [...]);
```

### Event Listener Registration

```typescript
// Lines 476-511
useEffect(
  () => {
    svg.addEventListener('mousemove', handleMouseMove);
    svg.addEventListener('mouseleave', handleMouseLeave);
    svg.addEventListener('touchstart', handleTouchStart, { passive: false });
    svg.addEventListener('touchmove', handleTouchMove, { passive: false });
    svg.addEventListener('touchend', handleTouchEnd);
    svg.addEventListener('touchcancel', handleTouchEnd);
    svg.addEventListener('keydown', handleKeyDown);
    svg.addEventListener('blur', handleBlur);
    // ... cleanup
  },
  [
    /* 10 dependencies */
  ],
);
```

### Issues with Current Approach

1. **Code duplication**: Separate handlers for mouse and touch doing essentially the same thing
2. **Maintenance burden**: Changes need to be applied to both mouse and touch handlers
3. **Complex dependency arrays**: 10 dependencies in the useEffect
4. **Two tracking mechanisms**: `activePointersRef` for touches, implicit single-pointer for mouse

---

## Pointer Events Overview

### What are Pointer Events?

Pointer Events is a W3C standard that unifies mouse, touch, and stylus input into a single event model. Instead of handling `MouseEvent` and `TouchEvent` separately, you handle `PointerEvent` which works for all input types.

### Key Properties

| Property       | Description                                                       |
| -------------- | ----------------------------------------------------------------- |
| `pointerId`    | Unique identifier for the pointer (like `touch.identifier`)       |
| `pointerType`  | `'mouse'`, `'touch'`, or `'pen'`                                  |
| `isPrimary`    | `true` if this is the primary pointer (first touch, or the mouse) |
| `clientX/Y`    | Coordinates (same as mouse/touch)                                 |
| `pressure`     | Pressure level (0 to 1)                                           |
| `width/height` | Contact geometry (for touch)                                      |

### Event Types

| Pointer Event   | Replaces                  |
| --------------- | ------------------------- |
| `pointerdown`   | `mousedown`, `touchstart` |
| `pointermove`   | `mousemove`, `touchmove`  |
| `pointerup`     | `mouseup`, `touchend`     |
| `pointerleave`  | `mouseleave`              |
| `pointercancel` | `touchcancel`             |
| `pointerenter`  | `mouseenter`              |

### Multi-Pointer Handling

```typescript
// Each pointer has a unique ID
const activePointers = new Map<number, PointerEvent>();

function onPointerDown(event: PointerEvent) {
  activePointers.set(event.pointerId, event);
}

function onPointerMove(event: PointerEvent) {
  if (activePointers.has(event.pointerId)) {
    activePointers.set(event.pointerId, event);
  }
}

function onPointerUp(event: PointerEvent) {
  activePointers.delete(event.pointerId);
}
```

---

## Proposed Changes

### Before vs After

| Aspect                    | Before                 | After      |
| ------------------------- | ---------------------- | ---------- |
| Event handlers            | 6 (2 mouse + 4 touch)  | 4 pointer  |
| Event listeners           | 8 total                | 6 total    |
| Code lines                | ~90 lines              | ~50 lines  |
| Dependencies in useEffect | 10                     | 6          |
| Tracking mechanism        | Mixed (implicit + Map) | Single Map |

### New Event Handlers

```typescript
// Single handler for all pointer movement
const handlePointerMoveEvent = useCallback(
  (event: PointerEvent) => {
    if (interaction === 'none') return;

    const target = event.currentTarget as SVGSVGElement;

    if (interaction === 'single') {
      // Only respond to primary pointer (first touch or mouse)
      if (!event.isPrimary) return;
      handlePointerMove(event.clientX, event.clientY, target);
    } else {
      // Multi mode: update the specific pointer
      activePointersRef.current.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
      });
      updateMultiPointerState(target);
    }
  },
  [interaction, handlePointerMove, updateMultiPointerState],
);

// Handle pointer down (needed for multi-touch tracking)
const handlePointerDown = useCallback(
  (event: PointerEvent) => {
    if (interaction !== 'multi') return;

    activePointersRef.current.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY,
    });

    const target = event.currentTarget as SVGSVGElement;
    updateMultiPointerState(target);
  },
  [interaction, updateMultiPointerState],
);

// Handle pointer up/cancel
const handlePointerUp = useCallback(
  (event: PointerEvent) => {
    if (interaction === 'none') return;

    if (interaction === 'multi') {
      activePointersRef.current.delete(event.pointerId);

      if (activePointersRef.current.size === 0) {
        setActiveState([]);
      } else {
        const target = event.currentTarget as SVGSVGElement;
        updateMultiPointerState(target);
      }
    } else {
      // Single mode: only clear on primary pointer
      if (event.isPrimary) {
        setActiveState(undefined);
      }
    }
  },
  [interaction, setActiveState, updateMultiPointerState],
);

// Handle pointer leaving the element
const handlePointerLeave = useCallback(
  (event: PointerEvent) => {
    if (interaction === 'none') return;

    // For touch, pointerleave fires when finger lifts
    // For mouse, fires when cursor leaves element
    if (event.pointerType === 'mouse' && event.isPrimary) {
      setActiveState(interaction === 'multi' ? [] : undefined);
    }
  },
  [interaction, setActiveState],
);
```

### New Event Registration

```typescript
useEffect(() => {
  if (!svgRef?.current || interaction === 'none') return;

  const svg = svgRef.current;

  // Prevent touch scrolling on the SVG
  svg.style.touchAction = 'none';

  // Pointer events (unified mouse + touch)
  svg.addEventListener('pointerdown', handlePointerDown);
  svg.addEventListener('pointermove', handlePointerMoveEvent);
  svg.addEventListener('pointerup', handlePointerUp);
  svg.addEventListener('pointercancel', handlePointerUp);
  svg.addEventListener('pointerleave', handlePointerLeave);

  // Keyboard (unchanged)
  svg.addEventListener('keydown', handleKeyDown);
  svg.addEventListener('blur', handleBlur);

  return () => {
    svg.style.touchAction = '';
    svg.removeEventListener('pointerdown', handlePointerDown);
    svg.removeEventListener('pointermove', handlePointerMoveEvent);
    svg.removeEventListener('pointerup', handlePointerUp);
    svg.removeEventListener('pointercancel', handlePointerUp);
    svg.removeEventListener('pointerleave', handlePointerLeave);
    svg.removeEventListener('keydown', handleKeyDown);
    svg.removeEventListener('blur', handleBlur);
  };
}, [
  svgRef,
  interaction,
  handlePointerDown,
  handlePointerMoveEvent,
  handlePointerUp,
  handlePointerLeave,
  handleKeyDown,
  handleBlur,
]);
```

---

## Implementation Plan

### Phase 1: Refactor Event Handlers

1. **Remove separate mouse/touch handlers**:
   - Delete `handleMouseMove`, `handleMouseLeave`
   - Delete `handleTouchStart`, `handleTouchMove`, `handleTouchEnd`

2. **Add unified pointer handlers**:
   - Add `handlePointerDown` (for multi-touch tracking start)
   - Add `handlePointerMoveEvent` (replaces both mouse/touch move)
   - Add `handlePointerUp` (replaces touch end, handles multi)
   - Add `handlePointerLeave` (replaces mouse leave)

3. **Keep existing logic**:
   - `handlePointerMove` internal function (coordinate → ActiveItem) stays the same
   - `updateMultiPointerState` stays the same
   - `activePointersRef` stays the same (just uses `pointerId` instead of touch `identifier`)

### Phase 2: Update Event Registration

1. **Replace event listeners**:

   ```diff
   - svg.addEventListener('mousemove', handleMouseMove);
   - svg.addEventListener('mouseleave', handleMouseLeave);
   - svg.addEventListener('touchstart', handleTouchStart, { passive: false });
   - svg.addEventListener('touchmove', handleTouchMove, { passive: false });
   - svg.addEventListener('touchend', handleTouchEnd);
   - svg.addEventListener('touchcancel', handleTouchEnd);
   + svg.addEventListener('pointerdown', handlePointerDown);
   + svg.addEventListener('pointermove', handlePointerMoveEvent);
   + svg.addEventListener('pointerup', handlePointerUp);
   + svg.addEventListener('pointercancel', handlePointerUp);
   + svg.addEventListener('pointerleave', handlePointerLeave);
   ```

2. **Add touch-action CSS**:
   ```typescript
   svg.style.touchAction = 'none'; // Prevent scrolling
   ```

### Phase 3: Test & Verify

1. **Single mode mouse**: Hover tracking works
2. **Single mode touch**: Touch tracking works
3. **Multi mode mouse**: Single pointer tracked
4. **Multi mode touch**: Multiple pointers tracked
5. **Leave behavior**: State clears on mouse leave
6. **Cancel behavior**: State clears on touch cancel
7. **Controlled state**: Still works with pointer events

---

## Browser Compatibility

### Support Matrix

| Browser        | Pointer Events Support |
| -------------- | ---------------------- |
| Chrome         | ✅ 55+ (Dec 2016)      |
| Firefox        | ✅ 59+ (Mar 2018)      |
| Safari         | ✅ 13+ (Sep 2019)      |
| Edge           | ✅ All versions        |
| IE             | ✅ 11+ (with prefix)   |
| Mobile Safari  | ✅ 13+                 |
| Chrome Android | ✅ 55+                 |

### Polyfill

Not needed for modern browsers. If legacy support required:

```bash
npm install pepjs
```

```typescript
import 'pepjs'; // Polyfill for IE10
```

---

## Migration Guide

### No Breaking Changes

This refactor is internal to `InteractionProvider`. The public API remains unchanged:

```tsx
// Still works exactly the same
<CartesianChart
  interaction="single"
  interactionScope={{ dataIndex: true, series: true }}
  onInteractionChange={(state) => console.log(state)}
>
  {/* ... */}
</CartesianChart>
```

### Testing Checklist

- [ ] Mouse hover updates `activeItem.dataIndex`
- [ ] Mouse leave clears `activeItem`
- [ ] Touch drag updates `activeItem.dataIndex`
- [ ] Touch end clears `activeItem`
- [ ] Multi-touch creates multiple `activeItems`
- [ ] Multi-touch end removes individual items
- [ ] Controlled state (`activeItem` prop) ignores input
- [ ] `null` controlled state prevents internal updates
- [ ] Series interaction (`interactionScope.series`) still works
- [ ] Keyboard navigation still works
- [ ] Legacy `enableScrubbing` / `onScrubberPositionChange` still work

---

## Summary

| Metric                  | Before | After | Improvement |
| ----------------------- | ------ | ----- | ----------- |
| Event handler functions | 6      | 4     | -33%        |
| Event listeners         | 8      | 7     | -12%        |
| Lines of code           | ~90    | ~50   | -44%        |
| useEffect dependencies  | 10     | 8     | -20%        |
| Code paths for input    | 2      | 1     | -50%        |

The Pointer Events API provides a cleaner, more maintainable implementation with no functionality loss and excellent browser support.
