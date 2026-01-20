import React, { memo, useEffect, useState } from 'react';
import { Banner } from '@coinbase/cds-web/banner/Banner';
import { Box } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography/Text';
import { withLive } from 'react-live';
import debounce from 'lodash/debounce';

type PlaygroundErrorProps = {
  live?: {
    error?: string | null;
  };
  error?: string | null; // Direct error prop for react-runner
};

const PlaygroundErrorComponent = memo(({ live, error: directError }: PlaygroundErrorProps) => {
  const [debouncedError, setDebouncedError] = useState<string | null>(null);

  useEffect(() => {
    const debouncedSetError = debounce((error: string | null) => {
      console.log('[PlaygroundError] Setting debounced error:', error);
      setDebouncedError(error);
    }, 300);

    // Use direct error prop (react-runner) or live context error (react-live)
    const error = directError ?? live?.error;
    console.log('[PlaygroundError] Raw error:', error);
    if (error) {
      debouncedSetError(error);
    } else {
      // Clear error immediately when there's no error
      debouncedSetError.cancel();
      setDebouncedError(null);
    }

    return () => {
      debouncedSetError.cancel();
    };
  }, [live?.error, directError]);

  if (!debouncedError) {
    return null;
  }

  // Format error message - remove stack traces and clean up
  const formatError = (error: string): string => {
    console.log('[PlaygroundError] Formatting error:', error);
    // Remove common stack trace patterns
    let formatted = error
      .split('\n')[0] // Take first line
      .replace(/^Error: /, '') // Remove "Error: " prefix
      .trim();

    // Limit length for display
    if (formatted.length > 200) {
      formatted = formatted.substring(0, 197) + '...';
    }

    console.log('[PlaygroundError] Formatted error:', formatted);
    return formatted;
  };

  return (
    <Box
      position="absolute"
      style={{
        top: 0,
        left: '50%',
        transform: 'translateX(-50%) translateY(-50%)',
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      <Box style={{ pointerEvents: 'auto' }}>
        <Banner
          variant="error"
          startIcon="error"
          startIconActive
          styleVariant="inline"
          minWidth={0}
          role="alert"
          aria-live="polite"
        >
          <Text as="p" font="label2">
            {formatError(debouncedError)}
          </Text>
        </Banner>
      </Box>
    </Box>
  );
});

PlaygroundErrorComponent.displayName = 'PlaygroundError';

// Use withLive HOC to access react-live context
export const PlaygroundError = withLive(PlaygroundErrorComponent);
