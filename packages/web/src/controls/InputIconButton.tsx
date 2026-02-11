import React, { forwardRef, memo, useContext } from 'react';
import type { IconButtonVariant, InputVariant } from '@coinbase/cds-common/types';

import {
  IconButton,
  type IconButtonDefaultElement,
  type IconButtonProps,
} from '../buttons/IconButton';
import { useTheme } from '../hooks/useTheme';
import { Box } from '../layout/Box';
import { mergeComponentProps } from '../utils/mergeComponentProps';

import { TextInputFocusVariantContext } from './context';

export const variantTransformMap: Record<InputVariant, IconButtonVariant> = {
  positive: 'primary',
  negative: 'primary',
  foreground: 'primary',
  primary: 'primary',
  foregroundMuted: 'foregroundMuted',
  secondary: 'secondary',
};

export type InputIconButtonProps = IconButtonProps<IconButtonDefaultElement> & {
  /**
   * If set to true, when parent input is focused, the icon will match the color of the focus state
   * @default false
   * */
  disableInheritFocusStyle?: boolean;
};

export const InputIconButton = memo(
  forwardRef(function InputIconButton(
    _props: InputIconButtonProps,
    ref: React.ForwardedRef<HTMLButtonElement>,
  ) {
    const { components } = useTheme();
    const mergedProps = mergeComponentProps(
      components?.InputIconButton,
      _props,
      components?.mergeClassNameAndStyle,
    );
    const {
      disableInheritFocusStyle = false,
      testID,
      variant = 'primary',
      ...props
    } = mergedProps;
    const contextVariant = useContext(TextInputFocusVariantContext);
    const transformedVariant = contextVariant ? variantTransformMap[contextVariant] : variant;

    return (
      <Box paddingEnd={0.5} paddingStart={1} testID={testID}>
        <IconButton
          ref={ref}
          transparent
          variant={disableInheritFocusStyle ? variant : transformedVariant}
          {...props}
        />
      </Box>
    );
  }),
);
