import React from 'react';
import {
  ethBackground,
  floatingAssetCardCustomImage,
} from '@coinbase/cds-common/internal/data/assets';

import { Example, ExampleScreen } from '../../__stories__/storybook';
import { HStack, VStack } from '../../layout';
import { Text } from '../../typography/Text';
import { FloatingAssetCard } from '../FloatingAssetCard';

const onClickConsole = console.log;

const exampleProps = {
  title: 'Title',
  description: 'Description',
  subtitle: 'Subtitle',
  media: (
    <img
      alt=""
      aria-hidden="true"
      height="100%"
      src={ethBackground}
      style={{ objectFit: 'cover', cursor: 'pointer' }}
      width="100%"
    />
  ),
  onClick: onClickConsole,
} as const;

export const All = () => {
  return (
    <ExampleScreen>
      <Example title="Default">
        <FloatingAssetCard {...exampleProps} />
      </Example>

      <Example title="Vertical (Default and Large)">
        <VStack gap={1}>
          <FloatingAssetCard {...exampleProps} />
          <FloatingAssetCard {...exampleProps} size="l" />
        </VStack>
      </Example>

      <Example title="Horizontal (Default and Large)">
        <HStack gap={1}>
          <FloatingAssetCard {...exampleProps} />
          <FloatingAssetCard {...exampleProps} size="l" />
        </HStack>
      </Example>

      <Example title="Long Text">
        <FloatingAssetCard
          {...exampleProps}
          description="This is a really long description. This is a really long description. This is a really long description"
          subtitle="This is a really long subtitle"
          title="This is a really long Title. This is a really long Title. This is a really long Title"
        />
      </Example>

      <Example title="Custom">
        <FloatingAssetCard
          {...exampleProps}
          description={
            <Text as="p" color="fgMuted" display="block" font="label2">
              2 min read
            </Text>
          }
          media={
            <img
              alt=""
              aria-hidden="true"
              height="100%"
              src={floatingAssetCardCustomImage}
              style={{ objectFit: 'cover', cursor: 'pointer' }}
              width="100%"
            />
          }
          subtitle={null}
          title="Benefits of staking"
        />
      </Example>

      <Example title="Carousel">
        <HStack gap={2} overflow="scroll">
          <FloatingAssetCard {...exampleProps} />
          <FloatingAssetCard {...exampleProps} />
          <FloatingAssetCard {...exampleProps} size="l" />
        </HStack>
      </Example>
    </ExampleScreen>
  );
};

export default {
  title: 'Components/Cards/FloatingAssetCard',
  component: FloatingAssetCard,
};
