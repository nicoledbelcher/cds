import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PinningDirection } from '@coinbase/cds-common';
import { MAX_OVER_DRAG } from '@coinbase/cds-common/animation/drawer';

import { useSafeBottomPadding } from '../../hooks/useSafeBottomPadding';

type UseDrawerSpacingOptions = {
  /**
   * Disable bottom safe area padding. Use when content handles its own bottom padding.
   * @default false
   */
  disableBottomSafeAreaPadding?: boolean;
};

export const useDrawerSpacing = (
  pin: PinningDirection | undefined = 'bottom',
  options: UseDrawerSpacingOptions = {},
) => {
  const { disableBottomSafeAreaPadding = false } = options;
  const { top } = useSafeAreaInsets();
  const safeBottomPadding: number = useSafeBottomPadding();

  const safeAreaStyles = useMemo(() => {
    switch (pin) {
      case 'top':
        return { paddingTop: top + MAX_OVER_DRAG };
      case 'left':
        return { paddingTop: top, paddingLeft: MAX_OVER_DRAG };
      case 'bottom':
        return disableBottomSafeAreaPadding
          ? { paddingBottom: MAX_OVER_DRAG }
          : { paddingBottom: safeBottomPadding + MAX_OVER_DRAG };
      case 'right':
        return { paddingTop: top, paddingRight: MAX_OVER_DRAG };
      default:
        return disableBottomSafeAreaPadding
          ? { paddingBottom: MAX_OVER_DRAG }
          : { paddingBottom: safeBottomPadding + MAX_OVER_DRAG };
    }
  }, [pin, safeBottomPadding, top, disableBottomSafeAreaPadding]);

  return safeAreaStyles;
};
