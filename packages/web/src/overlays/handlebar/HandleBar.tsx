import React, { memo, useMemo } from 'react';
import { handleBarHeight } from '@coinbase/cds-common/tokens/drawer';
import type { ThemeVars } from '@coinbase/cds-common';

import { useTheme } from '../../hooks/useTheme';
import { Box } from '../../layout';

export type HandleBarProps = {
  /** Background color of the handle bar */
  background?: ThemeVars.Color;
  /** Class name for the root container */
  className?: string;
  /** Class name for the handle element */
  handleClassName?: string;
  /** Inline styles for the root container */
  style?: React.CSSProperties;
  /** Inline styles for the handle element */
  handleStyle?: React.CSSProperties;
  /** Test ID for the component */
  testID?: string;
};

export const HandleBar = memo(function HandleBar({
  background = 'bgSecondary',
  className,
  handleClassName,
  style,
  handleStyle,
  testID = 'handleBar',
}: HandleBarProps) {
  const theme = useTheme();

  const handleBarBackgroundColor = theme.color[background];

  const containerStyle: React.CSSProperties = useMemo(
    () => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: theme.space[2],
      paddingBottom: theme.space[2],
      ...style,
    }),
    [theme.space, style],
  );

  const handleStyle_: React.CSSProperties = useMemo(
    () => ({
      width: 64,
      height: handleBarHeight,
      backgroundColor: handleBarBackgroundColor,
      borderRadius: 4,
      ...handleStyle,
    }),
    [handleBarBackgroundColor, handleStyle],
  );

  return (
    <Box className={className} data-testid={testID} style={containerStyle}>
      <Box className={handleClassName} style={handleStyle_} />
    </Box>
  );
});

HandleBar.displayName = 'HandleBar';
