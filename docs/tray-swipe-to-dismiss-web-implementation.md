# Implementing Swipe-to-Dismiss on Web Tray

This document outlines the technical requirements and implementation plan for adding swipe-to-dismiss gesture support to the web Tray component, similar to the existing mobile implementation.

## Current State

### Mobile Implementation
Mobile uses React Native's `PanResponder` API with the following key components:

- **`useDrawerPanResponder.ts`** - Handles gesture recognition and translation
- **`useDrawerAnimation.ts`** - Manages animation state and interpolation
- **Shared constants** from `@coinbase/cds-common/animation/drawer`:
  - `DISMISSAL_DRAG_THRESHOLD = 150` - Minimum drag distance to dismiss
  - `DISMISSAL_VELOCITY_THRESHOLD = 0.8` - Minimum velocity for fling dismiss
  - `MIN_PAN_DISTANCE = 2` - Minimum distance to capture gesture
  - `MAX_OVER_DRAG = 40` - Maximum "rubber band" effect distance

### Web Current State
Web currently uses `framer-motion` for slide-in/slide-out animations but has no gesture support. The handle bar is purely visual.

---

## Implementation Options

### Option A: Framer Motion Drag Gestures (Recommended)

Framer Motion has built-in drag gesture support via the `drag` prop.

**Pros:**
- Already using framer-motion for animations
- Consistent animation system
- Good browser support
- Handles touch and mouse events

**Cons:**
- May need to customize drag constraints
- Velocity detection requires additional work

**Example API:**
```tsx
<motion.div
  drag="y"
  dragConstraints={{ top: 0, bottom: 0 }}
  dragElastic={0.2}
  onDragEnd={(event, info) => {
    if (info.velocity.y > DISMISSAL_VELOCITY_THRESHOLD || 
        info.offset.y > DISMISSAL_DRAG_THRESHOLD) {
      handleClose();
    }
  }}
>
```

### Option B: Custom Pointer Events

Build a custom hook using native pointer events.

**Pros:**
- Full control over behavior
- Lighter weight (no additional dependencies)
- Can match mobile behavior exactly

**Cons:**
- More implementation work
- Need to handle touch vs mouse differences
- Need to implement momentum/velocity calculations

### Option C: use-gesture Library

Use `@use-gesture/react` library which provides a React-friendly gesture API.

**Pros:**
- Well-maintained, popular library
- Handles edge cases well
- Works with framer-motion

**Cons:**
- Additional dependency
- May be overkill for just drag-to-dismiss

---

## Recommended Implementation Plan

### Phase 1: Core Infrastructure

#### 1.1 Create `useDrawerDrag` Hook

Create a new hook similar to mobile's `useDrawerPanResponder`:

```tsx
// packages/web/src/overlays/tray/useDrawerDrag.ts

import { useCallback, useRef } from 'react';
import type { PanInfo } from 'framer-motion';
import {
  DISMISSAL_DRAG_THRESHOLD,
  DISMISSAL_VELOCITY_THRESHOLD,
  MAX_OVER_DRAG,
} from '@coinbase/cds-common/animation/drawer';

type UseDrawerDragParams = {
  pin: 'bottom' | 'top' | 'left' | 'right';
  onDismiss: () => void;
  onBlur?: () => void;
  enabled?: boolean;
};

type UseDrawerDragReturn = {
  dragProps: {
    drag: 'x' | 'y' | false;
    dragConstraints: { top?: number; bottom?: number; left?: number; right?: number };
    dragElastic: number;
    onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  };
};

export const useDrawerDrag = ({
  pin,
  onDismiss,
  onBlur,
  enabled = true,
}: UseDrawerDragParams): UseDrawerDragReturn => {
  const isVertical = pin === 'top' || pin === 'bottom';
  
  const shouldDismiss = useCallback((info: PanInfo): boolean => {
    const velocity = isVertical ? info.velocity.y : info.velocity.x;
    const offset = isVertical ? info.offset.y : info.offset.x;
    
    // Check direction based on pin
    const isCorrectDirection = 
      (pin === 'bottom' && offset > 0) ||
      (pin === 'top' && offset < 0) ||
      (pin === 'right' && offset > 0) ||
      (pin === 'left' && offset < 0);
    
    if (!isCorrectDirection) return false;
    
    const absVelocity = Math.abs(velocity);
    const absOffset = Math.abs(offset);
    
    return absVelocity > DISMISSAL_VELOCITY_THRESHOLD || 
           absOffset > DISMISSAL_DRAG_THRESHOLD;
  }, [pin, isVertical]);

  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (shouldDismiss(info)) {
        onBlur?.();
        onDismiss();
      }
    },
    [shouldDismiss, onDismiss, onBlur]
  );

  // Calculate drag constraints based on pin direction
  const getDragConstraints = () => {
    switch (pin) {
      case 'bottom':
        return { top: -MAX_OVER_DRAG, bottom: 0 };
      case 'top':
        return { top: 0, bottom: MAX_OVER_DRAG };
      case 'right':
        return { left: -MAX_OVER_DRAG, right: 0 };
      case 'left':
        return { left: 0, right: MAX_OVER_DRAG };
    }
  };

  return {
    dragProps: enabled ? {
      drag: isVertical ? 'y' : 'x',
      dragConstraints: getDragConstraints(),
      dragElastic: 0.1, // Rubber band effect
      onDragEnd: handleDragEnd,
    } : {
      drag: false,
      dragConstraints: {},
      dragElastic: 0,
      onDragEnd: () => {},
    },
  };
};
```

#### 1.2 Update Tray Component

Add drag support to the `MotionBox`:

```tsx
// In Tray.tsx

const { dragProps } = useDrawerDrag({
  pin,
  onDismiss: handleClose,
  onBlur,
  enabled: !preventDismiss && showHandleBar,
});

<MotionBox
  {...dragProps}
  animate={controls}
  // ... existing props
>
```

### Phase 2: New Props

Add new props to `TrayBaseProps`:

```tsx
export type TrayBaseProps = {
  // ... existing props
  
  /**
   * Enable swipe-to-dismiss gesture on the handle bar
   * Only works when showHandleBar is true and pin is 'bottom'
   * @default false
   */
  enableSwipeToDismiss?: boolean;
  
  /**
   * Callback fired when swipe gesture starts
   */
  onSwipeStart?: () => void;
  
  /**
   * Callback fired during swipe with progress (0-1)
   */
  onSwipeProgress?: (progress: number) => void;
};
```

### Phase 3: Visual Feedback

#### 3.1 Overlay Opacity Animation

Animate overlay opacity as user drags (matching mobile):

```tsx
const overlayOpacity = useMotionValue(1);

// In drag handler
onDrag={(event, info) => {
  const progress = Math.abs(info.offset.y) / DISMISSAL_DRAG_THRESHOLD;
  overlayOpacity.set(1 - Math.min(progress, 0.5));
}}

<Overlay style={{ opacity: overlayOpacity }} />
```

#### 3.2 Handle Bar Visual Feedback

Consider adding visual feedback to the handle bar during drag:
- Slight color change
- Scale animation
- Haptic feedback (if supported)

### Phase 4: Accessibility

#### 4.1 Keyboard Support
The swipe gesture should have a keyboard equivalent:
- Already have ESC to close
- Consider adding a visible close button when handle bar is shown

#### 4.2 Reduced Motion
Respect `prefers-reduced-motion`:

```tsx
const prefersReducedMotion = usePrefersReducedMotion();

const { dragProps } = useDrawerDrag({
  // ...
  enabled: !prefersReducedMotion && !preventDismiss && showHandleBar,
});
```

#### 4.3 Screen Reader
Add appropriate ARIA attributes:

```tsx
<HandleBar
  role="button"
  aria-label="Drag to dismiss or double-tap to close"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClose();
    }
  }}
/>
```

---

## API Changes Summary

### New Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableSwipeToDismiss` | `boolean` | `false` | Enable drag gesture |
| `onSwipeStart` | `() => void` | - | Called when drag starts |
| `onSwipeProgress` | `(progress: number) => void` | - | Called during drag |

### Behavior Changes

1. When `showHandleBar` is `true` and `enableSwipeToDismiss` is `true`:
   - User can drag the tray to dismiss
   - Dragging past threshold OR with high velocity dismisses
   - Overlay fades as user drags
   - "Rubber band" effect when dragging opposite direction

2. Handle bar becomes interactive:
   - Clickable to close (optional)
   - Keyboard focusable
   - Screen reader accessible

---

## Files to Modify/Create

### New Files
- `packages/web/src/overlays/tray/useDrawerDrag.ts`

### Modified Files
- `packages/web/src/overlays/tray/Tray.tsx` - Add drag support
- `packages/web/src/overlays/handlebar/HandleBar.tsx` - Add interactive props
- `packages/web/src/overlays/overlay/OverlayContent.tsx` - Support animated opacity

### Shared (may need updates)
- `packages/common/src/animation/drawer.ts` - Ensure web compatibility of constants

---

## Testing Requirements

### Unit Tests
- Test drag threshold detection
- Test velocity detection
- Test direction-based dismissal
- Test `preventDismiss` disables drag
- Test `enableSwipeToDismiss: false` disables drag

### Integration Tests
- Test full drag-to-dismiss flow
- Test overlay opacity animation
- Test rubber band effect
- Test keyboard accessibility

### Manual Testing
- Touch devices (tablet, touch laptop)
- Mouse drag
- Trackpad gestures
- Various pin directions
- Reduced motion preference

---

## Estimated Effort

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: Core Infrastructure | 2-3 days | None |
| Phase 2: New Props | 0.5 day | Phase 1 |
| Phase 3: Visual Feedback | 1-2 days | Phase 1 |
| Phase 4: Accessibility | 1 day | Phase 1-3 |
| Testing & Polish | 2 days | All phases |

**Total: ~7-9 days**

---

## Open Questions

1. **Should handle bar click dismiss?** Mobile's handle bar dismisses on tap - should web match?

2. **Mouse vs Touch behavior?** Should drag work with mouse, or only touch?

3. **Pin direction support?** Mobile only shows handle bar for `pin="bottom"`. Should web swipe work for all directions?

4. **Handle bar required?** Should swipe-to-dismiss require `showHandleBar`, or work independently?

5. **Animation timing?** Should swipe dismissal be faster than button close (like mobile)?
