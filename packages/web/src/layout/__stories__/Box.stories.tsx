import React, { Fragment } from 'react';
import type { ThemeVars } from '@coinbase/cds-common/core/theme';

import { Example, ExampleScreen } from '../../__stories__/storybook';
import { Text } from '../../typography/Text';
import { Box } from '../Box';
import { HStack } from '../HStack';
import { VStack } from '../VStack';

export default {
  title: 'Components/Box (tsx)',
  component: Box,
};

const Lipsum = ({ color }: { color?: ThemeVars.Color }) => (
  <Text as="p" color={color} display="block" font="body">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris molestie tellus quis sem
    suscipit molestie. In tincidunt hendrerit lectus fermentum euismod. Fusce interdum mollis
    sodales. Aenean ac nibh eu velit condimentum laoreet quis in enim. Sed ut massa at purus auctor
    convallis. Donec imperdiet posuere felis non luctus. Duis molestie at leo ac commodo. Fusce
    facilisis lacus ac urna tempus, a dictum nibh ornare. In facilisis ipsum tempus velit consequat
    lobortis.
  </Text>
);

const borderRadii: ThemeVars.BorderRadius[] = [
  0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000,
] as const;

export const All = () => (
  <VStack gap={3}>
    <Example title="Default">
      <Box background="bgAlternate" padding={0.5}>
        <Lipsum />
      </Box>
    </Example>

    <Example title="Elevation">
      <HStack gap={2}>
        <Box elevation={0} padding={2}>
          <Text font="label1">Elevation 0</Text>
        </Box>
        <Box elevation={1} padding={2}>
          <Text font="label1">Elevation 1</Text>
        </Box>
        <Box elevation={2} padding={2}>
          <Text font="label1">Elevation 2</Text>
        </Box>
      </HStack>
    </Example>

    <Example title="Opacity">
      <Box opacity={0.1}>
        <Lipsum />
      </Box>
    </Example>

    <Example title="Flex Controls">
      <Box
        alignContent="center"
        alignItems="center"
        flexDirection="row"
        justifyContent="space-between"
      >
        <Box alignSelf="flex-end" background="bgPositive" padding={1}>
          <Lipsum color="fgInverse" />
        </Box>
        <Box background="bgAlternate" padding={1} width="30%">
          <Lipsum />
        </Box>
        <Box background="bgOverlay" flexGrow={1} padding={1}>
          <Lipsum />
        </Box>
      </Box>
    </Example>

    <Example title="Backgrounds">
      <VStack gap={1}>
        <Box background="bgAlternate" padding={2}>
          <Text font="label1">Alternate Background</Text>
        </Box>
        <Box background="bgOverlay" padding={2}>
          <Text font="label1">Overlay Background</Text>
        </Box>
        <Box background="bgPrimary" padding={2}>
          <Text color="fgInverse" font="label1">
            Primary Background
          </Text>
        </Box>
        <Box background="bgSecondary" padding={2}>
          <Text font="label1">Secondary Background</Text>
        </Box>
        <Box background="bgPositive" padding={2}>
          <Text color="fgInverse" font="label1">
            Positive Background
          </Text>
        </Box>
        <Box background="bgNegative" padding={2}>
          <Text color="fgInverse" font="label1">
            Negative Background
          </Text>
        </Box>
      </VStack>
    </Example>

    <Example title="Bordered">
      <Box bordered padding={2}>
        <Lipsum />
      </Box>
    </Example>

    <Example title="Bordered and Rounded">
      <Box bordered borderRadius={200} padding={2}>
        <Lipsum />
      </Box>
    </Example>

    <Example title="Rounded Variations">
      <VStack gap={1}>
        {borderRadii.map((borderRadius) => (
          <Fragment key={borderRadius}>
            <Text as="p" display="block" font="title4">
              {borderRadius}
            </Text>
            <Box background="bgAlternate" borderRadius={borderRadius} padding={2}>
              <VStack gap={1}>
                <Lipsum />
              </VStack>
            </Box>
          </Fragment>
        ))}
      </VStack>
    </Example>

    <Example title="Spacing">
      <VStack gap={1}>
        <Box background="bgAlternate" padding={3}>
          <Text as="p" display="block" font="body">
            All sides
          </Text>
        </Box>
        <Box
          background="bgAlternate"
          paddingBottom={3}
          paddingEnd={2}
          paddingStart={4}
          paddingTop={1}
        >
          <Text as="p" display="block" font="body">
            Custom sides
          </Text>
        </Box>
        <Box background="bgAlternate" paddingY={3}>
          <Text as="p" display="block" font="body">
            Vertical only
          </Text>
        </Box>
        <Box background="bgAlternate" paddingX={3}>
          <Text as="p" display="block" font="body">
            Horizontal only
          </Text>
        </Box>
      </VStack>
    </Example>

    <Example title="Offset">
      <VStack gap={1}>
        <Box background="bgAlternate" padding={5}>
          <Box background="bg" margin={-3}>
            <Text as="p" display="block" font="body">
              All sides
            </Text>
          </Box>
        </Box>
        <Box background="bgAlternate" padding={5}>
          <Box background="bg" marginBottom={-3} marginEnd={-2} marginStart={-4} marginTop={-1}>
            <Text as="p" display="block" font="body">
              Custom sides
            </Text>
          </Box>
        </Box>
        <Box background="bgAlternate" padding={5}>
          <Box background="bg" marginY={-3}>
            <Text as="p" display="block" font="body">
              Vertical only
            </Text>
          </Box>
        </Box>
        <Box background="bgAlternate" padding={5}>
          <Box background="bg" marginX={-3}>
            <Text as="p" display="block" font="body">
              Horizontal only
            </Text>
          </Box>
        </Box>
      </VStack>
    </Example>

    <Example title="Positioned">
      <Box background="bgAlternate" height="300px" padding={1} position="relative" width="100%">
        <Box bottom="15px" padding={1} position="absolute" right="15px" width="45%">
          <Lipsum />
        </Box>
      </Box>
    </Example>

    <Example title="Pin Variations">
      <VStack gap={1}>
        <Box background="bgAlternate" height={100} position="relative" width="100%">
          <Box background="bgOverlay" left={0} pin="top">
            <Text as="p" display="block" font="body">
              Top from left to right
            </Text>
          </Box>
        </Box>
        <Box background="bgAlternate" height={100} position="relative" width="100%">
          <Box background="bgOverlay" pin="right">
            <Text as="p" display="block" font="body">
              Right from top to bottom
            </Text>
          </Box>
        </Box>
        <Box background="bgAlternate" height={100} position="relative" width="100%">
          <Box background="bgOverlay" pin="bottom">
            <Text as="p" display="block" font="body">
              Bottom from left to right
            </Text>
          </Box>
        </Box>
        <Box background="bgAlternate" height={100} position="relative" width="100%">
          <Box background="bgOverlay" pin="left">
            <Text as="p" display="block" font="body">
              Left from top to bottom
            </Text>
          </Box>
        </Box>
        <Box background="bgAlternate" height={100} position="relative" width="100%">
          <Box background="bgOverlay" pin="all">
            <Text as="p" display="block" font="body">
              To all corners
            </Text>
          </Box>
        </Box>
      </VStack>
    </Example>

    <Example title="Boolean Style Props">
      <Box
        bordered
        background="bgPrimary"
        borderColor="accentBoldPurple"
        borderWidth={300}
        height={200}
        width={200}
      >
        <Text font="body">HELLO WORLD</Text>
      </Box>
    </Example>
  </VStack>
);
// Opacity example is testing opacity so color contrast failure is expected
All.parameters = { a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } } };
