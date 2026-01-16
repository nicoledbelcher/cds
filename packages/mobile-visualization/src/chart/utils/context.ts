import { createContext, useContext } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import type { Rect } from '@coinbase/cds-common/types';
import type { SkTypefaceFontProvider } from '@shopify/react-native-skia';

import type { AxisConfig } from './axis';
import type { Series } from './chart';
import type { ChartScaleFunction, SerializableScale } from './scale';

/**
 * Context value for Cartesian (X/Y) coordinate charts.
 * Contains axis-specific methods and properties for rectangular coordinate systems.
 */
export type CartesianChartContextValue = {
  /**
   * The series data for the chart.
   */
  series: Series[];
  /**
   * Returns the series which matches the seriesId or undefined.
   * @param seriesId - A series' id
   */
  getSeries: (seriesId?: string) => Series | undefined;
  /**
   * Returns the data for a series
   * @param seriesId - A series' id
   * @returns data for series, if series exists
   */
  getSeriesData: (seriesId?: string) => Array<[number, number] | null> | undefined;
  /**
   * Whether to animate the chart.
   */
  animate: boolean;
  /**
   * Width of the chart SVG.
   */
  width: number;
  /**
   * Height of the chart SVG.
   */
  height: number;
  /**
   * Default font families to use within ChartText.
   * When not set, should use the default for the system.
   */
  fontFamilies?: string[];
  /**
   * Skia font provider.
   */
  fontProvider: SkTypefaceFontProvider;
  /**
   * Get x-axis configuration.
   */
  getXAxis: () => AxisConfig | undefined;
  /**
   * Get y-axis configuration by ID.
   * @param id - The axis ID. Defaults to defaultAxisId.
   */
  getYAxis: (id?: string) => AxisConfig | undefined;
  /**
   * Get x-axis scale function.
   */
  getXScale: () => ChartScaleFunction | undefined;
  /**
   * Get y-axis scale function by ID.
   * @param id - The axis ID. Defaults to defaultAxisId.
   */
  getYScale: (id?: string) => ChartScaleFunction | undefined;
  /**
   * Get x-axis serializable scale function that can be used in worklets.
   */
  getXSerializableScale: () => SerializableScale | undefined;
  /**
   * Get y-axis serializable scale function by ID that can be used in worklets.
   * @param id - The axis ID. Defaults to defaultAxisId.
   */
  getYSerializableScale: (id?: string) => SerializableScale | undefined;
  /**
   * Drawing area of the chart.
   */
  drawingArea: Rect;
  /**
   * Length of the data domain.
   * This is equal to the length of xAxis.data or the longest series data length
   * This equals the number of possible scrubber positions
   */
  dataLength: number;
  /**
   * Registers an axis.
   * Used by axis components to reserve space in the chart, preventing overlap with the drawing area.
   * @param id - The axis ID
   * @param position - The axis position ('top'/'bottom' for x-axis, 'left'/'right' for y-axis)
   * @param size - The size of the axis in pixels
   */
  registerAxis: (id: string, position: 'top' | 'bottom' | 'left' | 'right', size: number) => void;
  /**
   * Unregisters an axis.
   */
  unregisterAxis: (id: string) => void;
  /**
   * Gets the rectangle bounds of a requested axis.
   * Computes the bounds of the axis based on the chart's drawing area chart/axis config, and axis position.
   */
  getAxisBounds: (id: string) => Rect | undefined;
};

export type ScrubberContextValue = {
  /**
   * Enables scrubbing interactions.
   * When true, allows scrubbing and makes scrubber components interactive.
   */
  enableScrubbing: boolean;
  /**
   * The current position of the scrubber.
   */
  scrubberPosition: SharedValue<number | undefined>;
};

export const ScrubberContext = createContext<ScrubberContextValue | undefined>(undefined);

export const useScrubberContext = (): ScrubberContextValue => {
  const context = useContext(ScrubberContext);
  if (!context) {
    throw new Error('useScrubberContext must be used within a Chart component');
  }
  return context;
};

// ============================================================================
// Interaction Types (New API)
// ============================================================================

/**
 * Interaction mode - controls how many simultaneous interactions to track.
 * - 'none': Interaction disabled
 * - 'single': Single touch interaction (default)
 * - 'multi': Multi-touch interaction
 */
export type InteractionMode = 'none' | 'single' | 'multi';

/**
 * Controls what aspects of the data can be interacted with.
 */
export type InteractionScope = {
  /**
   * Whether interaction tracks data index (x-axis position).
   * @default true
   */
  dataIndex?: boolean;
  /**
   * Whether interaction tracks specific series.
   * @default false
   */
  series?: boolean;
};

/**
 * Represents a single active item during interaction.
 * - `undefined` means the user is not interacting with the chart
 * - `null` values mean the user is interacting but not over a specific item/series
 */
export type ActiveItem = {
  /**
   * The data index (x-axis position) being interacted with.
   * `null` when interacting but not over a data point.
   */
  dataIndex: number | null;
  /**
   * The series ID being interacted with.
   * `null` when series scope is disabled or not over a specific series.
   */
  seriesId: string | null;
};

/**
 * Active items for multi-touch interaction.
 */
export type ActiveItems = Array<ActiveItem>;

/**
 * Unified interaction state.
 * - For 'single' mode: `ActiveItem | undefined`
 * - For 'multi' mode: `ActiveItems` (empty array when not interacting)
 */
/**
 * The state of the interaction.
 * - `undefined`: No active interaction (uncontrolled)
 * - `null`: Controlled mode with no active item (gestures ignored)
 * - `ActiveItem`: Single active item
 * - `ActiveItems`: Multiple active items (multi-touch)
 */
export type InteractionState = ActiveItem | ActiveItems | undefined | null;

// ============================================================================
// Interaction Registry Types (for coordinate-based hit testing on mobile)
// ============================================================================

/**
 * Bounds of an interactive element (bar, point, etc.)
 * Used for coordinate-based hit testing since Skia doesn't have native touch events.
 */
export type ElementBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
  dataIndex: number;
  seriesId: string;
};

/**
 * Bounds of a point (circle) element.
 */
export type PointBounds = {
  cx: number;
  cy: number;
  radius: number;
  dataIndex: number;
  seriesId: string;
};

/**
 * Line path for hit testing.
 */
export type LinePath = {
  pathString: string;
  seriesId: string;
};

/**
 * Registry of interactive elements for coordinate-based hit testing.
 * Elements are stored in render order (last = on top).
 */
export type InteractionRegistry = {
  bars: ElementBounds[];
  points: PointBounds[];
  lines: LinePath[];
};

/**
 * Context value for chart interaction state (mobile).
 * Uses SharedValue for UI thread performance.
 */
export type InteractionContextValue = {
  /**
   * The current interaction mode.
   */
  mode: InteractionMode;
  /**
   * The interaction scope configuration.
   */
  scope: InteractionScope;
  /**
   * The current active item(s) during interaction.
   * For 'single' mode: SharedValue<ActiveItem | undefined | null>
   * For 'multi' mode: SharedValue<ActiveItems>
   */
  activeItem: SharedValue<InteractionState>;
  /**
   * Function to programmatically set the active item.
   */
  setActiveItem: (state: InteractionState) => void;
  /**
   * Register a bar element for hit testing.
   */
  registerBar: (bounds: ElementBounds) => void;
  /**
   * Unregister a bar element.
   */
  unregisterBar: (seriesId: string, dataIndex: number) => void;
  /**
   * Register a point element for hit testing.
   */
  registerPoint: (bounds: PointBounds) => void;
  /**
   * Unregister a point element.
   */
  unregisterPoint: (seriesId: string, dataIndex: number) => void;
  /**
   * Register a line path for hit testing.
   */
  registerLine: (path: LinePath) => void;
  /**
   * Unregister a line path.
   */
  unregisterLine: (seriesId: string) => void;
};

export const InteractionContext = createContext<InteractionContextValue | undefined>(undefined);

/**
 * Hook to access the interaction context.
 * @throws Error if used outside of an InteractionProvider
 */
export const useInteractionContext = (): InteractionContextValue => {
  const context = useContext(InteractionContext);
  if (!context) {
    throw new Error('useInteractionContext must be used within an InteractionProvider');
  }
  return context;
};

/**
 * Hook to optionally access the interaction context.
 * Returns undefined if not within an InteractionProvider.
 */
export const useOptionalInteractionContext = (): InteractionContextValue | undefined => {
  return useContext(InteractionContext);
};
