import { memo } from 'react';
import { type BoxProps, type BoxDefaultElement, Box } from '@coinbase/cds-web/layout/Box';
import { useTheme } from '@coinbase/cds-web';
import { VStack } from '@coinbase/cds-web/layout/VStack';
import { Text } from '@coinbase/cds-web/typography/Text';

export const Container = memo(
  ({
    title,
    background = 'bg',
    alignSelf = 'stretch',
    alignItems = 'center',
    justifyContent = 'center',
    flexWrap = 'wrap',
    flexGrow = 0,
    flexShrink = 0,
    width = '100%',
    style,
    ...props
  }: BoxProps<BoxDefaultElement>) => {
    const theme = useTheme();
    const isDarkMode = theme.activeColorScheme === 'dark';
    const borderColor = isDarkMode ? '#2f2f2f' : '#e1e1e1';
    return (
      <VStack
        background={background}
        flexGrow={flexGrow}
        flexShrink={flexShrink}
        alignSelf={alignSelf}
        justifyContent={justifyContent}
        width={width}
        style={{ borderRadius: 8, position: 'relative' }}
      >
        {title && (
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              padding: 8,
              borderBottom: `1px solid ${borderColor}`,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: 200,
                fontFamily: 'var(--defaultFont-sans)',
              }}
            >
              {title}
            </Text>
          </Box>
        )}
        <Box
          alignSelf={alignSelf}
          alignItems={alignItems}
          justifyContent={justifyContent}
          flexWrap={flexWrap}
          flexGrow={flexGrow}
          flexShrink={flexShrink}
          width={width}
          style={{
            marginTop: title ? 36 : 0,
            gap: 16,
            padding: 16,
            ...style,
          }}
          {...props}
        />
      </VStack>
    );
  },
);
