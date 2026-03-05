import React, { forwardRef, memo, useRef } from 'react';
import { useMergeRefs } from '@coinbase/cds-common/hooks/useMergeRefs';
import { css } from '@linaria/core';

import type { Polymorphic } from '../core/polymorphism';
import { cx } from '../cx';
import { Pressable, type PressableBaseProps } from '../system/Pressable';

import { Text } from './Text';

export const linkDefaultElement = 'a';

export type LinkDefaultElement = typeof linkDefaultElement;

export type LinkBaseProps = Polymorphic.ExtendableProps<
  PressableBaseProps,
  {
    /**
     * Determines whether the link opens in a new window.
     * - `true`: Opens the link in a new window.
     * - `false`: Replaces the current screen with the link.
     *
     * This prop is only applicable when rendering the `Link` as an anchor (`as="a"`).
     * @default false
     */
    openInNewWindow?: boolean;
    /** Use monospace font family. */
    mono?: boolean;
    /**
     * Set text decoration to underline.
     * @link [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/text-decoration)
     */
    underline?: boolean;
    /**
     * Visual style for underline when `underline` is enabled.
     * @default solid
     */
    underlineVariant?: 'solid' | 'dotted';
  }
>;

export type LinkProps<AsComponent extends React.ElementType> = Polymorphic.Props<
  AsComponent,
  LinkBaseProps
>;

type LinkComponent = (<AsComponent extends React.ElementType = LinkDefaultElement>(
  props: LinkProps<AsComponent>,
) => Polymorphic.ReactReturn) &
  Polymorphic.ReactNamed;

const baseCss = css`
  cursor: pointer;
  user-select: initial;

  /* remove Pressable opacity styles */
  &:hover,
  &:active,
  &[data-active='true'],
  &[data-loading='true'] {
    > * {
      opacity: 1;
    }
  }

  &:focus-visible {
    outline-offset: 0;
    border-radius: var(--borderRadius-100);
  }
`;

const dottedUnderlineCss = css`
  text-decoration-line: underline;
  text-decoration-style: dotted;
  text-decoration-thickness: 2px;
  text-underline-offset: 2px;
  text-underline-position: from-font;
`;

export const Link: LinkComponent = memo(
  forwardRef<React.ReactElement<LinkBaseProps>, LinkBaseProps>(
    <AsComponent extends React.ElementType>(
      {
        // Text props
        children,
        color = 'fgPrimary',
        font = 'inherit',
        mono,
        underline,
        underlineVariant = 'solid',
        // Pressable props
        as,
        className,
        display = 'inline',
        borderWidth = 0,
        margin = 0,
        padding = 0,
        noScaleOnPress = true,
        openInNewWindow = false,
        ...props
      }: LinkProps<AsComponent>,
      ref?: Polymorphic.Ref<AsComponent>,
    ) => {
      const Component = (as ?? linkDefaultElement) satisfies React.ElementType;
      const isAnchor = Component === 'a';

      const linkRef = useRef(null);
      const mergedRef = useMergeRefs(ref, linkRef);

      return (
        <Pressable
          ref={mergedRef}
          as={Component}
          borderWidth={borderWidth}
          className={cx(baseCss, className)}
          color={color}
          display={display}
          margin={margin}
          noScaleOnPress={noScaleOnPress}
          padding={padding}
          target={isAnchor && openInNewWindow ? '_blank' : undefined}
          {...props}
        >
          <Text
            as="span"
            className={underline && underlineVariant === 'dotted' ? dottedUnderlineCss : undefined}
            color="currentColor"
            font={font}
            mono={mono}
            underline={underline}
          >
            {children}
          </Text>
        </Pressable>
      );
    },
  ),
);
