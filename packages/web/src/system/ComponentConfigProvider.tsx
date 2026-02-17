import React, { createContext, useContext, useRef } from 'react';
import { createStore, type StoreApi } from 'zustand';

import type { ComponentsConfig, ComponentTheme } from '../core/theme';

/**
 * Internal store state: each component key holds its raw config value
 * (static object or resolver function) exactly as the consumer provided it.
 * Storing raw values preserves reference identity so zustand selectors can
 * skip re-renders for unchanged entries via Object.is comparison.
 */
export type ComponentConfigState = {
  [K in keyof ComponentTheme]?: ComponentTheme[K];
} & {
  mergeClassNameAndStyle: boolean;
};

/** Builds the full store state from a ComponentsConfig, optionally inheriting from a parent store. */
const buildStoreState = (
  config: ComponentsConfig | undefined,
  mergeClassNameAndStyle: boolean,
  parentState?: ComponentConfigState,
): ComponentConfigState => {
  const state: Record<string, any> = {
    mergeClassNameAndStyle: parentState?.mergeClassNameAndStyle ?? false,
  };

  if (parentState) {
    for (const key of Object.keys(parentState)) {
      if (key !== 'mergeClassNameAndStyle') {
        state[key] = parentState[key as keyof typeof parentState];
      }
    }
  }

  state.mergeClassNameAndStyle = mergeClassNameAndStyle;

  if (config) {
    for (const [key, value] of Object.entries(config)) {
      if (value !== undefined) {
        state[key] = value;
      }
    }
  }

  return state as ComponentConfigState;
};

const ComponentConfigStoreContext = createContext<StoreApi<ComponentConfigState> | null>(null);

export type ComponentConfigProviderProps = {
  /** Component config: static objects and/or functional resolvers per component. */
  value?: ComponentsConfig;
  /**
   * Controls how component props from config are merged with local component props.
   * @default false
   *
   * - When `false` (default): Local props simply override config props (standard object spread behavior).
   * - When `true`: Special merging behavior for styling props:
   *   - `className`: Concatenated using cx()
   *   - `classNames`: Object keys merged, each value concatenated with cx()
   *   - `style`: Shallow merge (local props override config)
   *   - `styles`: Object keys merged, each value shallow merged
   *   - All other props: Local props override config
   */
  mergeClassNameAndStyle?: boolean;
  children?: React.ReactNode;
};

/**
 * Provides component-level default props via a zustand store.
 * Each component subscribes to only its own config slice, preventing cross-component re-renders.
 * Supports nesting: child providers inherit parent config and can override per-component.
 */
export const ComponentConfigProvider = ({
  value,
  mergeClassNameAndStyle = false,
  children,
}: ComponentConfigProviderProps) => {
  const parentStore = useContext(ComponentConfigStoreContext);

  const storeRef = useRef<StoreApi<ComponentConfigState> | null>(null);

  if (!storeRef.current) {
    storeRef.current = createStore<ComponentConfigState>(() =>
      buildStoreState(value, mergeClassNameAndStyle, parentStore?.getState()),
    );
  }

  const newState = buildStoreState(value, mergeClassNameAndStyle, parentStore?.getState());
  storeRef.current.setState(newState, true);

  return (
    <ComponentConfigStoreContext.Provider value={storeRef.current}>
      {children}
    </ComponentConfigStoreContext.Provider>
  );
};

/** Singleton empty store used when no ComponentConfigProvider exists in the tree. */
const emptyStore = createStore<ComponentConfigState>(() => ({
  mergeClassNameAndStyle: false,
}));

/** Returns the nearest ComponentConfigProvider's zustand store, or the empty fallback. */
export const useComponentConfigStore = (): StoreApi<ComponentConfigState> => {
  const store = useContext(ComponentConfigStoreContext);
  return store ?? emptyStore;
};
