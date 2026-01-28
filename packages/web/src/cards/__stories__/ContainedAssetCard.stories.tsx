import React from 'react';
import { assets, ethBackground } from '@coinbase/cds-common/internal/data/assets';
import { subheadIconSignMap } from '@coinbase/cds-common/tokens/sparkline';

import { Example, ExampleScreen } from '../../__stories__/storybook';
import { DotStatusColor } from '../../dots/DotStatusColor';
import { HStack, VStack } from '../../layout';
import { Text } from '../../typography/Text';
import type { ContainedAssetCardProps } from '../ContainedAssetCard';
import { ContainedAssetCard } from '../ContainedAssetCard';

const a11ySkipConfig = {
  config: {
    rules: [{ id: 'color-contrast', enabled: false }],
  },
};

const onClickConsole = console.log;

const exampleProps: ContainedAssetCardProps = {
  title: 'Title',
  description: 'Description',
  subtitle: 'Subtitle',
  header: (
    <img
      alt="Image Alt"
      aria-hidden="true"
      height="32px"
      src={ethBackground}
      style={{ objectFit: 'cover', cursor: 'pointer', borderRadius: '100%' }}
      width="32px"
    />
  ),
  onClick: onClickConsole,
} as const;

const examplePropsWithChildren: ContainedAssetCardProps = {
  ...exampleProps,
  children: (
    <img
      alt="Image Alt"
      aria-hidden="true"
      height="100%"
      src={ethBackground}
      style={{ objectFit: 'cover' }}
      width="100%"
    />
  ),
} as const;

export const All = () => {
  return (
    <ExampleScreen>
      <Example title="Default">
        <VStack>
          <ContainedAssetCard {...exampleProps} />
        </VStack>
      </Example>

      <Example title="Long Text">
        <VStack>
          <ContainedAssetCard
            {...exampleProps}
            description="This is a very long description text that will get truncated"
            subtitle="This is a very long subtitle text that will get truncated"
            title="This is a very long title text that will get truncated"
          />
          <ContainedAssetCard
            {...examplePropsWithChildren}
            description="This is a very long description text that will get truncated"
            size="l"
            subtitle="This is a very long subtitle text that will get truncated"
            title="This is a very long title text that will get truncated"
          />
        </VStack>
      </Example>

      <Example title="Vertical">
        <VStack gap={1}>
          <ContainedAssetCard {...exampleProps} />
          <ContainedAssetCard {...exampleProps} size="l" />
          <ContainedAssetCard {...examplePropsWithChildren} size="l" />
        </VStack>
      </Example>

      <Example title="Horizontal">
        <HStack gap={1}>
          <ContainedAssetCard {...exampleProps} />
          <ContainedAssetCard {...exampleProps} size="l" />
          <ContainedAssetCard {...examplePropsWithChildren} size="l" />
        </HStack>
      </Example>

      <Example title="Custom">
        <ContainedAssetCard
          {...exampleProps}
          description={
            <Text
              accessibilityLabel="Up 6.37%"
              as="p"
              color="fgPositive"
              display="block"
              font="label2"
            >
              {subheadIconSignMap.upwardTrend}6.37%
            </Text>
          }
          header={
            <img
              alt="Image Alt"
              aria-hidden="true"
              height="32px"
              src={assets.uni.imageUrl}
              style={{ objectFit: 'cover', cursor: 'pointer', borderRadius: '100%' }}
              width="32px"
            />
          }
          subtitle="UNI"
          title="$0.87"
        />
      </Example>

      <Example title="Carousel">
        <HStack gap={2} overflow="scroll">
          <ContainedAssetCard {...exampleProps} />
          <ContainedAssetCard {...exampleProps} size="l" />
          <ContainedAssetCard {...examplePropsWithChildren} size="l" />
        </HStack>
      </Example>

      <Example title="Header With Dot Color Status">
        <ContainedAssetCard
          {...exampleProps}
          header={
            <DotStatusColor overlap="circular" pin="top-end" size="xs" variant="negative">
              {exampleProps.header}
            </DotStatusColor>
          }
        />
      </Example>

      <Example title="Custom Width">
        <VStack>
          <ContainedAssetCard {...exampleProps} maxWidth="none" />
        </VStack>
      </Example>
    </ExampleScreen>
  );
};

All.parameters = {
  a11y: a11ySkipConfig,
};

export default {
  title: 'Components/Cards/ContainedAssetCard',
  component: ContainedAssetCard,
};
