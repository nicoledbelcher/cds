# Multi-Touch Scrubbing

The `CartesianChart` component supports multi-touch scrubbing, allowing users to compare two data points simultaneously by using multiple touch points or pointer inputs.

## Overview

By default, scrubbing uses **single mode** - one touch/pointer controls one scrubber line. With **multi mode**, users can place two touch points to see two scrubber lines, useful for comparing values across a range.

## Usage

### Single Mode (Default)

```tsx
import { CartesianChart, Scrubber, Line } from '@coinbase/cds-web-visualization';

function SingleScrubChart() {
  const [index, setIndex] = useState<number | undefined>();

  return (
    <CartesianChart
      enableScrubbing
      scrubbingMode="single" // Optional, this is the default
      onScrubberPositionChange={setIndex}
      series={[{ id: 'prices', data: priceData }]}
    >
      <Line seriesId="prices" />
      <Scrubber label={(idx) => `$${priceData[idx]}`} />
    </CartesianChart>
  );
}
```

### Multi Mode

```tsx
import { CartesianChart, Scrubber, Line } from '@coinbase/cds-web-visualization';

function MultiScrubChart() {
  const [indices, setIndices] = useState<(number | undefined)[]>([]);

  const handlePositionChange = (newIndices: (number | undefined)[] | undefined) => {
    setIndices(newIndices ?? []);
  };

  return (
    <CartesianChart
      enableScrubbing
      scrubbingMode="multi"
      onScrubberPositionChange={handlePositionChange}
      series={[{ id: 'prices', data: priceData }]}
    >
      <Line seriesId="prices" />
      <Scrubber
        label={(idx) => `$${priceData[idx]}`}
        multiLabel={(indices) => {
          const [start, end] = indices.filter(i => i !== undefined).sort((a, b) => a - b);
          const diff = priceData[end] - priceData[start];
          return `${diff >= 0 ? '+' : ''}$${diff.toFixed(2)}`;
        }}
      />
    </CartesianChart>
  );
}
```

## Interaction Patterns

| Platform | Single Touch | Add Second Touch |
|----------|--------------|------------------|
| Touch devices | Tap/drag | Use two fingers |
| Desktop (mouse) | Click/drag | Shift+Click |
| Desktop (trackpad) | Click/drag | Shift+Click |

## API Reference

### CartesianChart Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableScrubbing` | `boolean` | `false` | Enables scrubbing interactions |
| `scrubbingMode` | `'single' \| 'multi'` | `'single'` | Controls single or multi-touch behavior |
| `onScrubberPositionChange` | See below | - | Callback when scrubber position changes |

#### Callback Types

```typescript
// Single mode callback
onScrubberPositionChange?: (index: number | undefined) => void;

// Multi mode callback
onScrubberPositionChange?: (indices: (number | undefined)[] | undefined) => void;
```

### Scrubber Props

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string \| ((index: number) => ReactNode)` | Label for single-touch mode |
| `multiLabel` | `(indices: (number \| undefined)[]) => ReactNode` | Label shown centered between two scrubber lines in multi mode |
| `lineStroke` | `string` | Color for the primary scrubber line |
| `secondaryLineStroke` | `string` | Color for the secondary scrubber line (multi mode) |

## Architecture

### Context Structure

The scrubber state is managed through `ScrubberContext`:

```typescript
type ScrubberContextValue = {
  enableScrubbing: boolean;
  scrubbingMode: 'single' | 'multi';
  scrubberPosition: number | undefined;           // Primary touch
  additionalScrubberPositions: (number | undefined)[]; // Additional touches
};
```

### Component Behavior

- **Beacons**: Always rendered at the primary scrubber position only
- **Lines**: One line per touch point (up to 2 in built-in component)
- **Labels**: 
  - Single mode: Label follows the scrubber line
  - Multi mode: `multiLabel` is centered between two lines
- **Overlay**: Spans from left edge to rightmost scrubber position

## Type System Design

### Why Not Discriminated Unions?

Initially, we considered using TypeScript discriminated unions to enforce the correct callback type based on `scrubbingMode`:

```typescript
// This approach doesn't work well in practice
type SingleScrubbingProps = {
  scrubbingMode?: 'single';
  onScrubberPositionChange?: (index: number | undefined) => void;
};

type MultiScrubbingProps = {
  scrubbingMode: 'multi';
  onScrubberPositionChange?: (indices: (number | undefined)[]) => void;
};

type Props = SingleScrubbingProps | MultiScrubbingProps;
```

**Problem**: TypeScript loses discriminated union narrowing when props are:
- Destructured in component bodies
- Spread between components (e.g., `LineChart` → `CartesianChart`)
- Passed through HOCs or wrappers

### Current Approach: Union Callback Type

```typescript
onScrubberPositionChange?:
  | ((index: number | undefined) => void)
  | ((indices: (number | undefined)[] | undefined) => void);
```

**Benefits**:
- Works with prop spreading and composition
- Still validates callback signatures at compile time
- Runtime behavior is correct based on `scrubbingMode`

**Tradeoff**:
- TypeScript doesn't enforce which callback shape to use based on mode
- Relies on documentation and runtime behavior

### Type Safety in Practice

The runtime code ensures type safety:

```typescript
// In ScrubberProvider
if (scrubbingMode === 'multi') {
  onScrubberPositionChange?.([primaryIndex, ...additionalIndices]);
} else {
  onScrubberPositionChange?.(primaryIndex);
}
```

Users get type errors if their callback has an invalid signature, and the runtime guarantees the correct argument type is passed based on mode.

## Mobile Support

Multi-touch scrubbing is also available on `@coinbase/cds-mobile-visualization` with the same API. The mobile implementation uses React Native Gesture Handler for touch tracking.

## Examples

See the Storybook story at:
- **Components > Chart > CartesianChart > Multi Touch Scrubbing**

This example demonstrates:
- Range comparison with price diff display
- Custom `multiLabel` showing the change between two points
- Different line colors for primary and secondary scrubbers
