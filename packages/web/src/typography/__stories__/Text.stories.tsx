import React from 'react';

import { Example, ExampleScreen } from '../../__stories__/storybook';
import { Box } from '../../layout/Box';
import { VStack } from '../../layout/VStack';
import type { TextProps } from '../index';
import {
  Text,
  TextBody,
  TextCaption,
  TextDisplay1,
  TextDisplay2,
  TextDisplay3,
  TextHeadline,
  TextLabel1,
  TextLabel2,
  TextLegal,
  TextTitle1,
  TextTitle2,
  TextTitle3,
  TextTitle4,
} from '../index';

const textComponents = [
  TextTitle3,
  TextTitle4,
  TextHeadline,
  TextBody,
  TextLabel1,
  TextLabel2,
  TextCaption,
  TextLegal,
];

const renderHeaderComponents = (props?: TextProps<'h1' | 'h2' | 'h3' | 'h4'>) => (
  <>
    <TextDisplay1 as="h1" {...props}>
      Display1
    </TextDisplay1>
    <TextDisplay2 as="h2" {...props}>
      Display2
    </TextDisplay2>
    <TextDisplay3 as="h3" {...props}>
      Display3
    </TextDisplay3>
    <TextTitle1 as="h3" {...props}>
      Title1
    </TextTitle1>
    <TextTitle2 as="h4" {...props}>
      Title2
    </TextTitle2>
  </>
);

const MediumContainer = ({ children }: { children?: React.ReactNode }) => (
  <div style={{ width: '35%', height: '50px', backgroundColor: 'var(--color-bgAlternate)' }}>
    {children}
  </div>
);

export const All = () => (
  <VStack gap={4} padding={2}>
    {/* Normal Text Styles */}
    <Example title="Normal">
      <>
        {renderHeaderComponents({ display: 'block' })}
        {textComponents.map((Component) => {
          const name = (Component as { displayName?: string }).displayName?.slice(4);
          return (
            <Component key={name} as="p" display="block">
              {name}
            </Component>
          );
        })}
      </>
    </Example>

    {/* Mono Font */}
    <Example title="Mono Font">
      <>
        {renderHeaderComponents({ mono: true, display: 'block' })}
        {textComponents.map((Component) => {
          const name = (Component as { displayName?: string }).displayName?.slice(4);
          return (
            <Component key={name} mono as="p" display="block">
              {name}
            </Component>
          );
        })}
      </>
    </Example>

    {/* Font Inherit */}
    <Example title="Text with Inherit">
      <Box flexDirection="column" font="display1">
        <Text as="p" display="block" font="body">
          The following text inherits the parent Display1 font but overrides the fontSize prop
        </Text>
        <Text as="h1" display="block" font="inherit" fontSize="legal">
          Display1
        </Text>
      </Box>
    </Example>

    {/* Number Features */}
    <Example title="Slashed Zero">
      <TextBody slashedZero as="p">
        OZY28019
      </TextBody>
    </Example>

    <Example title="Tabular Numbers">
      <>
        <TextBody tabularNumbers as="p" display="block" textAlign="end">
          91.23450
        </TextBody>
        <TextBody tabularNumbers as="p" display="block" textAlign="end">
          11.98762
        </TextBody>
      </>
    </Example>

    {/* User Select */}
    <Example title="Selectable None">
      <TextBody as="p" display="block" userSelect="none">
        BTC
      </TextBody>
    </Example>

    <Example title="Selectable Text">
      <TextBody as="p" display="block" userSelect="text">
        Balance: 1,820,29.56
      </TextBody>
    </Example>

    <Example title="Selectable All">
      <TextBody slashedZero as="p" display="block" userSelect="all">
        bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
      </TextBody>
    </Example>

    {/* Text Decorations */}
    <Example title="Underline">
      <TextBody underline as="p" display="block">
        Learn more
      </TextBody>
    </Example>

    <Example title="Strikethrough">
      <TextBody as="s" textDecoration="line-through">
        Manual verification
      </TextBody>
    </Example>

    {/* Text Overflow */}
    <Example title="No Wrap">
      <MediumContainer>
        <TextBody noWrap as="p" display="block">
          As with any asset, the value of Digital Currencies can
        </TextBody>
      </MediumContainer>
    </Example>

    <Example title="Text Overflow Ellipsis">
      <MediumContainer>
        <TextBody as="p" display="block" overflow="truncate">
          As with any asset, the value of Digital Currencies can go up or down and there can be a
          substantial risk that you lose money buying, selling, holding, or investing in digital
          currencies.
        </TextBody>
      </MediumContainer>
    </Example>

    <Example title="Text Overflow Clip">
      <MediumContainer>
        <TextBody as="p" display="block" overflow="clip">
          Crypto address 0xf847047c69726b4049a5b866c8fa37cfe4ed614f. As with any asset, the value of
          Digital Currencies can go up or down.
        </TextBody>
      </MediumContainer>
    </Example>

    {/* Number of Lines */}
    <Example title="Number of Lines (2)">
      <VStack maxWidth={300}>
        <TextBody as="p" display="block" numberOfLines={2}>
          Crypto address 0xf847047c69726b4049a5b866c8fa37cfe4ed614f. As with any asset, the value of
          Digital Currencies can go up or down and there can be a substantial risk that you lose
          money buying, selling, holding, or investing in digital currencies.
        </TextBody>
      </VStack>
    </Example>

    <Example title="Number of Lines Siblings">
      <VStack gap={3} maxWidth={300}>
        <TextBody as="p" display="block" numberOfLines={1} overflow="break">
          Crypto address 0xf847047c69726b4049a5b866c8fa37cfe4ed614f. As with any asset, the value.
        </TextBody>
        <TextBody as="p" display="block" numberOfLines={2} overflow="break">
          Crypto address 0xf847047c69726b4049a5b866c8fa37cfe4ed614f. As with any asset, the value of
          Digital Currencies can go up.
        </TextBody>
        <TextBody as="p" display="block" numberOfLines={3} overflow="break">
          Crypto address 0xf847047c69726b4049a5b866c8fa37cfe4ed614f. As with any asset, the value of
          Digital Currencies can go up or down and there can be risk.
        </TextBody>
      </VStack>
    </Example>

    <Example title="Number of Lines Nested">
      <VStack gap={3} maxWidth={300}>
        <TextBody as="p" display="block" numberOfLines={2}>
          <TextBody as="p" display="block" numberOfLines={3}>
            The parent Text says this should only wrap to 2 lines, but the child which actually
            renders this text says it should wrap up to 3 lines.
          </TextBody>
        </TextBody>
      </VStack>
    </Example>

    <Example title="Number of Lines Custom Spacing">
      <VStack gap={3} maxWidth={300}>
        <Box as="span" padding={2}>
          <TextBody as="p" display="block" numberOfLines={2}>
            Crypto address 0xf847047c69726b4049a5b866c8fa37cfe4ed614f. As with any asset, the value
            of Digital Currencies can go up or down.
          </TextBody>
        </Box>
      </VStack>
    </Example>

    {/* Text Transform */}
    <Example title="Uppercase">
      <TextBody as="p" display="block" textTransform="uppercase">
        uppercase
      </TextBody>
    </Example>

    <Example title="Lowercase">
      <TextBody as="p" display="block" textTransform="lowercase">
        Lowercase
      </TextBody>
    </Example>

    <Example title="Capitalize">
      <TextBody as="p" display="block" textTransform="capitalize">
        capitalize
      </TextBody>
    </Example>

    {/* Semantic Elements */}
    <Example title="Sub">
      <TextBody as="sub">sub</TextBody>
    </Example>

    <Example title="Strong">
      <TextBody as="strong">strong</TextBody>
    </Example>

    <Example title="Bold">
      <TextBody as="p" display="block">
        b
      </TextBody>
    </Example>

    <Example title="Description Dl Dd">
      <dl>
        <TextBody as="dt" display="block">
          Coffee
        </TextBody>
        <TextBody as="dd" display="block">
          Black hot drink
        </TextBody>
        <div>
          <TextBody as="dt" display="block">
            Milk
          </TextBody>
          <TextBody as="dd" display="block">
            White cold drink
          </TextBody>
        </div>
      </dl>
    </Example>

    <Example title="Time">
      <TextBody as="time" dateTime="2020-10-10">
        2020-10-10
      </TextBody>
    </Example>

    {/* Custom Styles */}
    <Example title="Custom Style">
      <>
        {renderHeaderComponents({ style: { background: 'coral', display: 'block' } })}
        {textComponents.map((Component) => {
          const name = (Component as { displayName?: string }).displayName?.slice(4);
          return (
            <Component key={name} as="p" display="block" style={{ background: 'coral ' }}>
              {name}
            </Component>
          );
        })}
      </>
    </Example>
  </VStack>
);

export default {
  title: 'Components/Text (tsx)',
  component: TextDisplay1,
};
