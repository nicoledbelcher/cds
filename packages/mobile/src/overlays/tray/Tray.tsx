import React, {
  createContext,
  forwardRef,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ScrollView, useWindowDimensions } from 'react-native';
import type { ReactNode, Ref } from 'react';
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollViewProps,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { verticalDrawerPercentageOfView as defaultVerticalDrawerPercentageOfView } from '@coinbase/cds-common/tokens/drawer';

import { useSafeBottomPadding } from '../../hooks/useSafeBottomPadding';
import { useTheme } from '../../hooks/useTheme';
import { Box, VStack } from '../../layout';
import { Text } from '../../typography/Text';
import {
  Drawer,
  type DrawerBaseProps,
  type DrawerProps,
  type DrawerRefBaseProps,
} from '../drawer/Drawer';

export type TrayRenderChildren = React.FC<{ handleClose: () => void }>;

export type TrayBaseProps = Omit<DrawerBaseProps, 'pin' | 'children'> & {
  children?: React.ReactNode | TrayRenderChildren;
  /** ReactNode to render as the Tray header. Can be a ReactNode or a function that receives { handleClose }. */
  header?: React.ReactNode | TrayRenderChildren;
  /** ReactNode to render as the Tray footer. Can be a ReactNode or a function that receives { handleClose }. */
  footer?: React.ReactNode | TrayRenderChildren;
  pin?: DrawerProps['pin'];
  /**
   * Optional callback that, if provided, will be triggered when the Tray is toggled open/ closed
   * If used for analytics, context ('visible' | 'hidden') can be bundled with the event info to track whether the
   * multiselect was toggled into or out of view
   */
  onVisibilityChange?: (context: 'visible' | 'hidden') => void;
  /** Text or ReactNode for optional Tray title */
  title?: React.ReactNode;
  /** Hide the header (title) section of the tray */
  hideHeader?: boolean;
};

export type TrayProps = TrayBaseProps &
  Omit<DrawerProps, 'pin' | 'children'> & {
    pin?: DrawerProps['pin'];
    styles?: DrawerProps['styles'] & {
      content?: StyleProp<ViewStyle>;
      header?: StyleProp<ViewStyle>;
      title?: StyleProp<TextStyle>;
    };
  };

export const TrayContext = createContext<{
  verticalDrawerPercentageOfView: number;
  titleHeight: number;
  hasScrolledDown: boolean;
  setHasScrolledDown: (value: boolean) => void;
}>({
  verticalDrawerPercentageOfView: defaultVerticalDrawerPercentageOfView,
  titleHeight: 0,
  hasScrolledDown: false,
  setHasScrolledDown: () => {},
});

export const Tray = memo(
  forwardRef<DrawerRefBaseProps, TrayProps>(function Tray(
    {
      children,
      header,
      footer,
      title,
      onVisibilityChange,
      verticalDrawerPercentageOfView = defaultVerticalDrawerPercentageOfView,
      styles,
      pin = 'bottom',
      hideHeader = false,
      handleBarVariant = 'outside',
      hideHandleBar,
      ...props
    },
    ref,
  ) {
    const theme = useTheme();
    const safeBottomPadding = useSafeBottomPadding();

    // Handle bar inside only shows for bottom-pinned trays
    const showHandleBarInside = !hideHandleBar && pin === 'bottom' && handleBarVariant === 'inside';
    const [titleHeight, setTitleHeight] = useState(0);
    const [hasScrolledDown, setHasScrolledDown] = useState(false);

    const { contentStyle, headerStyle, titleStyle, drawerStyles } = useMemo(() => {
      const {
        content: contentStyle,
        header: headerStyle,
        title: titleStyle,
        ...drawerStyles
      } = styles ?? {};
      return { contentStyle, headerStyle, titleStyle, drawerStyles };
    }, [styles]);

    const onTitleLayout = useCallback(
      (event: LayoutChangeEvent) => {
        if (!title) return;
        setTitleHeight(event.nativeEvent.layout.height);
      },
      [title],
    );

    const handleContentScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollY = event.nativeEvent.contentOffset.y;
      setHasScrolledDown(scrollY > 0);
    }, []);

    const renderChildren: TrayRenderChildren = useCallback(
      ({ handleClose }) => {
        const content = typeof children === 'function' ? children({ handleClose }) : children;
        const headerContent = typeof header === 'function' ? header({ handleClose }) : header;
        const footerContent = typeof footer === 'function' ? footer({ handleClose }) : footer;
        const showTitle = !hideHeader && title;

        // For handleBarVariant="inside", apply horizontal padding only to content, not header/border
        const horizontalPadding = showHandleBarInside ? 3 : undefined;

        // For handleBarVariant="inside", automatically wrap content in a ScrollView with scroll detection
        // bounces={false} and alwaysBounceVertical={false} prevent scrolling when content doesn't overflow
        // When no footer, safe area padding is added inside contentContainerStyle so users can scroll
        // to see all content with proper bottom spacing
        const contentWithScrollDetection = showHandleBarInside ? (
          <ScrollView
            alwaysBounceVertical={false}
            bounces={false}
            contentContainerStyle={{
              paddingHorizontal: horizontalPadding ? theme.space[horizontalPadding] : undefined,
              paddingBottom: !footerContent ? safeBottomPadding : undefined,
            }}
            onScroll={handleContentScroll}
            scrollEventThrottle={16}
          >
            {content}
          </ScrollView>
        ) : (
          content
        );

        // When handlebar is inside and absolutely positioned, we need to account for its height
        // UNLESS there's a header prop (like an image) that should extend behind the handlebar
        const handleBarTopPadding = showHandleBarInside && !headerContent ? 5 : 0;

        // Determine top padding for the outer container
        const outerPaddingTop = headerContent
          ? 0
          : showTitle
            ? handleBarTopPadding
            : handleBarTopPadding || 2;

        return (
          <VStack
            flexGrow={1}
            flexShrink={1}
            minHeight={0}
            paddingTop={outerPaddingTop}
            style={contentStyle}
          >
            {showTitle && (
              <Box
                borderedBottom={hasScrolledDown}
                justifyContent="center"
                onLayout={onTitleLayout}
                style={[
                  {
                    paddingBottom: theme.space[showHandleBarInside ? 0.75 : 2],
                    paddingTop: theme.space[showHandleBarInside ? 0 : 3],
                  },
                  headerStyle,
                ]}
              >
                {typeof title === 'string' ? (
                  <Text font="title3" paddingX={horizontalPadding} style={titleStyle}>
                    {title}
                  </Text>
                ) : (
                  <Box paddingX={horizontalPadding}>{title}</Box>
                )}
              </Box>
            )}
            {headerContent}
            <Box
              flexGrow={1}
              flexShrink={1}
              minHeight={0}
              paddingX={showHandleBarInside ? undefined : horizontalPadding}
              width="100%"
            >
              {contentWithScrollDetection}
            </Box>
            {footerContent && (
              <Box style={{ paddingBottom: safeBottomPadding }}>{footerContent}</Box>
            )}
          </VStack>
        );
      },
      [
        children,
        contentStyle,
        footer,
        handleContentScroll,
        hasScrolledDown,
        header,
        headerStyle,
        hideHeader,
        onTitleLayout,
        safeBottomPadding,
        showHandleBarInside,
        theme.space,
        title,
        titleStyle,
      ],
    );

    useEffect(() => {
      onVisibilityChange?.('visible');
      return () => {
        onVisibilityChange?.('hidden');
      };
    }, [onVisibilityChange]);

    const trayContextValue = useMemo(
      () => ({ verticalDrawerPercentageOfView, titleHeight, hasScrolledDown, setHasScrolledDown }),
      [verticalDrawerPercentageOfView, titleHeight, hasScrolledDown],
    );

    // Tray handles safe area padding internally when:
    // - handleBarVariant="inside" (has ScrollView with padding in contentContainerStyle), OR
    // - there's a footer (footer wrapper has the padding)
    // In these cases, tell Drawer to disable its bottom safe area padding to avoid double padding
    const trayHandlesSafeArea = showHandleBarInside || !!footer;

    return (
      <TrayContext.Provider value={trayContextValue}>
        <Drawer
          ref={ref}
          disableBottomSafeAreaPadding={trayHandlesSafeArea}
          handleBarVariant={handleBarVariant}
          hideHandleBar={hideHandleBar}
          pin={pin}
          styles={drawerStyles}
          verticalDrawerPercentageOfView={trayContextValue.verticalDrawerPercentageOfView}
          {...props}
        >
          {renderChildren}
        </Drawer>
      </TrayContext.Provider>
    );
  }),
);

export const TrayStickyFooter = ({ children }: { children: ReactNode }) => {
  const { verticalDrawerPercentageOfView, titleHeight } = useContext(TrayContext);
  const { height } = useWindowDimensions();
  const safeBottomPadding = useSafeBottomPadding();
  const verticalDrawerMaxHeight = useMemo(
    () => (height - titleHeight) * verticalDrawerPercentageOfView - safeBottomPadding,
    [height, titleHeight, verticalDrawerPercentageOfView, safeBottomPadding],
  );
  return <VStack maxHeight={verticalDrawerMaxHeight}>{children}</VStack>;
};

/**
 * Hook to enable scroll-based header border in Tray.
 * Returns an onScroll handler to pass to your ScrollView.
 *
 * @example
 * ```tsx
 * function TrayContent() {
 *   const { onScroll } = useTrayScroll();
 *   return (
 *     <ScrollView onScroll={onScroll} scrollEventThrottle={16}>
 *       {content}
 *     </ScrollView>
 *   );
 * }
 * ```
 */
export const useTrayScroll = () => {
  const { setHasScrolledDown } = useContext(TrayContext);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollY = event.nativeEvent.contentOffset.y;
      setHasScrolledDown(scrollY > 0);
    },
    [setHasScrolledDown],
  );

  return { onScroll };
};

export type TrayScrollViewProps = ScrollViewProps;

/**
 * A ScrollView that automatically enables scroll-based header border in Tray.
 * Use this instead of ScrollView inside a Tray to get automatic header border on scroll.
 *
 * @example
 * ```tsx
 * <Tray title="Section header">
 *   <TrayScrollView style={{ maxHeight: 400 }}>
 *     {content}
 *   </TrayScrollView>
 * </Tray>
 * ```
 */
export const TrayScrollView = forwardRef(function TrayScrollView(
  { onScroll: onScrollProp, ...props }: TrayScrollViewProps,
  ref: Ref<ScrollView>,
) {
  const { onScroll: onTrayScroll } = useTrayScroll();

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      onTrayScroll(event);
      onScrollProp?.(event);
    },
    [onTrayScroll, onScrollProp],
  );

  return <ScrollView ref={ref} onScroll={handleScroll} scrollEventThrottle={16} {...props} />;
});
