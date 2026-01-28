import React from 'react';
import { coinbaseOneLogo } from '@coinbase/cds-common/internal/data/assets';

import { Example, ExampleScreen } from '../../__stories__/storybook';
import { Button } from '../../buttons';
import { HStack, VStack } from '../../layout';
import { Text } from '../../typography/Text';
import { UpsellCard, type UpsellCardProps } from '../UpsellCard';

const onClickConsole = console.log;

const exampleProps = {
  title: 'Headline',
  description: 'Check out the most popular assets',
  action: 'Buy Bitcoin now',
  media: <img alt="" data-testid="media" src={coinbaseOneLogo as string} width={120} />,
  background: 'bgPrimaryWash',
  onActionPress: onClickConsole,
  onDismissPress: onClickConsole,
} satisfies UpsellCardProps;

const compactProps = {
  title: 'Headline',
  description: 'Check out the most popular assets',
  media: <img alt="" data-testid="media" src={coinbaseOneLogo as string} width={120} />,
  background: 'bgPrimaryWash',
  onClick: onClickConsole,
} satisfies UpsellCardProps;

export const All = () => {
  return (
    <ExampleScreen>
      <Example title="Default">
        <UpsellCard {...exampleProps} />
      </Example>

      <Example title="Compact">
        <UpsellCard {...compactProps} />
      </Example>

      <Example title="Vertical">
        <VStack gap={1.5}>
          <UpsellCard {...exampleProps} />
          <UpsellCard {...exampleProps} />
        </VStack>
      </Example>

      <Example title="Horizontal">
        <HStack gap={1.5}>
          <UpsellCard {...exampleProps} />
          <UpsellCard {...exampleProps} />
        </HStack>
      </Example>

      <Example title="Long Text">
        <UpsellCard
          {...exampleProps}
          action="This is a really long action"
          description="This is a really long description for the UpsellCard component"
          title="This is a really long title."
        />
      </Example>

      <Example title="Custom Text Nodes">
        <UpsellCard
          {...exampleProps}
          action={
            <Button
              compact
              flush="start"
              numberOfLines={1}
              onClick={onClickConsole}
              variant="secondary"
            >
              Sign up
            </Button>
          }
          dangerouslySetBackground="rgb(var(--blue80))"
          description={
            <Text as="p" color="fgInverse" display="block" font="label2">
              Start your free 30 day trial of Coinbase One
            </Text>
          }
          title={
            <Text as="h3" color="fgInverse" display="block" font="headline">
              Coinbase One
            </Text>
          }
        />
      </Example>

      <Example title="Custom Background">
        <UpsellCard {...exampleProps} dangerouslySetBackground="rgb(var(--yellow20))" />
      </Example>

      <Example title="Custom Width">
        <UpsellCard {...exampleProps} width="100%" />
      </Example>

      <Example title="Carousel">
        <HStack gap={2} overflow="scroll">
          <UpsellCard {...exampleProps} />
          <UpsellCard {...exampleProps} />
          <UpsellCard {...exampleProps} />
          <UpsellCard {...exampleProps} />
        </HStack>
      </Example>
    </ExampleScreen>
  );
};

export default {
  title: 'Components/Cards/UpsellCard',
  component: UpsellCard,
};
