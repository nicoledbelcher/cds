# Tray Component: Web vs Mobile Comparison

This document compares the `Tray` component implementations between `@coinbase/cds-web` and `@coinbase/cds-mobile`.

## Architecture

| Aspect                | Web                      | Mobile                              |
| --------------------- | ------------------------ | ----------------------------------- |
| **Implementation**    | Self-contained component | Wrapper around `Drawer` component   |
| **Animation Library** | `framer-motion`          | React Native `Animated` API         |
| **Portal/Modal**      | Uses `Portal` component  | Uses React Native `Modal`           |
| **Focus Management**  | `FocusTrap` component    | Native accessibility escape gesture |
| **Scroll Blocking**   | `useScrollBlocker` hook  | N/A (handled by Modal)              |

---

## Props Comparison

### Common Props (Both Platforms) ✅

| Prop                             | Type (Web)                                 | Type (Mobile)                              | Notes                                                  |
| -------------------------------- | ------------------------------------------ | ------------------------------------------ | ------------------------------------------------------ |
| `children`                       | `ReactNode \| TrayRenderChildren`          | `ReactNode \| TrayRenderChildren`          | Both support render function with `{ handleClose }`    |
| `header`                         | `ReactNode \| TrayRenderChildren`          | `ReactNode \| TrayRenderChildren`          | ✅ Both support render function with `{ handleClose }` |
| `footer`                         | `ReactNode \| TrayRenderChildren`          | `ReactNode \| TrayRenderChildren`          | ✅ Both support render function with `{ handleClose }` |
| `title`                          | `ReactNode`                                | `ReactNode`                                | String or custom component                             |
| `hideHeader`                     | `boolean`                                  | `boolean`                                  | ✅ Hides the header section entirely                   |
| `pin`                            | `PinningDirection`                         | `PinningDirection`                         | Default: `'bottom'`                                    |
| `showHandleBar`                  | `boolean`                                  | N/A (via `hideHandleBar`)                  | Web: opt-in, Mobile: shown by default                  |
| `handleBarVariant`               | `'inside' \| 'outside'`                    | `'inside' \| 'outside'`                    | ✅ Position of the drag handle                         |
| `onBlur`                         | `() => void`                               | `() => void`                               | Called on overlay press or swipe                       |
| `onCloseComplete`                | `() => void`                               | `() => void`                               | **Required** - Called after close animation            |
| `onVisibilityChange`             | `(context: 'visible' \| 'hidden') => void` | `(context: 'visible' \| 'hidden') => void` | Analytics callback                                     |
| `verticalDrawerPercentageOfView` | `string` (e.g., `"85%"`)                   | `number` (e.g., `0.85`)                    | ⚠️ **Different types!**                                |
| `accessibilityLabel`             | `string`                                   | `string`                                   | Default: `'Tray'` (web)                                |
| `styles`                         | `object`                                   | `object`                                   | Different slot structures (see below)                  |

### Web-Only Props

| Prop                      | Type                        | Default    | Description                                     |
| ------------------------- | --------------------------- | ---------- | ----------------------------------------------- |
| `id`                      | `string`                    | -          | HTML ID attribute                               |
| `preventDismiss`          | `boolean`                   | `false`    | Prevents dismissing via overlay click or escape |
| `role`                    | `'dialog' \| 'alertdialog'` | `'dialog'` | WAI-ARIA role                                   |
| `zIndex`                  | `number`                    | -          | z-index for the tray overlay                    |
| `focusTabIndexElements`   | `boolean`                   | `false`    | Allow any tabIndex element in focus trap        |
| `restoreFocusOnUnmount`   | `boolean`                   | `true`     | Restore focus when tray unmounts                |
| `closeAccessibilityLabel` | `string`                    | `'Close'`  | Accessibility label for close button            |
| `closeAccessibilityHint`  | `string`                    | -          | Accessibility hint for close button             |
| `classNames`              | `object`                    | -          | CSS class names for slots                       |

### Mobile-Only Props (via Drawer)

| Prop                                 | Type        | Default     | Description                                     |
| ------------------------------------ | ----------- | ----------- | ----------------------------------------------- |
| `preventDismissGestures`             | `boolean`   | `false`     | Prevents swipe/overlay dismiss                  |
| `preventHardwareBackBehaviorAndroid` | `boolean`   | `false`     | Prevents Android back button dismiss            |
| `hideHandleBar`                      | `boolean`   | `false`     | Hides the drag handle (bottom pin only)         |
| `disableCapturePanGestureToDismiss`  | `boolean`   | `false`     | For ScrollView children                         |
| `handleBarAccessibilityLabel`        | `string`    | `'Dismiss'` | Accessibility label for handle bar              |
| `stickyFooter`                       | `ReactNode` | -           | **Deprecated** - Use `TrayStickyFooter` instead |

---

## Styles Slots

### Web `styles` Object

```typescript
styles?: {
  root?: React.CSSProperties;           // Root container
  overlay?: React.CSSProperties;        // Background overlay
  container?: React.CSSProperties;      // Animated sliding container
  header?: React.CSSProperties;         // Header section
  title?: React.CSSProperties;          // Title text
  content?: React.CSSProperties;        // Main content area
  footer?: React.CSSProperties;         // Footer section
  handleBar?: React.CSSProperties;      // Handle bar container (when showHandleBar is true)
  handleBarHandle?: React.CSSProperties;// Handle bar element (when showHandleBar is true)
}
```

### Web `classNames` Object

```typescript
classNames?: {
  root?: string;
  overlay?: string;
  container?: string;
  header?: string;
  title?: string;
  content?: string;
  footer?: string;
  handleBar?: string;
  handleBarHandle?: string;
}
```

### Mobile `styles` Object

```typescript
styles?: {
  root?: StyleProp<ViewStyle>;           // Root container (from Drawer)
  overlay?: StyleProp<ViewStyle>;        // Background overlay (from Drawer)
  container?: StyleProp<ViewStyle>;      // Animated container (from Drawer)
  handleBar?: PressableProps['style'];   // Handle bar pressable (from Drawer)
  handleBarHandle?: StyleProp<ViewStyle>;// Handle bar handle (from Drawer)
  drawer?: StyleProp<ViewStyle>;         // Drawer box (from Drawer)
  content?: StyleProp<ViewStyle>;        // Content area (Tray-specific)
  header?: StyleProp<ViewStyle>;         // Header area (Tray-specific)
  title?: StyleProp<TextStyle>;          // Title text (Tray-specific)
}
```

---

## Ref API

### Web `TrayRefProps`

```typescript
type TrayRefProps = {
  close: () => void;
};
```

### Mobile `DrawerRefBaseProps`

```typescript
type DrawerRefBaseProps = {
  handleClose: () => void; // Note: different method name
};
```

⚠️ **Method name difference**: Web uses `close()`, mobile uses `handleClose()`

---

## Key Behavioral Differences

### 1. Header & Close Button

| Web                                                        | Mobile                                |
| ---------------------------------------------------------- | ------------------------------------- |
| Has built-in header with close button                      | No built-in close button              |
| `hideHeader` prop to hide entire header                    | `hideHeader` prop to hide title area  |
| Close button conditionally shown based on `preventDismiss` | Relies on swipe/overlay/back gestures |

### 2. Scroll Detection (Web Only)

Web Tray implements scroll detection to show/hide a border on the header when content is scrolled:

- Tracks `isContentScrollable` and `hasScrolledDown` state
- Uses `ResizeObserver` and scroll event listeners
- Applies `borderedBottom` to header when scrolled

### 3. Handle Bar

| Aspect      | Web                                          | Mobile                                          |
| ----------- | -------------------------------------------- | ----------------------------------------------- |
| Default     | Hidden (opt-in with `showHandleBar`)         | Shown by default (opt-out with `hideHandleBar`) |
| Restriction | Only shows when `pin="bottom"`               | Only shows when `pin="bottom"`                  |
| Variants    | `'outside'` (default) or `'inside'`          | `'outside'` (default) or `'inside'`             |
| Styling     | `styles.handleBar`, `styles.handleBarHandle` | `styles.handleBar`, `styles.handleBarHandle`    |

### 4. Dismiss Behavior

| Aspect                  | Web                               | Mobile                                                |
| ----------------------- | --------------------------------- | ----------------------------------------------------- |
| Overlay click           | Yes (`preventDismiss` to disable) | Yes (`preventDismissGestures` to disable)             |
| Escape key              | Yes (`preventDismiss` to disable) | N/A                                                   |
| Swipe gesture           | No                                | Yes (`preventDismissGestures` to disable)             |
| Hardware back (Android) | N/A                               | Yes (`preventHardwareBackBehaviorAndroid` to disable) |
| Accessibility escape    | N/A                               | Yes (iOS)                                             |

### 5. Side Drawer Sizing

| Web                              | Mobile                                     |
| -------------------------------- | ------------------------------------------ |
| Fixed width: `min(400px, 100vw)` | Calculated: `width * 0.85 + MAX_OVER_DRAG` |

### 6. Context Providers

| Web                          | Mobile                                                                    |
| ---------------------------- | ------------------------------------------------------------------------- |
| `OverlayContentContext` only | `OverlayContentContext` + `TrayContext`                                   |
| -                            | `TrayContext` provides `verticalDrawerPercentageOfView` and `titleHeight` |

---

## Mobile-Specific: `TrayStickyFooter`

Mobile provides a `TrayStickyFooter` component for sticky footer content:

```tsx
import { Tray, TrayStickyFooter } from '@coinbase/cds-mobile';

<Tray onCloseComplete={handleClose}>
  {/* Scrollable content */}
  <TrayStickyFooter>
    <Button>Confirm</Button>
  </TrayStickyFooter>
</Tray>;
```

This component uses `TrayContext` to calculate max height based on viewport and title height.

---

## Animation Configuration

### Web (framer-motion)

```typescript
const animationConfig = {
  slideIn: { transition: { duration: 0.3 } },
  slideOut: { transition: { duration: 0.3 } },
};
```

### Mobile (Animated API)

Uses `drawerAnimationDefaultDuration` from `@coinbase/cds-common/animation/drawer` with custom interpolation for swipe gestures and opacity.

---

## Summary of API Gaps

### Features in Web but NOT in Mobile

- `role` prop (WAI-ARIA)
- `zIndex` prop
- Focus trap configuration (`focusTabIndexElements`, `restoreFocusOnUnmount`)
- Close button with accessibility props
- `classNames` for CSS classes

### Features in Mobile but NOT in Web

- `disableCapturePanGestureToDismiss` for ScrollView compatibility
- `preventHardwareBackBehaviorAndroid`
- `TrayStickyFooter` helper component
- Swipe-to-dismiss gesture (planned - see `docs/tray-swipe-to-dismiss-web-implementation.md`)

---

## Achieved Parity ✅

The following features are now aligned between web and mobile:

1. **`hideHeader` prop** - Both platforms support hiding the header section
2. **`header` render function** - Both platforms support `header` as a function that receives `{ handleClose }`
3. **`footer` render function** - Both platforms support `footer` as a function that receives `{ handleClose }`
4. **`handleBarVariant`** - Both platforms support `'inside'` and `'outside'` variants
5. **Handle bar restriction** - Both platforms only show handle bar when `pin="bottom"`
6. **Handle bar styling slots** - Both platforms support `styles.handleBar` and `styles.handleBarHandle`

---

## Remaining Recommendations

1. **Align `verticalDrawerPercentageOfView` types** - Currently string (web) vs number (mobile)
2. **Align ref method names** - `close` (web) vs `handleClose` (mobile)
3. **Consider adding `role` prop to mobile** - For accessibility parity
4. **Implement swipe-to-dismiss on web** - See separate implementation plan document
