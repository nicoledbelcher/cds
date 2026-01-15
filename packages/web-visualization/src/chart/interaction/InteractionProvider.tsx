import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useCartesianChartContext } from '../ChartProvider';
import {
  type ActiveItem,
  type ActiveItems,
  InteractionContext,
  type InteractionContextValue,
  type InteractionMode,
  type InteractionScope,
  type InteractionState,
  isCategoricalScale,
  ScrubberContext,
  type ScrubberContextValue,
} from '../utils';

const defaultInteractionScope: InteractionScope = {
  dataIndex: true,
  series: false,
};

export type InteractionProviderProps = {
  children: React.ReactNode;
  /**
   * A reference to the root SVG element, where interaction event handlers will be attached.
   */
  svgRef: React.RefObject<SVGSVGElement> | null;
  /**
   * The interaction mode.
   * - 'none': Interaction disabled
   * - 'single': Single pointer/touch interaction (default)
   * - 'multi': Multi-touch/multi-pointer interaction
   * @default 'single'
   */
  interaction?: InteractionMode;
  /**
   * Controls what aspects of the data can be interacted with.
   * @default { dataIndex: true, series: false }
   */
  interactionScope?: InteractionScope;
  /**
   * Controlled active item state (for single mode).
   * - `undefined` or not passed: uncontrolled mode, listens to user input
   * - `null`: controlled mode with no active item, ignores user input
   * - `ActiveItem`: controlled mode with specific active item
   */
  activeItem?: ActiveItem | null;
  /**
   * Controlled active items state (for multi mode).
   * - `undefined` or not passed: uncontrolled mode, listens to user input
   * - Empty array `[]`: controlled mode with no active items, ignores user input
   * - `ActiveItems`: controlled mode with specific active items
   */
  activeItems?: ActiveItems;
  /**
   * Callback fired when the active item changes.
   * For single mode: receives `ActiveItem | undefined`
   * For multi mode: receives `ActiveItems`
   */
  onInteractionChange?: (state: InteractionState) => void;
  /**
   * Accessibility label for the chart.
   * - When a string: Used as a static label for the chart element
   * - When a function: Called with the active item to generate dynamic labels during interaction
   */
  accessibilityLabel?: string | ((activeItem: ActiveItem) => string);

  // Legacy props for backwards compatibility
  /**
   * @deprecated Use `interaction="single"` instead
   */
  enableScrubbing?: boolean;
  /**
   * @deprecated Use `onInteractionChange` instead
   */
  onScrubberPositionChange?: (index: number | undefined) => void;
};

/**
 * InteractionProvider manages chart interaction state and input handling.
 * It supports single and multi-pointer/touch interactions with configurable scope.
 */
export const InteractionProvider: React.FC<InteractionProviderProps> = ({
  children,
  svgRef,
  interaction: interactionProp,
  interactionScope: scopeProp,
  activeItem: controlledActiveItem,
  activeItems: controlledActiveItems,
  onInteractionChange,
  accessibilityLabel,
  // Legacy props
  enableScrubbing,
  onScrubberPositionChange,
}) => {
  const chartContext = useCartesianChartContext();

  if (!chartContext) {
    throw new Error('InteractionProvider must be used within a ChartContext');
  }

  const { getXScale, getXAxis, series } = chartContext;

  // Resolve interaction mode (with backwards compatibility)
  const interaction: InteractionMode = useMemo(() => {
    if (interactionProp !== undefined) return interactionProp;
    if (enableScrubbing !== undefined) return enableScrubbing ? 'single' : 'none';
    return 'single'; // Default to single
  }, [interactionProp, enableScrubbing]);

  const scope: InteractionScope = useMemo(
    () => ({ ...defaultInteractionScope, ...scopeProp }),
    [scopeProp],
  );

  // Determine if we're in controlled mode
  // null means "controlled with no active item" - distinct from undefined (uncontrolled)
  const isControlled = controlledActiveItem !== undefined || controlledActiveItems !== undefined;

  // Internal state for uncontrolled mode
  const [internalActiveItem, setInternalActiveItem] = useState<InteractionState>(
    interaction === 'multi' ? [] : undefined,
  );

  // Get the current active state (controlled or uncontrolled)
  // For controlled mode: null means "no active item" (different from undefined)
  const activeState: InteractionState = useMemo(() => {
    if (isControlled) {
      if (interaction === 'multi') {
        return controlledActiveItems ?? [];
      }
      // For single mode: null → undefined (no active item), otherwise use the value
      return controlledActiveItem ?? undefined;
    }
    return internalActiveItem;
  }, [isControlled, interaction, controlledActiveItem, controlledActiveItems, internalActiveItem]);

  // Update active state
  const setActiveState = useCallback(
    (newState: InteractionState) => {
      if (!isControlled) {
        setInternalActiveItem(newState);
      }
      onInteractionChange?.(newState);

      // Legacy callback support
      if (onScrubberPositionChange && interaction === 'single') {
        const singleState = newState as ActiveItem | undefined;
        onScrubberPositionChange(singleState?.dataIndex ?? undefined);
      }
    },
    [isControlled, onInteractionChange, onScrubberPositionChange, interaction],
  );

  // Convert X coordinate to data index
  const getDataIndexFromX = useCallback(
    (mouseX: number): number => {
      const xScale = getXScale();
      const xAxis = getXAxis();

      if (!xScale || !xAxis) return 0;

      if (isCategoricalScale(xScale)) {
        const categories = xScale.domain?.() ?? xAxis.data ?? [];
        const bandwidth = xScale.bandwidth?.() ?? 0;
        let closestIndex = 0;
        let closestDistance = Infinity;
        for (let i = 0; i < categories.length; i++) {
          const xPos = xScale(i);
          if (xPos !== undefined) {
            const distance = Math.abs(mouseX - (xPos + bandwidth / 2));
            if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = i;
            }
          }
        }
        return closestIndex;
      } else {
        // For numeric scales with axis data, find the nearest data point
        const axisData = xAxis.data;
        if (axisData && Array.isArray(axisData) && typeof axisData[0] === 'number') {
          const numericData = axisData as number[];
          let closestIndex = 0;
          let closestDistance = Infinity;

          for (let i = 0; i < numericData.length; i++) {
            const xValue = numericData[i];
            const xPos = xScale(xValue);
            if (xPos !== undefined) {
              const distance = Math.abs(mouseX - xPos);
              if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = i;
              }
            }
          }
          return closestIndex;
        } else {
          const xValue = xScale.invert(mouseX);
          const dataIndex = Math.round(xValue);
          const domain = xAxis.domain;
          return Math.max(domain.min ?? 0, Math.min(dataIndex, domain.max ?? 0));
        }
      }
    },
    [getXScale, getXAxis],
  );

  // Find series at a given point (for series scope)
  const getSeriesIdFromPoint = useCallback(
    (_mouseX: number, _mouseY: number): string | null => {
      // TODO: Implement series detection based on proximity to data points
      // For now, return null (series scope not fully implemented)
      if (!scope.series) return null;
      return null;
    },
    [scope.series],
  );

  // Convert pointer position to ActiveItem
  const getActiveItemFromPointer = useCallback(
    (clientX: number, clientY: number, target: SVGSVGElement): ActiveItem => {
      const rect = target.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const dataIndex = scope.dataIndex ? getDataIndexFromX(x) : null;
      const seriesId = scope.series ? getSeriesIdFromPoint(x, y) : null;

      return { dataIndex, seriesId };
    },
    [scope.dataIndex, scope.series, getDataIndexFromX, getSeriesIdFromPoint],
  );

  // Track active pointers for multi-touch
  const activePointersRef = React.useRef<Map<number, { clientX: number; clientY: number }>>(
    new Map(),
  );

  // Handle pointer move
  const handlePointerMove = useCallback(
    (clientX: number, clientY: number, target: SVGSVGElement) => {
      if (interaction === 'none' || !series || series.length === 0) return;

      const newActiveItem = getActiveItemFromPointer(clientX, clientY, target);

      if (interaction === 'single') {
        const currentItem = activeState as ActiveItem | undefined;

        // When series scope is enabled, preserve the existing seriesId
        // (let bar components handle setting/clearing seriesId via their own handlers)
        const effectiveSeriesId = scope.series
          ? (currentItem?.seriesId ?? newActiveItem.seriesId)
          : newActiveItem.seriesId;

        const effectiveItem = { ...newActiveItem, seriesId: effectiveSeriesId };

        if (
          effectiveItem.dataIndex !== currentItem?.dataIndex ||
          effectiveItem.seriesId !== currentItem?.seriesId
        ) {
          setActiveState(effectiveItem);
        }
      } else if (interaction === 'multi') {
        // For mouse in multi mode, treat as a single pointer
        const currentItems = (activeState as ActiveItems) ?? [];
        const currentSeriesId = scope.series ? currentItems[0]?.seriesId : null;
        const effectiveItem = {
          ...newActiveItem,
          seriesId: currentSeriesId ?? newActiveItem.seriesId,
        };

        if (
          currentItems.length !== 1 ||
          currentItems[0]?.dataIndex !== effectiveItem.dataIndex ||
          currentItems[0]?.seriesId !== effectiveItem.seriesId
        ) {
          setActiveState([effectiveItem]);
        }
      }
    },
    [interaction, series, scope.series, getActiveItemFromPointer, activeState, setActiveState],
  );

  // Handle multi-pointer update
  const updateMultiPointerState = useCallback(
    (target: SVGSVGElement) => {
      if (interaction !== 'multi') return;

      const activeItems: ActiveItems = Array.from(activePointersRef.current.values()).map(
        (pointer) => getActiveItemFromPointer(pointer.clientX, pointer.clientY, target),
      );

      setActiveState(activeItems);
    },
    [interaction, getActiveItemFromPointer, setActiveState],
  );

  // Mouse event handlers
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      const target = event.currentTarget as SVGSVGElement;
      handlePointerMove(event.clientX, event.clientY, target);
    },
    [handlePointerMove],
  );

  const handleMouseLeave = useCallback(() => {
    if (interaction === 'none') return;
    setActiveState(interaction === 'multi' ? [] : undefined);
  }, [interaction, setActiveState]);

  // Touch event handlers
  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      if (interaction === 'none' || !event.touches.length) return;

      const target = event.currentTarget as SVGSVGElement;

      if (interaction === 'multi') {
        // Track all touches
        for (let i = 0; i < event.touches.length; i++) {
          const touch = event.touches[i];
          activePointersRef.current.set(touch.identifier, {
            clientX: touch.clientX,
            clientY: touch.clientY,
          });
        }
        updateMultiPointerState(target);
      } else {
        // Single touch
        const touch = event.touches[0];
        handlePointerMove(touch.clientX, touch.clientY, target);
      }
    },
    [interaction, handlePointerMove, updateMultiPointerState],
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (interaction === 'none' || !event.touches.length) return;
      event.preventDefault(); // Prevent scrolling while interacting

      const target = event.currentTarget as SVGSVGElement;

      if (interaction === 'multi') {
        // Update all touches
        for (let i = 0; i < event.touches.length; i++) {
          const touch = event.touches[i];
          activePointersRef.current.set(touch.identifier, {
            clientX: touch.clientX,
            clientY: touch.clientY,
          });
        }
        updateMultiPointerState(target);
      } else {
        // Single touch
        const touch = event.touches[0];
        handlePointerMove(touch.clientX, touch.clientY, target);
      }
    },
    [interaction, handlePointerMove, updateMultiPointerState],
  );

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (interaction === 'none') return;

      if (interaction === 'multi') {
        // Remove ended touches
        for (let i = 0; i < event.changedTouches.length; i++) {
          const touch = event.changedTouches[i];
          activePointersRef.current.delete(touch.identifier);
        }

        if (activePointersRef.current.size === 0) {
          setActiveState([]);
        } else {
          const target = event.currentTarget as SVGSVGElement;
          updateMultiPointerState(target);
        }
      } else {
        setActiveState(undefined);
      }
    },
    [interaction, setActiveState, updateMultiPointerState],
  );

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (interaction === 'none') return;

      const xScale = getXScale();
      const xAxis = getXAxis();

      if (!xScale || !xAxis) return;

      const isBand = isCategoricalScale(xScale);

      // Determine navigation bounds
      let minIndex: number;
      let maxIndex: number;

      if (isBand) {
        const categories = xScale.domain?.() ?? xAxis.data ?? [];
        minIndex = 0;
        maxIndex = Math.max(0, categories.length - 1);
      } else {
        const axisData = xAxis.data;
        if (axisData && Array.isArray(axisData)) {
          minIndex = 0;
          maxIndex = Math.max(0, axisData.length - 1);
        } else {
          const domain = xAxis.domain;
          minIndex = domain.min ?? 0;
          maxIndex = domain.max ?? 0;
        }
      }

      const currentItem = (activeState as ActiveItem | undefined) ?? {
        dataIndex: null,
        seriesId: null,
      };
      const currentIndex = currentItem.dataIndex ?? minIndex;
      const dataRange = maxIndex - minIndex;

      // Multi-step jump when shift is held (10% of data range, minimum 1, maximum 10)
      const multiSkip = event.shiftKey;
      const stepSize = multiSkip ? Math.min(10, Math.max(1, Math.floor(dataRange * 0.1))) : 1;

      let newIndex: number | undefined;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          newIndex = Math.max(minIndex, currentIndex - stepSize);
          break;
        case 'ArrowRight':
          event.preventDefault();
          newIndex = Math.min(maxIndex, currentIndex + stepSize);
          break;
        case 'Home':
          event.preventDefault();
          newIndex = minIndex;
          break;
        case 'End':
          event.preventDefault();
          newIndex = maxIndex;
          break;
        case 'Escape':
          event.preventDefault();
          setActiveState(interaction === 'multi' ? [] : undefined);
          return;
        default:
          return;
      }

      if (newIndex !== currentItem.dataIndex) {
        const newActiveItem: ActiveItem = {
          dataIndex: newIndex,
          seriesId: currentItem.seriesId,
        };
        setActiveState(newActiveItem);
      }
    },
    [interaction, getXScale, getXAxis, activeState, setActiveState],
  );

  const handleBlur = useCallback(() => {
    if (interaction === 'none' || activeState === undefined) return;
    setActiveState(interaction === 'multi' ? [] : undefined);
  }, [interaction, activeState, setActiveState]);

  // Attach event listeners to SVG element
  useEffect(() => {
    if (!svgRef?.current || interaction === 'none') return;

    const svg = svgRef.current;

    svg.addEventListener('mousemove', handleMouseMove);
    svg.addEventListener('mouseleave', handleMouseLeave);
    svg.addEventListener('touchstart', handleTouchStart, { passive: false });
    svg.addEventListener('touchmove', handleTouchMove, { passive: false });
    svg.addEventListener('touchend', handleTouchEnd);
    svg.addEventListener('touchcancel', handleTouchEnd);
    svg.addEventListener('keydown', handleKeyDown);
    svg.addEventListener('blur', handleBlur);

    return () => {
      svg.removeEventListener('mousemove', handleMouseMove);
      svg.removeEventListener('mouseleave', handleMouseLeave);
      svg.removeEventListener('touchstart', handleTouchStart);
      svg.removeEventListener('touchmove', handleTouchMove);
      svg.removeEventListener('touchend', handleTouchEnd);
      svg.removeEventListener('touchcancel', handleTouchEnd);
      svg.removeEventListener('keydown', handleKeyDown);
      svg.removeEventListener('blur', handleBlur);
    };
  }, [
    svgRef,
    interaction,
    handleMouseMove,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown,
    handleBlur,
  ]);

  // Update accessibility label when active item changes
  useEffect(() => {
    if (!svgRef?.current || !accessibilityLabel) return;

    const svg = svgRef.current;

    // If it's a static string, always use it
    if (typeof accessibilityLabel === 'string') {
      svg.setAttribute('aria-label', accessibilityLabel);
      return;
    }

    // If it's a function, use it for dynamic labels during interaction
    if (interaction === 'none') return;

    const currentItem = interaction === 'single' ? (activeState as ActiveItem | undefined) : null;

    if (currentItem && currentItem.dataIndex !== null) {
      svg.setAttribute('aria-label', accessibilityLabel(currentItem));
    } else {
      svg.removeAttribute('aria-label');
    }
  }, [svgRef, interaction, activeState, accessibilityLabel]);

  const contextValue: InteractionContextValue = useMemo(
    () => ({
      mode: interaction,
      scope,
      activeItem: activeState,
      setActiveItem: setActiveState,
    }),
    [interaction, scope, activeState, setActiveState],
  );

  // Provide ScrubberContext for backwards compatibility with Scrubber component
  // Derive scrubberPosition from activeItem.dataIndex
  const scrubberPosition = useMemo(() => {
    if (interaction === 'none') return undefined;
    if (interaction === 'single') {
      const item = activeState as ActiveItem | undefined;
      return item?.dataIndex ?? undefined;
    }
    // For multi mode, use the first item's dataIndex
    const items = activeState as ActiveItems | undefined;
    return items?.[0]?.dataIndex ?? undefined;
  }, [interaction, activeState]);

  const scrubberContextValue: ScrubberContextValue = useMemo(
    () => ({
      enableScrubbing: interaction !== 'none',
      scrubberPosition,
      onScrubberPositionChange: (index: number | undefined) => {
        if (interaction === 'none') return;
        if (index === undefined) {
          setActiveState(undefined);
        } else {
          setActiveState({ dataIndex: index, seriesId: null });
        }
      },
    }),
    [interaction, scrubberPosition, setActiveState],
  );

  return (
    <InteractionContext.Provider value={contextValue}>
      <ScrubberContext.Provider value={scrubberContextValue}>{children}</ScrubberContext.Provider>
    </InteractionContext.Provider>
  );
};
