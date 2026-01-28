import React from 'react';
import { loremIpsum } from '@coinbase/cds-common/internal/data/loremIpsum';

import { Example, ExampleScreen } from '../../__stories__/storybook';
import { Button } from '../../buttons';
import { Box } from '../../layout/Box';
import { VStack } from '../../layout/VStack';
import { Link } from '../../typography/Link';
import { Text } from '../../typography/Text';
import type { BannerProps } from '../Banner';
import { Banner } from '../Banner';

const primaryAction = <Link href="https://www.coinbase.com">Primary</Link>;
const secondaryAction = <Link href="https://www.coinbase.com">Secondary</Link>;
const shortMessage = 'Lorem ipsum dolar sit amet, consecturo.';
const longMessage = `${loremIpsum}${loremIpsum}${loremIpsum}${loremIpsum}${loremIpsum}`;
const label = 'Last updated today at 3:33pm';

type ExampleProps = Pick<
  BannerProps,
  | 'title'
  | 'children'
  | 'marginX'
  | 'startIcon'
  | 'startIconActive'
  | 'startIconAccessibilityLabel'
  | 'closeAccessibilityLabel'
>;

const exampleProps: ExampleProps = {
  title: 'Failure Message',
  startIcon: 'error',
  startIconActive: true,
  startIconAccessibilityLabel: 'Error',
  closeAccessibilityLabel: 'Close',
};

const examplePropsWithMargin: ExampleProps = {
  ...exampleProps,
  marginX: -2,
  children: shortMessage,
};

const borderRadiusValues = [0, 200, 400] as const;

export const All = () => {
  return (
    <ExampleScreen>
      <Example title="Global">
        <Banner
          showDismiss
          startIconActive
          closeAccessibilityLabel="Close"
          primaryAction={primaryAction}
          secondaryAction={secondaryAction}
          startIcon="error"
          startIconAccessibilityLabel="Error"
          styleVariant="global"
          title={`Global ${shortMessage}`}
          variant="error"
        >
          <Text as="p" display="block" font="label2">
            {shortMessage} <Link href="https://www.coinbase.com">Learn more</Link>
          </Text>
        </Banner>
      </Example>

      <Example title="Inline">
        <Banner
          showDismiss
          startIconActive
          closeAccessibilityLabel="Close"
          primaryAction={primaryAction}
          secondaryAction={secondaryAction}
          startIcon="warning"
          startIconAccessibilityLabel="Warning"
          styleVariant="inline"
          title={`Inline ${shortMessage}`}
          variant="warning"
        >
          <Link font="label2" href="https://www.coinbase.com">
            Learn more
          </Link>
        </Banner>
      </Example>

      <Example title="Contextual">
        <Banner
          showDismiss
          startIconActive
          closeAccessibilityLabel="Close"
          label={label}
          primaryAction={primaryAction}
          secondaryAction={secondaryAction}
          startIcon="info"
          startIconAccessibilityLabel="Information"
          variant="promotional"
        >
          <Text as="p" display="block" font="label2">
            {shortMessage} <Link href="https://www.coinbase.com">Learn more</Link>
          </Text>
        </Banner>
      </Example>

      <Example title="Variants">
        <VStack gap={2}>
          <Banner
            startIconActive
            closeAccessibilityLabel="Close"
            startIcon="warning"
            startIconAccessibilityLabel="Warning"
            title="Warning message"
            variant="warning"
          >
            {shortMessage}
          </Banner>
          <Banner
            startIconActive
            closeAccessibilityLabel="Close"
            startIcon="info"
            startIconAccessibilityLabel="Information"
            title="Informative message"
            variant="informational"
          >
            {shortMessage}
          </Banner>
          <Banner
            startIconActive
            closeAccessibilityLabel="Close"
            startIcon="info"
            startIconAccessibilityLabel="Information"
            title="Promotional message"
            variant="promotional"
          >
            {shortMessage}
          </Banner>
          <Banner
            startIconActive
            closeAccessibilityLabel="Close"
            startIcon="error"
            startIconAccessibilityLabel="Error"
            title="Error message"
            variant="error"
          >
            {shortMessage}
          </Banner>
        </VStack>
      </Example>

      <Example title="With Actions">
        <VStack gap={2}>
          <Banner
            {...exampleProps}
            primaryAction={primaryAction}
            title="With Primary Action"
            variant="informational"
          />
          <Banner
            {...exampleProps}
            primaryAction={primaryAction}
            secondaryAction={secondaryAction}
            title="With Multiple Actions"
            variant="error"
          />
          <Banner
            {...exampleProps}
            primaryAction={<Button compact>Primary Action</Button>}
            title="Button as Primary Action"
            variant="warning"
          />
        </VStack>
      </Example>

      <Example title="With Dismiss">
        <VStack gap={2}>
          <Banner
            {...exampleProps}
            showDismiss
            onClose={() => {}}
            title="With Dismiss Button"
            variant="informational"
          />
          <Banner
            {...exampleProps}
            showDismiss
            onClose={() => {}}
            primaryAction={primaryAction}
            title="With Dismiss and Actions"
            variant="error"
          />
        </VStack>
      </Example>

      <Example title="Long Content">
        <Banner
          {...exampleProps}
          showDismiss
          onClose={() => {}}
          primaryAction={primaryAction}
          secondaryAction={secondaryAction}
          title={`Long Text ${longMessage.slice(0, 100)}`}
          variant="warning"
        >
          {longMessage.slice(0, 200)}
        </Banner>
      </Example>

      <Example title="Custom Margin">
        <VStack gap={2} marginX={-0.5}>
          <Banner
            {...examplePropsWithMargin}
            showDismiss
            startIconAccessibilityLabel="Information"
            styleVariant="global"
            title="Global with margin"
            variant="informational"
          />
          <Banner
            {...examplePropsWithMargin}
            showDismiss
            startIconAccessibilityLabel="Information"
            styleVariant="inline"
            title="Inline with margin"
            variant="promotional"
          />
        </VStack>
      </Example>

      <Example title="Border Radius">
        <VStack gap={2}>
          {borderRadiusValues.map((radius) => (
            <Banner
              key={`contextual-${radius}`}
              {...exampleProps}
              borderRadius={radius}
              title={`Radius ${radius}`}
              variant="informational"
            >
              {shortMessage}
            </Banner>
          ))}
        </VStack>
      </Example>

      <Example title="Custom Alignment">
        <VStack gap={2}>
          <Banner
            {...exampleProps}
            alignItems="center"
            startIconAccessibilityLabel="Information"
            title="Center Aligned"
            variant="informational"
          />
          <Banner
            {...exampleProps}
            alignItems={{
              base: 'flex-start',
              tablet: 'center',
              desktop: 'center',
            }}
            primaryAction={primaryAction}
            secondaryAction={secondaryAction}
            title="Responsive Alignment"
            variant="error"
          />
        </VStack>
      </Example>
    </ExampleScreen>
  );
};

export default {
  component: Banner,
  title: 'Components/Banner',
};
