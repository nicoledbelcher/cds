import React, { memo, useCallback, useMemo, useState } from 'react';
import type {
  GestureResponderEvent,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  TextLayoutEventData,
  TextLayoutLine,
} from 'react-native';
import type { SharedProps } from '@coinbase/cds-common';

import { useWebBrowserOpener } from '../hooks/useWebBrowserOpener';

import { Text, type TextBaseProps, type TextProps } from './Text';
import { TextUnderlineDotted } from './TextUnderlineDotted';

export type LinkBaseProps = SharedProps &
  TextBaseProps & {
    /** URL that this link goes to when pressed. */
    to?: string;
    /** Use monospace font family. */
    mono?: boolean;
    /**
     * Set text decoration to underline.
     * @link [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/text-decoration) | [React Native Docs](https://reactnative.dev/docs/text-style-props#textdecorationline)
     * @default false (unless nested inside a paragraph tag)
     */
    underline?: boolean;
    /**
     * Visual style for underline when `underline` is enabled.
     * @default solid
     */
    underlineVariant?: 'solid' | 'dotted';
    /** Callback to fire when pressed */
    onPress?: (event: GestureResponderEvent) => void;
    /**
     * Toggles whether the link should be opened outside or within app
     * @default false
     * */
    forceOpenOutsideApp?: boolean;
    /**
     * Toggles whether we allow users to go back to app
     * when they are in an external browser
     * @default false
     */
    preventRedirectionIntoApp?: boolean;
    /**
     * Toggles readerMode flag for web browser.
     * Note: readerMode is only available on ios
     * @default false
     */
    readerMode?: boolean;
  };

export type LinkProps = LinkBaseProps & TextProps;

type LineMetrics = {
  width: number;
  height: number;
};

export const Link = memo(
  ({
    children,
    to,
    color = 'fgPrimary',
    font = 'inherit',
    onPress,
    forceOpenOutsideApp = false,
    preventRedirectionIntoApp = false,
    readerMode = false,
    underline,
    underlineVariant = 'solid',
    accessibilityLabel,
    testID,
    onLayout,
    ...props
  }: LinkProps) => {
    const openUrl = useWebBrowserOpener();

    const [lines, setLines] = useState<LineMetrics[]>([]);

    const hasUnderline = useMemo(
      () => underline && underlineVariant === 'dotted',
      [underline, underlineVariant],
    );

    const showDottedUnderline = useMemo(
      () => hasUnderline && lines.length > 0,
      [hasUnderline, lines.length],
    );

    const openUrlOnPress = useCallback(
      (event: GestureResponderEvent) => {
        onPress?.(event);
        if (to === undefined) return;
        void openUrl(to, {
          forceOpenOutsideApp,
          preventRedirectionIntoApp,
          readerMode,
        });
      },
      [openUrl, to, onPress, forceOpenOutsideApp, preventRedirectionIntoApp, readerMode],
    );

    const handleLayout = useCallback(
      (event: LayoutChangeEvent) => {
        onLayout?.(event);

        const result = {
          width: event.nativeEvent.layout.width,
          height: event.nativeEvent.layout.height,
        };
        if (hasUnderline) alert('got lines' + JSON.stringify(result));
        setLines([result]);
      },
      [hasUnderline, onLayout],
    );

    /* if (underline && underlineVariant === 'dotted') {
      return (
        <LinkDottedUnderline
          accessibilityHint={accessibilityLabel}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="link"
          color={color}
          font={font}
          onPress={openUrlOnPress}
          testID={testID}
          {...props}
        >
          {children}
        </LinkDottedUnderline>
      );
    }*/

    return (
      <Text
        accessibilityHint={accessibilityLabel}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="link"
        color={color}
        font={font}
        onLayout={handleLayout}
        onPress={openUrlOnPress}
        testID={testID}
        underline={underline && underlineVariant === 'solid'}
        {...props}
      >
        {children}
        {showDottedUnderline && (
          <TextUnderlineDotted height={lines[0].height} width={lines[0].width} />
        )}
      </Text>
    );
  },
);

Link.displayName = 'Link';
