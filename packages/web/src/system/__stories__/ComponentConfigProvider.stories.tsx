import React, { memo, useRef, useState } from 'react';
import { css } from '@linaria/core';

import { Button, IconButton } from '../../buttons';
import { Switch, TextInput } from '../../controls';
import type { ComponentsConfig, ComponentTheme } from '../../core/theme';
import { useComponentConfig } from '../../hooks/useComponentConfig';
import { Divider } from '../../layout/Divider';
import { HStack } from '../../layout/HStack';
import { VStack } from '../../layout/VStack';
import { Tag } from '../../tag/Tag';
import { Text } from '../../typography/Text';
import { ComponentConfigProvider } from '../ComponentConfigProvider';

export default {
  title: 'Components/ComponentConfigProvider',
};

// =============================================================================
// 1. Static Config — simple prop defaults applied globally
// =============================================================================

const staticConfig: ComponentsConfig = {
  Button: { variant: 'secondary', compact: true },
  IconButton: { variant: 'secondary', compact: true },
  TextInput: { bordered: false, inputBackground: 'bgAlternate' },
};

export const StaticConfig = () => (
  <ComponentConfigProvider value={staticConfig}>
    <VStack gap={4} padding={4}>
      <VStack gap={1}>
        <Text as="h2" display="block" font="title2">
          Static Config
        </Text>
        <Text as="p" color="fgMuted" display="block" font="body">
          All Buttons are secondary + compact, TextInputs have no border and alternate background.
          No functions — just plain objects.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Text as="p" display="block" font="label1">
          Buttons (config: secondary, compact)
        </Text>
        <HStack flexWrap="wrap" gap={2}>
          <Button>Config Default</Button>
          <Button startIcon="add">With Icon</Button>
          <IconButton name="settings" />
          <IconButton name="info" />
        </HStack>
      </VStack>

      <VStack gap={2}>
        <Text as="p" display="block" font="label1">
          Local overrides always win
        </Text>
        <HStack flexWrap="wrap" gap={2}>
          <Button variant="primary">Local Primary</Button>
          <Button compact={false}>Local Not Compact</Button>
          <Button compact={false} variant="positive">
            Local Positive + Full Size
          </Button>
        </HStack>
      </VStack>

      <VStack gap={2}>
        <Text as="p" display="block" font="label1">
          TextInput (config: no border, alternate bg)
        </Text>
        <TextInput label="Email" placeholder="you@example.com" />
      </VStack>
    </VStack>
  </ComponentConfigProvider>
);

// =============================================================================
// 2. Functional Config — dynamic defaults based on component props
// =============================================================================

const functionalConfig: ComponentsConfig = {
  Button: (props) => ({
    borderRadius: props.compact ? 200 : 900,
    paddingX: props.compact ? 2 : 5,
    variant: props.loading ? 'secondary' : 'primary',
  }),
};

export const FunctionalConfig = () => (
  <ComponentConfigProvider value={functionalConfig}>
    <VStack gap={4} padding={4}>
      <VStack gap={1}>
        <Text as="h2" display="block" font="title2">
          Functional Config
        </Text>
        <Text as="p" color="fgMuted" display="block" font="body">
          Button config is a function that reads the component&apos;s own props: compact buttons get
          pill shape (borderRadius: 200), loading buttons become secondary.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Text as="p" display="block" font="label1">
          Compact buttons get pill shape
        </Text>
        <HStack flexWrap="wrap" gap={2}>
          <Button compact>Compact (pill)</Button>
          <Button>Regular (rounded)</Button>
        </HStack>
      </VStack>

      <VStack gap={2}>
        <Text as="p" display="block" font="label1">
          Loading buttons auto-switch to secondary
        </Text>
        <HStack flexWrap="wrap" gap={2}>
          <Button loading>Loading (auto secondary)</Button>
          <Button>Not Loading (stays primary)</Button>
        </HStack>
      </VStack>
    </VStack>
  </ComponentConfigProvider>
);

// =============================================================================
// 3. Mixed Config — some components static, some functional
// =============================================================================

const mixedConfig: ComponentsConfig = {
  Button: (props) => ({
    borderRadius: props.compact ? 200 : 900,
  }),
  IconButton: { borderRadius: 200 },
  TextInput: { bordered: false },
  Tag: { intent: 'promotional' },
};

export const MixedConfig = () => (
  <ComponentConfigProvider value={mixedConfig}>
    <VStack gap={4} padding={4}>
      <VStack gap={1}>
        <Text as="h2" display="block" font="title2">
          Mixed Config (static + functional)
        </Text>
        <Text as="p" color="fgMuted" display="block" font="body">
          Button uses a functional resolver (dynamic borderRadius), while IconButton, TextInput, and
          Tag use simple static objects.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Text as="p" display="block" font="label1">
          Button (functional: borderRadius varies by compact)
        </Text>
        <HStack flexWrap="wrap" gap={2}>
          <Button compact>Compact Pill</Button>
          <Button>Regular Rounded</Button>
        </HStack>
      </VStack>

      <VStack gap={2}>
        <Text as="p" display="block" font="label1">
          IconButton (static: borderRadius 200)
        </Text>
        <HStack gap={2}>
          <IconButton name="settings" />
          <IconButton name="pencil" />
          <IconButton name="trashCan" />
        </HStack>
      </VStack>

      <VStack gap={2}>
        <Text as="p" display="block" font="label1">
          TextInput (static: no border)
        </Text>
        <TextInput label="Search" placeholder="Type here..." />
      </VStack>

      <VStack gap={2}>
        <Text as="p" display="block" font="label1">
          Tag (static: promotional intent)
        </Text>
        <HStack gap={2}>
          <Tag>New Feature</Tag>
          <Tag>Beta</Tag>
          <Tag intent="informational">Local override: informational</Tag>
        </HStack>
      </VStack>
    </VStack>
  </ComponentConfigProvider>
);

// =============================================================================
// 4. Dynamic Toggle — swap configs at runtime
// =============================================================================

const defaultButtonConfig: ComponentsConfig = {
  Button: { variant: 'primary' },
  IconButton: { variant: 'primary' },
};

const brandedButtonConfig: ComponentsConfig = {
  Button: { variant: 'secondary', borderRadius: 200, compact: true },
  IconButton: { variant: 'secondary', borderRadius: 200, compact: true },
};

export const DynamicToggle = () => {
  const [branded, setBranded] = useState(false);
  const config = branded ? brandedButtonConfig : defaultButtonConfig;

  return (
    <VStack gap={4} padding={4}>
      <VStack gap={1}>
        <Text as="h2" display="block" font="title2">
          Dynamic Toggle
        </Text>
        <Text as="p" color="fgMuted" display="block" font="body">
          Toggle between two configs at runtime. Notice how components react instantly.
        </Text>
      </VStack>

      <HStack alignItems="center" gap={2}>
        <Switch checked={branded} onChange={() => setBranded((b) => !b)}>
          Branded style
        </Switch>
      </HStack>

      <ComponentConfigProvider value={config}>
        <VStack gap={2}>
          <Text as="p" display="block" font="label1">
            Active config: {branded ? 'Branded (secondary, pill, compact)' : 'Default (primary)'}
          </Text>
          <HStack flexWrap="wrap" gap={2}>
            <Button>Action</Button>
            <Button startIcon="add">Create</Button>
            <IconButton name="settings" />
            <IconButton name="info" />
          </HStack>
        </VStack>
      </ComponentConfigProvider>
    </VStack>
  );
};

// =============================================================================
// 5. Nested Providers — child overrides parent per component
// =============================================================================

const outerConfig: ComponentsConfig = {
  Button: { variant: 'secondary' },
  IconButton: { variant: 'secondary' },
  TextInput: { bordered: false },
};

const innerConfig: ComponentsConfig = {
  Button: { variant: 'positive', compact: true },
};

export const NestedProviders = () => (
  <ComponentConfigProvider value={outerConfig}>
    <VStack gap={4} padding={4}>
      <VStack gap={1}>
        <Text as="h2" display="block" font="title2">
          Nested Providers
        </Text>
        <Text as="p" color="fgMuted" display="block" font="body">
          Outer: all buttons secondary, inputs borderless. Inner: overrides Button to positive +
          compact, but IconButton and TextInput inherit the outer config.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Text as="p" display="block" font="label1">
          Outer scope
        </Text>
        <HStack flexWrap="wrap" gap={2}>
          <Button>Outer Button</Button>
          <IconButton name="settings" />
        </HStack>
        <TextInput label="Outer Input" placeholder="No border" />
      </VStack>

      <ComponentConfigProvider value={innerConfig}>
        <VStack
          gap={2}
          padding={3}
          style={{ border: '2px dashed var(--color-bgPositive)', borderRadius: 12 }}
        >
          <Text as="p" display="block" font="label1">
            Inner scope (Button overridden, others inherited)
          </Text>
          <HStack flexWrap="wrap" gap={2}>
            <Button>Inner Button (positive, compact)</Button>
            <IconButton name="settings" />
          </HStack>
          <TextInput label="Inner Input" placeholder="Still no border (inherited)" />
        </VStack>
      </ComponentConfigProvider>
    </VStack>
  </ComponentConfigProvider>
);

// =============================================================================
// 6. Re-render Isolation Demo — visual proof that unrelated components don't re-render
// =============================================================================

const renderCountCss = css`
  font-variant-numeric: tabular-nums;
`;

const RenderCounter = memo(function RenderCounter({
  label,
  componentName,
}: {
  label: string;
  componentName: keyof ComponentTheme;
}) {
  const renderCount = useRef(0);
  renderCount.current++;

  useComponentConfig(componentName, {});

  return (
    <HStack bordered alignItems="center" borderRadius={400} gap={2} padding={2}>
      <Text display="block" font="label1">
        {label}
      </Text>
      <Text className={renderCountCss} color="fgMuted" display="block" font="label2">
        renders: {renderCount.current}
      </Text>
    </HStack>
  );
});

export const RenderIsolation = () => {
  const [buttonVariant, setButtonVariant] = useState<'primary' | 'secondary'>('primary');

  const buttonConfig =
    buttonVariant === 'primary'
      ? { variant: 'primary' as const }
      : { variant: 'secondary' as const, compact: true };

  const config: ComponentsConfig = {
    Button: buttonConfig,
    Modal: { disableOverlayPress: true },
    TextInput: { bordered: false },
    IconButton: { variant: 'secondary' },
  };

  return (
    <VStack gap={4} padding={4}>
      <VStack gap={1}>
        <Text as="h2" display="block" font="title2">
          Re-render Isolation
        </Text>
        <Text as="p" color="fgMuted" display="block" font="body">
          Click the button below to change only the Button config. Watch the render counts — only
          &quot;Button&quot; increments. Modal, TextInput, and IconButton stay at 1 because their
          config references don&apos;t change.
        </Text>
        <Text as="p" color="fgMuted" display="block" font="caption">
          (Components are wrapped in React.memo, matching production CDS behavior)
        </Text>
      </VStack>

      <ComponentConfigProvider value={config}>
        <VStack gap={2}>
          <RenderCounter componentName="Button" label="Button" />
          <RenderCounter componentName="Modal" label="Modal" />
          <RenderCounter componentName="TextInput" label="TextInput" />
          <RenderCounter componentName="IconButton" label="IconButton" />
        </VStack>

        <Divider />

        <VStack gap={2}>
          <Text as="p" display="block" font="label1">
            Current Button config: variant=&quot;{buttonConfig.variant}&quot;
            {'compact' in buttonConfig ? ', compact=true' : ''}
          </Text>
          <HStack gap={2}>
            <Button>Preview Button</Button>
            <IconButton name="settings" />
          </HStack>
        </VStack>
      </ComponentConfigProvider>

      <Button
        onClick={() => setButtonVariant((v) => (v === 'primary' ? 'secondary' : 'primary'))}
        variant="positive"
      >
        Toggle Button Config
      </Button>
    </VStack>
  );
};

RenderIsolation.parameters = {
  docs: {
    description: {
      story:
        "Demonstrates that changing one component's config does not cause unrelated components to re-render. " +
        'The render count for Modal, TextInput, and IconButton should stay at 1 after toggling the Button config.',
    },
  },
};
