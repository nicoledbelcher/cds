# Carousel Looping Implementation

This document explains how the looping functionality works in the Carousel component. Understanding this implementation will help you port this feature to other libraries.

## Overview

The Carousel component implements seamless infinite looping by:
1. **Cloning items** to create visual continuity
2. **Tracking iterations** to determine which "wrap" of items we're viewing
3. **Reprojecting items** that scroll off-screen to the opposite end
4. **Calculating page positions** relative to the current iteration

## Page Sequence with Looping

When looping is enabled, pages are calculated based on item positions and container size, then wrap around seamlessly.

**Example: 10 slides, showing 3 per page**

With 10 slides and a container that shows 3 slides per page, the pagination would be:
- **Page 1**: Slides 1-3
- **Page 2**: Slides 4-6
- **Page 3**: Slides 7-9
- **Page 4**: Slide 10 (only one slide visible, if the last page is smaller)

When you navigate "next" from Page 4, it wraps back to **Page 1** (slides 1-3).

**The sequence is: 1-3, 4-6, 7-9, 10, then back to 1-3, 4-6, 7-9, 10, ...**

It does **NOT** create a page showing "10-2" (slides 10, 1, 2). Instead, it wraps back to the beginning. The pages are determined by `calcPageInsets`, which creates page breaks based on when items pass a threshold relative to the container length. After the last page, it loops back to page 0.

The key insight is that pages are **discrete positions** that wrap around, not a continuous scroll that might show partial items from different ends.

## Key Concepts

### Wrap Inset

The `wrapInset` is the total distance needed to complete one full cycle through all items:

```typescript
const wrapInset = totalItemLength + gap
```

Where:
- `totalItemLength`: The end position of the last item (sum of all item widths/heights)
- `gap`: The spacing between items

This value represents the distance from the start of the first item to the end of the last item, including the gap.

### Iteration

An **iteration** represents which "wrap" or cycle of items we're currently viewing. When looping, the carousel can scroll through multiple iterations:

```typescript
const iteration = Math.floor(targetInset / wrapInset)
```

- `iteration = 0`: First cycle (original items)
- `iteration = 1`: Second cycle (first set of clones)
- `iteration = -1`: Previous cycle (items reprojected backwards)

### Transform Inset

The `transformInset` is the offset needed to position items in the current iteration:

```typescript
const transformInset = iteration * wrapInset
```

This shifts all item positions by the appropriate amount for the current iteration.

## Core Implementation

### 1. Item Cloning (Ticker Component)

When `loop={true}`, the Ticker component clones items to ensure seamless scrolling:

```12:14:packages/motion-plus/src/components/Carousel/index.tsx
// ... existing code ...
```

The Ticker calculates how many clones are needed based on the visible area:

```typescript
const cloneCount = calcNumClones(visibleLength, itemPositions, gap)
```

Clones are positioned at:
- `originalPosition + (cloneIndex + 1) * wrapInset` for forward clones
- `originalPosition - (cloneIndex + 1) * wrapInset` for backward clones

### 2. Current Page Calculation

The `calcCurrentPage` function determines which page is currently visible, accounting for iterations:

```3:38:packages/motion-plus/src/components/Carousel/utils/calc-current-page.ts
import { wrap } from "motion"

export function calcCurrentPage(
    targetOffset: number,
    pageInsets: number[],
    wrapInset: number,
    maxInset: number | null
) {
    const targetInset = -targetOffset
    const iteration =
        maxInset === null ? Math.floor(targetInset / wrapInset) : 0
    const transformInset = iteration * wrapInset

    for (let i = pageInsets.length - 1; i >= 0; i--) {
        const inset = pageInsets[i] + transformInset

        const prevIndex = wrap(0, pageInsets.length, i - 1)
        const prevIteration = i === 0 ? iteration - 1 : iteration
        const prevTransformInset = prevIteration * wrapInset
        const prevInset = pageInsets[prevIndex] + prevTransformInset
        const halfDistanceToPrev = (inset - prevInset) / 2
        const nextIndex = wrap(0, pageInsets.length, i + 1)
        const nextIteration =
            i === pageInsets.length - 1 ? iteration + 1 : iteration
        const nextTransformInset = nextIteration * wrapInset
        const nextInset = pageInsets[nextIndex] + nextTransformInset
        const halfDistanceToNext = (nextInset - inset) / 2

        if (
            targetInset < nextInset - halfDistanceToNext &&
            targetInset >= prevInset + halfDistanceToPrev
        ) {
            return i
        }
    }

    return 0
}
```

**Key points:**
- When `maxInset === null` (looping enabled), it calculates the iteration
- When `maxInset !== null` (no looping), iteration is always 0
- It handles wrapping at boundaries: when `i === 0`, the previous page is at `iteration - 1`, and when `i === pageInsets.length - 1`, the next page is at `iteration + 1`
- Uses the `wrap` function from Motion to handle circular indexing

### 3. Finding Next/Previous Pages

Both `findNextPageInset` and `findPrevPageInset` use the `wrap` function to handle looping:

```5:50:packages/motion-plus/src/components/Carousel/utils/find-next-page.ts
import { wrap } from "motion/react"
import { ItemPosition } from "../../Ticker/types"
import { findCurrentIndexFromInset } from "./find-current-index"

export function findNextItemInset(
    currentInset: number,
    itemPositions: ItemPosition[],
    gap: number,
    targetInset?: number
): number {
    if (itemPositions.length === 0) return 0

    const totalItemLength = itemPositions[itemPositions.length - 1].end
    const wrapInset = totalItemLength + gap
    const idealInset =
        targetInset ?? currentInset + (itemPositions[0]?.end ?? 0)

    /**
     * First, find the index of the item closest to the current
     * inset. We do this to ensure we paginate by at least one
     * item in the event that the items are larger than the
     * viewable container.
     */
    const currentItemIndex = findCurrentIndexFromInset(
        currentInset,
        itemPositions,
        wrapInset
    )

    let index = currentItemIndex + 1
    let nextItemInset = 0
    let hasFoundNextInset = false
    while (!hasFoundNextInset) {
        const { start, end } =
            itemPositions[wrap(0, itemPositions.length, index)]
        const iteration = Math.floor(index / itemPositions.length)
        const transformInset = iteration * wrapInset
        const transformedStart = start + transformInset

        nextItemInset = transformedStart

        if (end + transformInset > idealInset) {
            hasFoundNextInset = true
        } else {
            index++
        }
    }

    return nextItemInset
}
```

**Key points:**
- Uses `wrap(0, itemPositions.length, index)` to cycle through items when index exceeds the array length
- Calculates iteration: `Math.floor(index / itemPositions.length)`
- Applies transform: `start + transformInset` to get the actual position in the current iteration

### 4. Going to a Specific Page

The `gotoPage` function handles jumping to a specific page while maintaining the current iteration:

```195:202:packages/motion-plus/src/components/Carousel/index.tsx
    const gotoPage = (i: number) => {
        const iteration = loop
            ? Math.floor((-targetOffset.get() * sign) / wrapInset)
            : 0
        console.log({ iteration })
        const transformOffset = iteration * -wrapInset
        stepOffset(-pagination.insets[i] + transformOffset)
    }
```

**Key points:**
- Preserves the current iteration when jumping to a page
- When `loop={false}`, iteration is always 0
- Applies the transform offset to maintain visual continuity

### 5. Item Reprojection

Items that scroll off-screen are "reprojected" to the opposite end to create seamless looping. This happens in `TickerItemWrapper`:

```60:83:packages/motion-plus/src/components/Ticker/TickerItem.tsx
    const projection = useTransform(() => {
        if (!reproject) return 0

        const currentOffset = offset.get()
        if ((!start && !end) || !listSize) return 0

        if (currentOffset * sign + bounds.end <= -inset - safeMargin) {
            return listSize * sign
        }

        /**
         * If we've defined a safeMargin, also project items backwards if they
         * fall outside the right boundary (+ margin). This fills-in the start area
         * without affecting the alignment of items.
         */
        if (safeMargin > 0) {
            const rightBoundary = visibleLength - safeMargin - inset
            if (currentOffset * sign + bounds.start >= rightBoundary) {
                return -listSize * sign
            }
        }

        return 0
    })
```

**How it works:**
- When an item scrolls past the left boundary, it's projected forward by `listSize`
- When an item scrolls past the right boundary (with safeMargin), it's projected backward by `-listSize`
- This creates the illusion of infinite scrolling without needing infinite DOM elements

### 6. Pagination State

The pagination state (next/prev button states) is calculated differently based on looping:

```68:79:packages/motion-plus/src/components/Carousel/index.tsx
    const calculatePaginationState = (targetOffsetValue: number) => {
        const current = calcCurrentPage(
            targetOffsetValue * sign,
            pagination.insets,
            wrapInset,
            maxInset
        )
        const isNextActive = loop ? true : targetOffsetValue * -sign < maxInset!
        const isPrevActive = loop ? true : targetOffsetValue * -sign > 0

        return { current, isNextActive, isPrevActive }
    }
```

**Key points:**
- When `loop={true}`, both next and prev are always active
- When `loop={false}`, buttons are disabled at boundaries

## Free Drag Looping

During free drag (when the user drags the carousel), the looping works differently than discrete pagination. The key insight is that **the raw offset value is NOT snapped back during drag** - instead, the **rendered position is continuously wrapped in real-time**.

### How It Works

1. **Drag Updates Target Offset**: When the user drags, the `targetOffset` MotionValue is directly updated by the drag gesture via `_dragX` or `_dragY`:

```287:289:packages/motion-plus/src/components/Carousel/index.tsx
            drag={axis}
            _dragX={axis === "x" ? targetOffset : false}
            _dragY={axis === "y" ? targetOffset : false}
```

2. **Offset Can Go Unbounded**: During drag, `targetOffset` can be any value (e.g., -1000, -2000, etc.). It's not clamped or wrapped at this stage.

3. **Real-Time Wrapping in Ticker**: The Ticker component receives `renderedOffset` and wraps it in real-time when `loop={true}`:

```243:257:packages/motion-plus/src/components/Ticker/index.tsx
    const wrappedOffset = useTransform(() => {
        // TODO: Move to strategy
        if (state.direction === "rtl") {
            return wrap(
                state.totalItemLength + gap + state.inset,
                state.inset,
                offset.get()
            )
        }
        return wrap(
            -state.totalItemLength - gap - state.inset,
            -state.inset,
            offset.get()
        )
    })
```

4. **Rendered Position Always Wrapped**: The `wrappedOffset` transform uses Motion's `wrap` function to continuously wrap the value between:
   - **Min**: `-totalItemLength - gap - inset`
   - **Max**: `-inset`

   This means the visual position always stays within the loop range, even though the raw offset can be unbounded.

5. **Item Reprojection During Drag**: Individual items also get reprojected (jumped to the opposite end) when they scroll off-screen, working in conjunction with the offset wrapping:

```60:83:packages/motion-plus/src/components/Ticker/TickerItem.tsx
    const projection = useTransform(() => {
        if (!reproject) return 0

        const currentOffset = offset.get()
        if ((!start && !end) || !listSize) return 0

        if (currentOffset * sign + bounds.end <= -inset - safeMargin) {
            return listSize * sign
        }

        /**
         * If we've defined a safeMargin, also project items backwards if they
         * fall outside the right boundary (+ margin). This fills-in the start area
         * without affecting the alignment of items.
         */
        if (safeMargin > 0) {
            const rightBoundary = visibleLength - safeMargin - inset
            if (currentOffset * sign + bounds.start >= rightBoundary) {
                return -listSize * sign
            }
        }

        return 0
    })
```

### When Offset Gets Updated

**During Drag:**
- `targetOffset` updates freely (unbounded)
- `offset` syncs from `targetOffset` via event handler
- `renderedOffset` wraps the value in real-time via transform
- **No snapping or clamping occurs during active drag**

**After Drag Ends:**
- If `snap` is enabled, the drag momentum animation snaps to the nearest page
- The wrapping continues to work during momentum animation
- The final offset may be wrapped to stay within bounds

### Key Implementation Details

1. **Transform-Based Wrapping**: The wrapping happens via a `useTransform`, which means it's computed reactively on every frame. This ensures smooth, continuous wrapping during drag.

2. **No Offset Snapping During Drag**: Unlike some implementations that snap the offset back when it exceeds bounds, this approach allows the offset to go unbounded and wraps only the rendered position. This prevents visual jumps during drag.

3. **Dual Mechanism**: The looping uses two complementary mechanisms:
   - **Offset wrapping**: Keeps the overall position within bounds
   - **Item reprojection**: Moves individual items to the opposite end when they scroll off-screen

4. **Wheel Input Handling**: For wheel input (non-drag), the offset is clamped when looping is disabled, but allowed to go unbounded when looping is enabled:

```234:243:packages/motion-plus/src/components/Carousel/index.tsx
            onWheel: (delta) => {
                const { clampOffset } = wheelCallbacks.current

                const newOffset = offset.get() + delta
                const clampedOffset =
                    sign > 0
                        ? clampOffset(newOffset)
                        : clamp(0, maxInset!, newOffset)
                targetOffset.jump(maxInset ? clampedOffset : newOffset)
            },
```

## Flow Diagram

```
User drags → targetOffset updates (unbounded)
    ↓
targetOffset change event → offset.set(latest)
    ↓
renderedOffset = tugOffset + offset
    ↓
Ticker wraps renderedOffset in real-time (if loop=true)
    ↓
Items reproject when scrolling off-screen
    ↓
Visual position always within loop range
    ↓
After drag ends → snap to nearest page (if enabled)
```

## Key Differences: Looping vs Non-Looping

| Aspect | Looping (`loop={true}`) | Non-Looping (`loop={false}`) |
|--------|------------------------|------------------------------|
| **Iteration** | Calculated from offset | Always 0 |
| **maxInset** | `null` | Actual maximum scroll position |
| **Next/Prev** | Always active | Disabled at boundaries |
| **Item Cloning** | Enabled | Disabled |
| **Reprojection** | Enabled | Disabled |
| **gotoPage** | Preserves iteration | Always iteration 0 |

## Implementation Checklist for Porting

When porting this looping functionality to another library, ensure you implement:

1. ✅ **Wrap Inset Calculation**: `totalItemLength + gap`
2. ✅ **Iteration Tracking**: `Math.floor(offset / wrapInset)`
3. ✅ **Transform Application**: `position + (iteration * wrapInset)`
4. ✅ **Circular Indexing**: Use a `wrap` function for array indices
5. ✅ **Item Reprojection**: Move off-screen items to opposite end
6. ✅ **Boundary Handling**: Special logic for first/last items (prev/next iterations)
7. ✅ **Page Calculation**: Account for iterations when determining current page
8. ✅ **Pagination State**: Always active when looping, boundary-aware when not
9. ✅ **Real-Time Offset Wrapping**: Use a transform to wrap the rendered offset during drag (don't clamp the raw offset)
10. ✅ **Unbounded Drag**: Allow the raw offset to go unbounded during drag, only wrap the visual position

## Code References

- Main Carousel component: `packages/motion-plus/src/components/Carousel/index.tsx`
- Current page calculation: `packages/motion-plus/src/components/Carousel/utils/calc-current-page.ts`
- Next page finding: `packages/motion-plus/src/components/Carousel/utils/find-next-page.ts`
- Previous page finding: `packages/motion-plus/src/components/Carousel/utils/find-prev-page.ts`
- Item reprojection: `packages/motion-plus/src/components/Ticker/TickerItem.tsx`
- Ticker component: `packages/motion-plus/src/components/Ticker/index.tsx`
