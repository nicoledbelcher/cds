import React from 'react';

import { Icon } from '../../icons/Icon';
import { VStack } from '../../layout';
import { Button, type ButtonBaseProps } from '../Button';
import { ButtonGroup } from '../ButtonGroup';

export default {
  component: Button,
  title: 'Components/Buttons/Button',
};

const buttonStories: Omit<ButtonBaseProps, 'children'>[] = [
  { variant: 'foregroundMuted' },
  { variant: 'secondary' },
  { variant: 'tertiary' },
  { variant: 'positive' },
  { variant: 'negative' },
  { variant: 'secondary', transparent: true },
  { variant: 'positive', transparent: true },
  { variant: 'negative', transparent: true },
  { block: true },
  { compact: true },
  { compact: true, block: true },
  { transparent: true },
  { disabled: true },
  { loading: true },
  { loading: true, compact: true },
  { startIcon: 'backArrow' },
  { endIcon: 'backArrow' },
  { startIcon: 'backArrow', endIcon: 'forwardArrow' },
  { startIcon: 'backArrow', endIcon: 'forwardArrow', block: true },
  { transparent: true, flush: 'start', compact: true, endIcon: 'forwardArrow' },
  { transparent: true, flush: 'end', compact: true, endIcon: 'forwardArrow' },
  { flush: 'start', endIcon: 'forwardArrow' },
  { flush: 'end', endIcon: 'forwardArrow' },
  { startIcon: 'backArrow', endIcon: 'forwardArrow', compact: true },
  { startIcon: 'backArrow', compact: true },
  { endIcon: 'forwardArrow', compact: true },
  { padding: 5 },
  { paddingX: 5, padding: 4 },
  { paddingY: 4 },
  { paddingStart: 6, paddingEnd: 6 },
  { paddingTop: 6, paddingBottom: 6 },
  { marginStart: -2 },
  { font: 'body' },
  { font: 'title3' },
  { fontSize: 'title3', fontWeight: 'body' },
];

const onClickConsole = () => console.log('clicked');

export const CreateButtonStories = () => (
  <VStack alignItems="flex-start" gap={2} padding={0.5}>
    {buttonStories.map((props, idx) => {
      const key = `button-${idx}`;
      return (
        <Button key={key} onClick={onClickConsole} {...props}>
          Button
        </Button>
      );
    })}
  </VStack>
);

export const CustomEndIconButton = () => (
  <VStack gap={2}>
    <ButtonGroup accessibilityLabel="Group">
      <Button end={<Icon color="fg" name="caretRight" size="s" />}>Test</Button>
      <Button end={<Icon active color="fg" name="add" size="s" />} variant="secondary">
        Test
      </Button>
      <Button
        endIconActive
        end={<Icon active color="fg" name="add" size="s" />}
        endIcon="airdrop"
        variant="secondary"
      >
        Test
      </Button>
    </ButtonGroup>
  </VStack>
);

export const FlushProps = () => (
  <VStack background="bgSecondary" gap={4} paddingX={2}>
    <Button onClick={() => {}} variant="positive">
      No Flush
    </Button>
    <Button block flush="start" onClick={() => {}}>
      Flush to Start
    </Button>
    <Button block flush="end" onClick={() => {}} variant="negative">
      Flush to End
    </Button>
  </VStack>
);

export const GradientButton = () => (
  <VStack alignItems="flex-start" gap={2}>
    <Button color="fgInverse" gradient="brand" onClick={() => console.log('clicked')}>
      Brand Gradient Button
    </Button>

    <Button
      color="fgInverse"
      gradient={{ direction: 'to-r', colors: ['bgPositive', 'bgPrimary'] }}
      onClick={() => console.log('clicked')}
    >
      Positive to Primary
    </Button>

    <Button
      color="fgInverse"
      gradient={{ direction: 'to-r', colors: ['bgNegative', 'bgWarning'] }}
      onClick={() => console.log('clicked')}
    >
      Negative to Warning
    </Button>

    <Button color="fgInverse" gradient="premium" onClick={() => console.log('clicked')}>
      Premium Gradient
    </Button>

    <Button
      color="fgInverse"
      gradient={{ direction: 45, colors: ['accentBoldBlue', 'accentBoldPurple'] }}
      onClick={() => console.log('clicked')}
    >
      Custom Angle (45°)
    </Button>

    <Button
      color="fgInverse"
      gradient={{
        direction: 'to-r',
        colors: [
          { color: 'accentBoldBlue', offset: 0 },
          { color: 'accentBoldPurple', offset: 0.5 },
          { color: 'accentBoldYellow', offset: 1 },
        ],
      }}
      onClick={() => console.log('clicked')}
    >
      Custom Color Stops
    </Button>
  </VStack>
);

export const GradientButtonBlock = () => (
  <VStack gap={2}>
    <Button block color="fgInverse" gradient="brand" onClick={() => console.log('clicked')}>
      Full Width Gradient Button
    </Button>

    <Button
      block
      color="fgInverse"
      gradient={{
        direction: 'to-r',
        colors: ['accentBoldBlue', 'accentBoldPurple', 'accentBoldYellow'],
      }}
      onClick={() => console.log('clicked')}
    >
      Multi-Color Gradient
    </Button>

    <Button
      block
      color="fgInverse"
      gradient="positive"
      onClick={() => console.log('clicked')}
      startIcon="checkmark"
    >
      Gradient with Icon
    </Button>
  </VStack>
);

export const GradientButtonWithBlendStyles = () => (
  <VStack alignItems="flex-start" gap={2}>
    <Button
      data-
      blendStyles={{
        background: 'linear-gradient(90deg, #0052FF 0%, #5B21B6 100%)',
        hoveredBackground: 'linear-gradient(90deg, #0047E0 0%, #4C1D95 100%)',
        pressedBackground: 'linear-gradient(90deg, #003BB3 0%, #3B0764 100%)',
      }}
      color="fgInverse"
      onClick={() => console.log('clicked')}
    >
      Gradient with Hover States
    </Button>

    <Button
      blendStyles={{
        background: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)',
        hoveredBackground: 'linear-gradient(135deg, #E85555 0%, #E5CF55 100%)',
        pressedBackground: 'linear-gradient(135deg, #CC4444 0%, #CCB844 100%)',
      }}
      color="fg"
      onClick={() => console.log('clicked')}
    >
      Warm Gradient with States
    </Button>

    <Button
      blendStyles={{
        background: 'linear-gradient(90deg, #667EEA 0%, #764BA2 50%, #F093FB 100%)',
        hoveredBackground: 'linear-gradient(90deg, #5A6FD1 0%, #683F8E 50%, #D683E2 100%)',
        pressedBackground: 'linear-gradient(90deg, #4E60B8 0%, #5A337A 50%, #BC73C9 100%)',
      }}
      color="fgInverse"
      onClick={() => console.log('clicked')}
    >
      Multi-Stop Gradient States
    </Button>

    <Button
      disabled
      blendStyles={{
        background: 'linear-gradient(45deg, #00D9FF 0%, #00FF94 100%)',
        hoveredBackground: 'linear-gradient(45deg, #00C4E5 0%, #00E585 100%)',
        pressedBackground: 'linear-gradient(45deg, #00AFCC 0%, #00CC76 100%)',
        disabledBackground: 'linear-gradient(45deg, #99E5F2 0%, #99F2C9 100%)',
      }}
      color="fg"
      onClick={() => console.log('clicked')}
    >
      Disabled Gradient State
    </Button>

    <Button
      block
      blendStyles={{
        background: 'linear-gradient(90deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
        hoveredBackground: 'linear-gradient(90deg, #2A2A4E 0%, #26315E 50%, #1F4480 100%)',
        pressedBackground: 'linear-gradient(90deg, #0A0A1E 0%, #06112E 50%, #001440 100%)',
      }}
      color="fgInverse"
      onClick={() => console.log('clicked')}
    >
      Dark Gradient Block Button
    </Button>
  </VStack>
);
