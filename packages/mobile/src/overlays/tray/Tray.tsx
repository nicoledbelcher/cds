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
import { useWindowDimensions } from 'react-native';
import type { ReactNode } from 'react';
import type { LayoutChangeEvent, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { MAX_OVER_DRAG } from '@coinbase/cds-common/animation/drawer';
import { verticalDrawerPercentageOfView as defaultVerticalDrawerPercentageOfView } from '@coinbase/cds-common/tokens/drawer';

import { Box, HStack, VStack } from '../../layout';
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
  /** ReactNode to render as the Tray header */
  header?: React.ReactNode;
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
}>({
  verticalDrawerPercentageOfView: defaultVerticalDrawerPercentageOfView,
  titleHeight: 0,
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
      ...props
    },
    ref,
  ) {
    const [titleHeight, setTitleHeight] = useState(0);

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

    const renderChildren: TrayRenderChildren = useCallback(
      ({ handleClose }) => {
        const content = typeof children === 'function' ? children({ handleClose }) : children;
        const footerContent = typeof footer === 'function' ? footer({ handleClose }) : footer;
        const showHeader = !hideHeader && title;

        return (
          <VStack
            flexGrow={1}
            flexShrink={1}
            minHeight={0}
            paddingTop={showHeader ? 0 : 2}
            style={contentStyle}
          >
            {showHeader && (
              <Box justifyContent="center" onLayout={onTitleLayout} style={headerStyle}>
                {typeof title === 'string' ? (
                  <Text
                    font="title3"
                    paddingBottom={2}
                    paddingTop={3}
                    paddingX={3}
                    style={titleStyle}
                  >
                    {title}
                  </Text>
                ) : (
                  title
                )}
              </Box>
            )}
            {header}
            <Box flexGrow={1} flexShrink={1} minHeight={0} width="100%">
              {content}
            </Box>
            {footerContent}
          </VStack>
        );
      },
      [
        children,
        contentStyle,
        footer,
        header,
        headerStyle,
        hideHeader,
        onTitleLayout,
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
      () => ({ verticalDrawerPercentageOfView, titleHeight }),
      [verticalDrawerPercentageOfView, titleHeight],
    );

    return (
      <TrayContext.Provider value={trayContextValue}>
        <Drawer
          ref={ref}
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
  const verticalDrawerMaxHeight = useMemo(
    () => (height - titleHeight) * verticalDrawerPercentageOfView - MAX_OVER_DRAG,
    [height, titleHeight, verticalDrawerPercentageOfView],
  );
  return <VStack maxHeight={verticalDrawerMaxHeight}>{children}</VStack>;
};
