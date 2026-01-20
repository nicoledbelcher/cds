# Looping Implementation Plan for CDS Carousel

This document outlines how infinite looping functionality could be implemented in the CDS Carousel component, based on the patterns described in `looping.md`.

## Current Implementation Overview

The CDS Carousel currently:
- Uses **framer-motion** for drag animations and transitions
- Tracks items via `RefMapContext` and `carouselItemRects` (position measurements)
- Calculates pages based on `snapMode` ('item' or 'page')
- Clamps scrolling to `maxScrollOffset` (no infinite scrolling)
- Disables navigation buttons at boundaries (`disableGoNext`, `disableGoPrevious`)
- Uses `pageOffsets` array to determine snap positions
- Tracks `activePageIndex` for pagination state

## Key Concepts from Reference Implementation

### 1. Wrap Inset
The total distance needed to complete one full cycle through all items:

```typescript
const wrapInset = totalItemLength + gap
```

**For CDS Carousel:**
- `totalItemLength` = `contentWidth` (last item's end position)
- `gap` = Calculate from item spacing (measure distance between items)
- Will compute gap dynamically from measured item positions

### 2. Iteration Tracking
Which "wrap" or cycle we're currently viewing:

```typescript
const iteration = Math.floor(targetInset / wrapInset)
```

**For CDS Carousel:**
- `targetInset` = `-carouselScrollX.get()` (negated because we scroll left)
- Would need to track iteration state or calculate on-demand
- When `loop={false}`, iteration is always 0

### 3. Transform Inset
Offset to position items in current iteration:

```typescript
const transformInset = iteration * wrapInset
```

**For CDS Carousel:**
- Would apply this transform to item positions when calculating visibility
- Could use CSS transforms or adjust position calculations

## Implementation Strategy

### Phase 1: Core Loop Infrastructure

#### 1.1 Add `loop` Prop
```typescript
export type CarouselBaseProps = {
  // ... existing props
  /**
   * Enables infinite looping. When true, the carousel will seamlessly
   * loop from the last item back to the first.
   * @default false
   */
  loop?: boolean;
}
```

#### 1.2 Calculate Gap from Item Spacing
```typescript
const gap = useMemo(() => {
  if (Object.keys(carouselItemRects).length < 2) return 0;
  const items = getItemOffsets(carouselItemRects);
  // Calculate gap from spacing between first two items
  const firstItemEnd = items[0].x + items[0].width;
  const secondItemStart = items[1].x;
  return Math.max(0, secondItemStart - firstItemEnd);
}, [carouselItemRects]);
```

#### 1.3 Calculate Wrap Inset
```typescript
const wrapInset = useMemo(() => {
  if (!loop || !hasDimensions) return null;
  return contentWidth + gap;
}, [loop, contentWidth, gap, hasDimensions]);
```

#### 1.4 Track Iteration
```typescript
const getIteration = useCallback((scrollOffset: number): number => {
  if (!loop || !wrapInset) return 0;
  return Math.floor(scrollOffset / wrapInset);
}, [loop, wrapInset]);
```

### Phase 2: Item Positioning Strategy

**Decision: Use Virtual Positioning**

**Rationale:**
- **Simpler implementation**: No need to clone DOM nodes or manage duplicate React keys/IDs
- **Better performance**: Fewer DOM elements to manage
- **Easier state management**: Original items remain in place, we just transform their positions
- **Cleaner code**: Can leverage CSS transforms or position calculations without DOM manipulation

**Alternative (Cloning):**
- Would require duplicating `CarouselItem` elements with modified IDs
- More complex React key management
- More DOM nodes to track and update
- Could be added later if virtual positioning has performance issues

**Recommendation:** Start with virtual positioning. It's easier to implement, maintain, and debug. We can add cloning later if we encounter performance issues with many items.

#### 2.1 Virtual Item Positioning (Recommended Approach)
```typescript
const getTransformedItemRects = useMemo(() => {
  if (!loop || !wrapInset) return carouselItemRects;
  
  const iteration = getIteration(Math.abs(carouselScrollX.get()));
  const transformInset = iteration * wrapInset;
  
  // Transform all item positions
  const transformed: { [itemId: string]: Rect } = {};
  Object.entries(carouselItemRects).forEach(([id, rect]) => {
    transformed[id] = {
      ...rect,
      x: rect.x + transformInset,
    };
  });
  
  return transformed;
}, [loop, wrapInset, carouselItemRects, carouselScrollX, getIteration]);
```

### Phase 3: Page Calculation with Looping

#### 3.1 Update `calcCurrentPage` Logic
The current page calculation needs to account for iterations:

```typescript
const calcCurrentPageWithLoop = (
  scrollOffset: number,
  pageOffsets: number[],
  wrapInset: number | null,
): number => {
  if (!wrapInset) {
    // Non-looping: use existing logic
    return getNearestPageIndexFromOffset(scrollOffset, pageOffsets);
  }
  
  const iteration = Math.floor(scrollOffset / wrapInset);
  const transformInset = iteration * wrapInset;
  
  // Find page accounting for iteration
  // Similar to reference implementation's calcCurrentPage
  // Need to handle wrapping at boundaries (first/last pages)
};
```

**Key considerations:**
- When at first page (`i === 0`), previous page is at `iteration - 1`
- When at last page (`i === pageOffsets.length - 1`), next page is at `iteration + 1`
- Need a `wrap` utility function for circular array indexing

#### 3.2 Wrap Utility
```typescript
const wrap = (min: number, max: number, value: number): number => {
  const range = max - min;
  return min + ((((value - min) % range) + range) % range);
};
```

### Phase 4: Navigation with Looping

#### 4.1 Update Navigation Button States
```typescript
const disableGoNext = loop ? false : activePageIndex >= totalPages - 1;
const disableGoPrevious = loop ? false : activePageIndex <= 0;
```

#### 4.2 Update `goToPage` with Smart Animation
```typescript
const goToPage = useCallback(
  (page: number) => {
    if (loop && wrapInset) {
      const currentPage = activePageIndex;
      const currentScrollOffset = Math.abs(carouselScrollX.get());
      const currentIteration = getIteration(currentScrollOffset);
      
      // Calculate target page offset in current iteration
      const targetOffsetInCurrentIteration = pageOffsets[page] + (currentIteration * wrapInset);
      
      // Check if we're crossing a boundary (e.g., page 3 → page 0)
      const isWrappingForward = currentPage === totalPages - 1 && page === 0;
      const isWrappingBackward = currentPage === 0 && page === totalPages - 1;
      
      if (isWrappingForward || isWrappingBackward) {
        // Animate to the visual target first (smooth transition)
        updateActivePageIndex(page);
        updateVisibleCarouselItems(pageOffsets[page]);
        
        animationApi.start({
          x: -targetOffsetInCurrentIteration,
          transition: { type: 'tween', duration: 0.25 },
        }).then(() => {
          // After animation completes, instantly snap to iteration 0
          // This happens so fast the user won't notice
          const targetOffsetIteration0 = pageOffsets[page];
          carouselScrollX.set(-targetOffsetIteration0);
          animationApi.set({ x: -targetOffsetIteration0 });
          updateVisibleCarouselItems(targetOffsetIteration0);
        });
      } else {
        // Normal page transition within same iteration
        updateActivePageIndex(page);
        const targetOffset = pageOffsets[page] + (currentIteration * wrapInset);
        updateVisibleCarouselItems(pageOffsets[page]);
        animationApi.start({
          x: -targetOffset,
          transition: { type: 'tween', duration: 0.25 },
        });
      }
    } else {
      // Existing non-looping logic
      const newPage = Math.max(0, Math.min(totalPages - 1, page));
      updateActivePageIndex(newPage);
      const targetOffset = pageOffsets[newPage];
      updateVisibleCarouselItems(targetOffset);
      animationApi.start({
        x: -targetOffset,
        transition: { type: 'tween', duration: 0.25 },
      });
    }
  },
  [loop, wrapInset, activePageIndex, totalPages, pageOffsets, /* ... */],
);
```

**Key Behavior:**
- When clicking next/prev buttons and crossing boundaries (e.g., page 3 → page 1), animate smoothly to the visual target
- After animation completes, instantly snap back to iteration 0 position (user won't notice)
- Normal page transitions within the same iteration animate normally
- During drag, boundary crossings are instant (handled in `handleDragTransition`)

#### 4.3 Handle Next/Previous with Wrapping
```typescript
const handleGoNext = useCallback(() => {
  if (loop && wrapInset) {
    const nextPage = wrap(0, totalPages, activePageIndex + 1);
    goToPage(nextPage);
  } else {
    goToPage(activePageIndex + 1);
  }
}, [loop, wrapInset, totalPages, activePageIndex, goToPage]);
```

### Phase 5: Drag Handling with Looping

#### 5.1 Remove Scroll Constraints
```typescript
// When looping, remove drag constraints
dragConstraints={loop ? undefined : { left: -maxScrollOffset, right: 0 }}
```

#### 5.2 Update `handleDragTransition`
```typescript
const handleDragTransition = useCallback(
  (targetOffsetScroll: number) => {
    if (drag === 'none') return targetOffsetScroll;
    
    const negatedTargetOffsetScroll = -targetOffsetScroll;
    
    if (loop && wrapInset) {
      // Don't clamp - allow infinite scrolling
      const iteration = getIteration(negatedTargetOffsetScroll);
      
      // Calculate page index accounting for iteration
      const transformInset = iteration * wrapInset;
      const adjustedOffset = negatedTargetOffsetScroll - transformInset;
      const closestPageIndex = getNearestPageIndexFromOffset(adjustedOffset, pageOffsets);
      updateActivePageIndex(closestPageIndex);
      
      if (drag === 'snap') {
        // Snap to page accounting for iteration
        const snapOffset = pageOffsets[closestPageIndex] + transformInset;
        updateVisibleCarouselItems(pageOffsets[closestPageIndex]);
        
        // After snap completes, instantly reposition to iteration 0 if we crossed boundary
        // Use a small delay to let the snap animation start
        setTimeout(() => {
          const currentIteration = getIteration(Math.abs(carouselScrollX.get()));
          if (currentIteration !== 0) {
            const iteration0Offset = pageOffsets[closestPageIndex];
            carouselScrollX.set(-iteration0Offset);
            animationApi.set({ x: -iteration0Offset });
            updateVisibleCarouselItems(iteration0Offset);
          }
        }, 50);
        
        return -snapOffset;
      }
      
      // For free drag, update visible items based on adjusted offset
      updateVisibleCarouselItems(adjustedOffset);
      return targetOffsetScroll;
    } else {
      // Existing non-looping logic with clamping
      const clampedScrollOffset = clampWithElasticResistance(
        negatedTargetOffsetScroll,
        maxScrollOffset,
        0,
      );
      const closestPageIndex = getNearestPageIndexFromOffset(clampedScrollOffset, pageOffsets);
      updateActivePageIndex(closestPageIndex);
      
      if (drag === 'snap') {
        const snapOffset = pageOffsets[closestPageIndex];
        updateVisibleCarouselItems(snapOffset);
        return -snapOffset;
      }
      
      updateVisibleCarouselItems(clampedScrollOffset);
      return targetOffsetScroll;
    }
  },
  [loop, wrapInset, drag, maxScrollOffset, pageOffsets, carouselScrollX, animationApi, updateVisibleCarouselItems, updateActivePageIndex],
);
```

**Key Behavior:**
- During drag, allow infinite scrolling without clamping
- When snapping after drag ends, if we're in a non-zero iteration, instantly snap back to iteration 0
- This ensures the carousel always returns to iteration 0 after user interaction completes

### Phase 6: Item Reprojection (Advanced)

**Note:** The reference implementation uses item reprojection to move off-screen items to the opposite end. This is more complex and may not be necessary if virtual positioning works well.

**If needed:**
- Monitor item positions relative to viewport
- When item scrolls past left boundary, transform it forward by `wrapInset`
- When item scrolls past right boundary, transform it backward by `-wrapInset`
- This could be done via CSS transforms on individual items

## Key Differences: CDS vs Reference

| Aspect | Reference (motion-plus) | CDS Carousel |
|--------|------------------------|--------------|
| **Animation Library** | Motion (custom) | framer-motion |
| **Item Tracking** | Ticker component with cloning | RefMapContext with rects |
| **Gap Handling** | Explicit gap prop | Implicit (flexbox) |
| **Page Calculation** | Separate utility functions | Inline in component |
| **Drag Constraints** | Conditional based on loop | Always clamped (needs change) |

## Implementation Challenges

### 1. Gap Calculation ✅ RESOLVED
**Solution:** Calculate gap from item spacing by measuring distance between first two items.

```typescript
const gap = useMemo(() => {
  if (Object.keys(carouselItemRects).length < 2) return 0;
  const items = getItemOffsets(carouselItemRects);
  const firstItemEnd = items[0].x + items[0].width;
  const secondItemStart = items[1].x;
  return Math.max(0, secondItemStart - firstItemEnd);
}, [carouselItemRects]);
```

### 2. Item Cloning vs Virtual Positioning ✅ RESOLVED
**Decision:** Use virtual positioning (CSS transforms) - easier to implement, maintain, and debug.

**Rationale:**
- No DOM cloning needed
- Simpler React key/ID management
- Better performance with fewer DOM nodes
- Can add cloning later if needed

### 3. Framer Motion Constraints
**Problem:** `dragConstraints` currently always clamps to `maxScrollOffset`.

**Solution:** Conditionally remove constraints when `loop={true}`.

### 4. Page Index Wrapping ✅ RESOLVED
**Solution:** Use `wrap` utility function for all page index calculations. Pagination shows fixed number of pages (not infinite).

### 5. Active Page Index State
**Problem:** `activePageIndex` is a simple number, but with looping we need to track which iteration.

**Solution:** Keep `activePageIndex` as logical page (0 to totalPages-1), calculate iteration separately when needed.

## Testing Considerations

1. **Boundary Testing:**
   - Test scrolling from last item to first (should loop seamlessly)
   - Test scrolling from first item to last (backwards loop)
   - Test rapid scrolling through multiple iterations

2. **Navigation Testing:**
   - Next button at last page should go to first page
   - Previous button at first page should go to last page
   - Pagination dots should work correctly with looping

3. **Drag Testing:**
   - Test dragging past boundaries (should not clamp)
   - Test snap mode with looping
   - Test free drag mode with looping

4. **State Testing:**
   - Verify `onChangePage` fires correctly with looping
   - Verify `activePageIndex` stays within bounds (0 to totalPages-1)
   - Verify visible items calculation works across iterations

## Decisions Made

1. ✅ **Gap Handling:** Calculate gap from item spacing (measure distance between items)
2. ✅ **Item Positioning:** Use virtual positioning (CSS transforms) - easier to implement and maintain
3. ✅ **Snap Mode:** Support both `snapMode='item'` and `snapMode='page'` with looping
4. ✅ **Drag Mode:** Support both `drag='free'` and `drag='snap'` with looping
5. ✅ **Default Behavior:** `loop={false}` by default (opt-in via `loop` or `loop={true}`)
6. ✅ **Pagination:** Show same number of pages (not infinite dots)
7. ✅ **Accessibility:** No announcement needed - page index remains the same logically
8. ✅ **Animation Strategy:**
   - **During drag:** Instant reposition when crossing boundaries
   - **Button clicks:** Animate smoothly to visual target, then instantly snap to iteration 0 after animation completes
   - This provides smooth UX while maintaining correct internal state

## Animation Strategy Details

### Button Click Animation (Next/Previous)

When clicking navigation buttons and crossing boundaries (e.g., page 3 → page 1):

1. **Animate smoothly** to the visual target position (same duration as normal page transitions)
2. **After animation completes**, instantly snap to iteration 0 position
3. The snap happens so quickly the user won't notice, but maintains correct internal state

**Implementation approach:**
```typescript
// When wrapping forward (last page → first page)
if (isWrappingForward) {
  // Calculate target in current iteration (e.g., iteration 1, page 0)
  const visualTarget = pageOffsets[0] + (currentIteration * wrapInset);
  
  // Animate to visual target
  animationApi.start({
    x: -visualTarget,
    transition: { type: 'tween', duration: 0.25 },
  }).then(() => {
    // Instantly snap to iteration 0
    carouselScrollX.set(-pageOffsets[0]);
    animationApi.set({ x: -pageOffsets[0] });
  });
}
```

### Drag Animation

During drag operations:
- **No animation** when crossing boundaries - instant reposition
- After drag ends and snap completes, check if we're in non-zero iteration
- If so, instantly snap to iteration 0 (happens very quickly, user won't notice)

This ensures:
- Smooth UX for button clicks (feels natural)
- Responsive drag interactions (no lag)
- Always returns to iteration 0 after interactions complete

## Remaining Considerations

1. **Performance:** How many items can we support with looping? Monitor performance with virtual positioning approach.

2. **Initial Position:** When looping is enabled, always start at iteration 0 (first page).

3. **Edge Cases:** 
   - What happens with only 1-2 items? (Should probably disable looping or show warning)
   - What if items are larger than viewport? (Should still work, but may need special handling)
   - What if content changes while looping? (Need to recalculate wrapInset and potentially reset to iteration 0)
   - What if user rapidly clicks next/prev? (Need to handle animation queue properly)

## Recommended Implementation Order

1. ✅ Add `loop` prop (defaults to `false`)
2. ✅ Calculate gap from item spacing
3. ✅ Implement wrap inset calculation
4. ✅ Add `wrap` utility function for circular indexing
5. ✅ Update page calculation to handle iterations (both `snapMode='item'` and `snapMode='page'`)
6. ✅ Update navigation button states (always enabled when looping)
7. ✅ Implement virtual item positioning with transforms
8. ✅ Update `goToPage` with smart animation (smooth transition, then snap to iteration 0)
9. ✅ Remove drag constraints when looping (support both `drag='free'` and `drag='snap'`)
10. ✅ Update drag transition handler (instant snap to iteration 0 after drag ends)
11. ✅ Update visible items calculation to account for iterations
12. ✅ Comprehensive testing (boundaries, navigation, drag, both snap modes, both drag modes)

## Next Steps

1. **Clarify requirements** based on open questions above
2. **Prototype** basic looping with virtual positioning
3. **Test** with various item counts and sizes
4. **Iterate** based on performance and UX feedback
5. **Document** API changes and usage examples
