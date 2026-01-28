import React, { useEffect, useRef } from 'react';

import { Example, ExampleScreen } from '../../__stories__/storybook';
import { Button } from '../../buttons/Button';
import { HStack } from '../../layout/HStack';
import { VStack } from '../../layout/VStack';
import { Text } from '../../typography/Text';
import { PortalProvider } from '../PortalProvider';
import { TooltipContent } from '../tooltip/TooltipContent';

export default {
  title: 'Components/Tooltip/TooltipContent',
  component: TooltipContent,
  parameters: {
    layout: 'padded',
  },
};

const BasicTooltipContentWrapper = ({ content }: { content: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.opacity = '1';
    }
  }, []);

  return (
    <PortalProvider>
      <HStack gap={5} paddingX={8} paddingY={2}>
        <VStack gap={2} paddingX={2}>
          <TooltipContent ref={ref} content={content} gap={0} />
        </VStack>
      </HStack>
    </PortalProvider>
  );
};

const longContent =
  'This is the tooltip Content. This is just really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really Long.';

const longWordContent =
  'ThisisReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyLongWordContent. This is just really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really really Long.';

const VStackNode = (
  <VStack gap={2}>
    <Button>Btn 1</Button>
    <Button>Btn 2</Button>
    <Button>Btn 3</Button>
  </VStack>
);

const HStackNode = (
  <HStack gap={2}>
    <Button>Btn 1</Button>
    <Button>Btn 2</Button>
    <Button>Btn 3</Button>
  </HStack>
);

export const All = () => {
  return (
    <ExampleScreen>
      <Example title="Default">
        <BasicTooltipContentWrapper content="This is the tooltip Content" />
      </Example>

      <Example title="Tooltip Long Content">
        <BasicTooltipContentWrapper content={longContent} />
      </Example>

      <Example title="Tooltip Long Word Content">
        <BasicTooltipContentWrapper content={longWordContent} />
      </Example>

      <Example title="VStack Node Content">
        <BasicTooltipContentWrapper content={VStackNode} />
      </Example>

      <Example title="HStack Node Content">
        <BasicTooltipContentWrapper content={HStackNode} />
      </Example>
    </ExampleScreen>
  );
};
