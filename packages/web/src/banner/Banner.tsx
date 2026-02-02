import React, {
  forwardRef,
  isValidElement,
  memo,
  useCallback,
  useId,
  useMemo,
  useState,
} from 'react';
import type { ThemeVars } from '@coinbase/cds-common/core/theme';
import type { BannerVariantStyle } from '@coinbase/cds-common/tokens/banner';
import { bannerMinWidth, variants } from '@coinbase/cds-common/tokens/banner';
import type {
  BannerStyleVariant,
  BannerVariant,
  IconName,
  NegativeSpace,
  SharedProps,
} from '@coinbase/cds-common/types';
import { css } from '@linaria/core';

import { Collapsible } from '../collapsible';
import { Icon } from '../icons/Icon';
import {
  Box,
  type BoxBaseProps,
  HStack,
  type HStackDefaultElement,
  type HStackProps,
  VStack,
} from '../layout';
import type { ResponsiveProp, ResponsiveProps, StaticStyleProps } from '../styles/styleProps';
import { Pressable } from '../system/Pressable';
import type { LinkDefaultElement, LinkProps } from '../typography/Link';
import { Link } from '../typography/Link';
import { Text } from '../typography/Text';

const actionContainerCss = css`
  white-space: nowrap;
`;

export const contentResponsiveConfig: ResponsiveProps<StaticStyleProps>['flexDirection'] = {
  phone: 'column',
  tablet: 'row',
  desktop: 'row',
} as const;

const normalizeNegativeSpace = (value: string | number | undefined) => {
  if (value == null) return undefined;
  const str = String(value);
  if (!str.startsWith('-')) return undefined;
  return str.slice(1);
};

const spaceVar = (spaceToken: string) => `var(--space-${spaceToken.replace('.', '_')})`;

const computeBleedWidth = (
  effectiveMarginX: string | number | undefined,
  effectiveMarginStart: string | number | undefined,
  effectiveMarginEnd: string | number | undefined,
) => {
  // Prefer explicit start/end over marginX (marginX sets both sides).
  const startSpaceToken =
    normalizeNegativeSpace(effectiveMarginStart) ?? normalizeNegativeSpace(effectiveMarginX);
  const endSpaceToken =
    normalizeNegativeSpace(effectiveMarginEnd) ?? normalizeNegativeSpace(effectiveMarginX);

  if (!startSpaceToken && !endSpaceToken) return '100%';

  // If a side isn't bleeding, treat it as 0 so we can always use a single calc().
  const start = startSpaceToken ? spaceVar(startSpaceToken) : '0px';
  const end = endSpaceToken ? spaceVar(endSpaceToken) : '0px';
  return `calc(100% + ${start} + ${end})`;
};

/**
 * Normalize ResponsiveProp<T> into a consistent object shape so we can:
 * - compute a base width, and
 * - optionally compute phone/tablet/desktop overrides if any are provided.
 *
 * NOTE: we cannot rely on `typeof value === 'object'` alone here because
 * ResponsiveProp<T> allows T itself to be an object type. We only use this
 * helper with NegativeSpace, so it's safe in practice, but we still keep
 * the types narrow for readability.
 */
const toResponsiveObject = (value: ResponsiveProp<NegativeSpace | undefined>) => {
  if (value == null) return {};
  if (typeof value === 'object') return value;
  return { base: value };
};

/**
 * Why we compute a custom wrapper width:
 *
 * CDS "margin*" style props (e.g. marginX) are implemented as **negative margins**.
 * If the Banner wrapper is simply `width="100%"`, applying a negative horizontal
 * margin will *shift* the Banner left/right while preserving its 100% width.
 *
 * The expected "bleed" behavior for negative margins is:
 * - still span the full container width, AND
 * - extend beyond the container by the negative margin amount.
 *
 * To achieve that, we expand the wrapper width to compensate for the negative
 * margins using `calc(100% + <startBleed> + <endBleed>)`.
 *
 * This also supports responsive margin props: we emit responsive `width` values
 * (base/phone/tablet/desktop) so the bleed behavior tracks the same breakpoints.
 */
const computeWrapperWidth = (
  marginX: ResponsiveProp<NegativeSpace | undefined>,
  marginStart: ResponsiveProp<NegativeSpace | undefined>,
  marginEnd: ResponsiveProp<NegativeSpace | undefined>,
): BoxBaseProps['width'] => {
  // Pull the responsive margin values (or base-only values) into objects so we can
  // compute bleed width per breakpoint.
  const respMarginX = toResponsiveObject(marginX);
  const respMarginStart = toResponsiveObject(marginStart);
  const respMarginEnd = toResponsiveObject(marginEnd);

  // Base width (always computed). This is returned as a string if there are no
  // responsive overrides, which keeps the output minimal.
  const baseWidth = computeBleedWidth(respMarginX.base, respMarginStart.base, respMarginEnd.base);

  const widthByBreakpoint: {
    base: string;
    phone?: string;
    tablet?: string;
    desktop?: string;
  } = { base: baseWidth };

  const computeForBreakpoint = (breakpoint: 'phone' | 'tablet' | 'desktop') => {
    const hasOverride =
      typeof respMarginX[breakpoint] !== 'undefined' ||
      typeof respMarginStart[breakpoint] !== 'undefined' ||
      typeof respMarginEnd[breakpoint] !== 'undefined';

    if (!hasOverride) return;

    // If a breakpoint overrides any of the margin props, compute an explicit width
    // override for that breakpoint. We fall back to base values when only some
    // sides are overridden.
    widthByBreakpoint[breakpoint] = computeBleedWidth(
      respMarginX[breakpoint] ?? respMarginX.base,
      respMarginStart[breakpoint] ?? respMarginStart.base,
      respMarginEnd[breakpoint] ?? respMarginEnd.base,
    );
  };

  computeForBreakpoint('phone');
  computeForBreakpoint('tablet');
  computeForBreakpoint('desktop');

  const hasResponsiveOverrides =
    typeof widthByBreakpoint.phone !== 'undefined' ||
    typeof widthByBreakpoint.tablet !== 'undefined' ||
    typeof widthByBreakpoint.desktop !== 'undefined';

  return hasResponsiveOverrides ? widthByBreakpoint : baseWidth;
};

export type BannerBaseProps = SharedProps & {
  /** Sets the variant of the banner - which is responsible for foreground and background color assignment */
  variant: BannerVariant;
  /** Name of icon to be shown in the banner */
  startIcon: IconName;
  /** Whether the start icon is active */
  startIconActive?: boolean;
  /** Provide a CDS Link component to be used as a primary action. It will inherit colors depending on the provided variant */
  primaryAction?: React.ReactNode;
  /** Provide a CDS Link component to be used as a secondary action. It will inherit colors depending on the provided tone */
  secondaryAction?: React.ReactNode;
  /** Title of banner. Indicates the intent of this banner */
  title?: React.ReactNode;
  /** Message of banner */
  children?: React.ReactNode;
  /**
   * Determines whether banner can be dismissed or not. Banner is not dismisable when styleVariant is set to global.
   * @default true
   * */
  showDismiss?: boolean;
  /** A callback fired when banner is dismissed */
  onClose?: () => void;
  /** Indicates the max number of lines after which body text will be truncated */
  numberOfLines?: number;
  /** Use for supplemental data */
  label?: React.ReactNode;
  /**
   * Determines the banner style and indicates the suggested positioning for the banner
   * @default 'contextual'
   * */
  styleVariant?: BannerStyleVariant;
  /** Accessibility label for start icon on the banner */
  startIconAccessibilityLabel?: string;
  /** Accessibility label for close button on the banner
   * @default 'close'
   */
  closeAccessibilityLabel?: string;
  /**
   * Determines whether banner has a border or not
   * @default true
   * */
  bordered?: boolean;
  /**
   * Determines banner's border radius
   * @default 400 for contextual, undefined for global and inline
   * */
  borderRadius?: ThemeVars.BorderRadius;
};

export type BannerProps = BannerBaseProps &
  Omit<HStackProps<HStackDefaultElement>, 'children' | 'title'>;

export const Banner = memo(
  forwardRef(
    (
      {
        variant,
        startIcon,
        startIconActive,
        onClose,
        primaryAction,
        secondaryAction,
        title,
        children,
        showDismiss = false,
        testID,
        style,
        className,
        numberOfLines = 3,
        label,
        styleVariant = 'contextual',
        startIconAccessibilityLabel,
        closeAccessibilityLabel = 'close',
        borderRadius = styleVariant === 'contextual' ? 400 : undefined,
        margin,
        marginY,
        marginX,
        marginTop,
        marginBottom,
        marginStart,
        marginEnd,
        ...props
      }: BannerProps,
      ref: React.ForwardedRef<HTMLDivElement>,
    ) => {
      const [isCollapsed, setIsCollapsed] = useState(false);
      const titleId = useId();

      const accessibilityLabelledBy = typeof title === 'string' ? titleId : undefined;

      // Setup color configs
      const {
        iconColor,
        textColor,
        background,
        primaryActionColor,
        secondaryActionColor,
        iconButtonColor,
        borderColor,
      }: BannerVariantStyle = variants[variant];

      // Events
      const handleOnDismiss = useCallback(() => {
        setIsCollapsed(true);
        onClose?.();
      }, [onClose]);

      const clonedPrimaryAction = useMemo(() => {
        if (!isValidElement<LinkProps<LinkDefaultElement>>(primaryAction)) return null;

        if (primaryAction.type === Link) {
          return React.cloneElement(primaryAction, {
            font: 'label1',
            color: primaryActionColor,
            testID: `${testID}-action--primary`,
            ...primaryAction.props,
          });
        } else {
          return React.cloneElement(primaryAction, {
            testID: `${testID}-action--primary`,
            ...primaryAction.props,
          });
        }
      }, [primaryAction, primaryActionColor, testID]);

      const clonedSecondaryAction = useMemo(() => {
        if (!isValidElement<LinkProps<LinkDefaultElement>>(secondaryAction)) return null;

        if (secondaryAction.type === Link) {
          return React.cloneElement(secondaryAction, {
            font: 'label1',
            color: secondaryActionColor,
            testID: `${testID}-action--secondary`,
            ...secondaryAction.props,
          });
        } else {
          return React.cloneElement(secondaryAction, {
            testID: `${testID}-action--secondary`,
            ...secondaryAction.props,
          });
        }
      }, [secondaryAction, secondaryActionColor, testID]);

      const marginStyles = useMemo(
        () => ({
          margin,
          marginY,
          marginX,
          marginTop,
          marginBottom,
          marginStart,
          marginEnd,
        }),
        [margin, marginX, marginY, marginStart, marginEnd, marginTop, marginBottom],
      );

      const wrapperWidth = useMemo(
        () => computeWrapperWidth(marginX, marginStart, marginEnd),
        [marginEnd, marginStart, marginX],
      );

      const borderBox = useMemo(
        () => <Box background={borderColor} pin="left" width={4} />,
        [borderColor],
      );

      const content = (
        <Box
          position="relative"
          width={showDismiss ? '100%' : wrapperWidth}
          {...(!showDismiss && marginStyles)}
          height="fit-content"
        >
          <HStack
            ref={ref}
            background={background}
            borderRadius={borderRadius}
            className={className}
            flexGrow={1}
            gap={1}
            minWidth={bannerMinWidth}
            paddingX={styleVariant === 'contextual' ? 2 : 3}
            paddingY={2}
            style={style}
            testID={testID}
            {...props}
          >
            {/** Start */}
            <Box paddingX={0.5} paddingY={0.25}>
              <Icon
                accessibilityLabel={startIconAccessibilityLabel}
                active={startIconActive}
                color={iconColor}
                name={startIcon}
                size="s"
                testID={`${testID}-icon`}
              />
            </Box>
            <VStack
              flexDirection={contentResponsiveConfig}
              flexGrow={1}
              gap={2}
              justifyContent="space-between"
              testID={`${testID}-inner-end-box`}
            >
              {/** Middle */}
              <VStack gap={2} testID={`${testID}-content-box`}>
                <VStack gap={0.5}>
                  {typeof title === 'string' ? (
                    <Text color={textColor} font="label1" id={titleId} numberOfLines={2}>
                      {title}
                    </Text>
                  ) : (
                    title
                  )}
                  {typeof children === 'string' ? (
                    <Text color={textColor} font="label2" numberOfLines={numberOfLines}>
                      {children}
                    </Text>
                  ) : (
                    children
                  )}
                </VStack>
                {typeof label === 'string' ? (
                  <Text color="fgMuted" font="legal" numberOfLines={2}>
                    {label}
                  </Text>
                ) : (
                  label
                )}
              </VStack>
              {/** Actions */}
              {(!!clonedPrimaryAction || !!clonedSecondaryAction) && (
                <HStack
                  alignItems="center"
                  className={actionContainerCss}
                  gap={2}
                  testID={`${testID}-action`}
                >
                  {clonedPrimaryAction}
                  {clonedSecondaryAction}
                </HStack>
              )}
            </VStack>
            {/** Dismissable action */}
            {showDismiss && (
              <Box alignItems="flex-start" padding={0.5}>
                <Pressable
                  accessibilityLabel={closeAccessibilityLabel}
                  background="transparent"
                  borderRadius={1000}
                  onClick={handleOnDismiss}
                  role="button"
                  testID={`${testID}-dismiss-btn`}
                >
                  <Icon color={iconButtonColor} name="close" size="s" />
                </Pressable>
              </Box>
            )}
          </HStack>
          {styleVariant === 'global' && !showDismiss && borderBox}
        </Box>
      );

      return showDismiss ? (
        <Box
          display="block"
          height="fit-content"
          position="relative"
          width={wrapperWidth}
          {...marginStyles}
        >
          <Collapsible
            accessibilityLabelledBy={accessibilityLabelledBy}
            collapsed={isCollapsed}
            id={`${titleId}--controller`}
            testID={`${testID}-collapsible`}
          >
            {content}
          </Collapsible>
          {styleVariant === 'global' && borderBox}
        </Box>
      ) : (
        content
      );
    },
  ),
);
