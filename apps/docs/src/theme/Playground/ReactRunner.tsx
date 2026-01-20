/**
 * ReactRunner wrapper component
 * Based on Material-UI's approach using react-runner library
 * 
 * This component wraps react-runner's useRunner hook and provides:
 * - Error handling
 * - Debouncing
 * - Scope management for imports
 */

import React, { memo, useEffect, useState } from 'react';
import { useRunner, importCode } from 'react-runner';
import type { ReactNode } from 'react';

export interface ReactRunnerProps {
  /** Code to execute (main file content) */
  code: string;
  /** Scope object with imports and globals */
  scope: {
    [key: string]: unknown;
    import?: {
      [modulePath: string]: unknown;
    };
  };
  /** Callback when error occurs */
  onError?: (error: Error | null) => void;
  /** TypeScript mode */
  type?: 'typescript' | 'javascript';
  /** Children render function */
  children?: (element: ReactNode, error: Error | null) => ReactNode;
}

/**
 * ReactRunner component that executes React code using react-runner
 */
export const ReactRunner = memo(({ code, scope, onError, type = 'typescript', children }: ReactRunnerProps) => {
  const [debouncedCode, setDebouncedCode] = useState(code);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Debounce code changes (300ms like Material-UI)
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      setDebouncedCode(code);
    }, 300);

    setDebounceTimer(timer);

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [code]);

  // Use react-runner's useRunner hook
  const { element, error } = useRunner({
    code: debouncedCode,
    scope,
    type,
  });

  // Call error callback when error changes
  useEffect(() => {
    if (onError) {
      onError(error);
    }
  }, [error, onError]);

  // If children is a function, call it with element and error
  if (typeof children === 'function') {
    return <>{children(element, error)}</>;
  }

  // Otherwise, just return the element (or error if present)
  if (error) {
    return null; // Error is handled by parent component
  }

  return <>{element}</>;
});

ReactRunner.displayName = 'ReactRunner';

/**
 * Helper function to create a virtual module from file content
 * Uses importCode to create an importable module
 */
export function createVirtualModule(
  fileContent: string,
  baseScope: Record<string, unknown>,
): unknown {
  return importCode(fileContent, baseScope);
}
