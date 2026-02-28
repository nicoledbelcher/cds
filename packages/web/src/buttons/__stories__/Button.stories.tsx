import React from 'react';
import { css } from '@linaria/core';

import { useTheme } from '../../hooks/useTheme';
import { Icon } from '../../icons/Icon';
import { VStack } from '../../layout';
import { ThemeProvider } from '../../system/ThemeProvider';
import { defaultGradientTheme } from '../../themes/gradients/defaultGradientTheme';
import { Text } from '../../typography/Text';
import { Button, type ButtonBaseProps } from '../Button';
import { ButtonGroup } from '../ButtonGroup';

const radialGradientButtonCss = css`
  background-image: radial-gradient(circle at center, #0052ff, #7b3fe4);
`;

const animatedGradientButtonCss = css`
  background: linear-gradient(270deg, #0052ff, #7b3fe4, #00cc66, #0052ff);
  background-size: 400% 400%;
  animation: gradientShift 3s ease infinite;

  @keyframes gradientShift {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;

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

export const GradientButtons = () => {
  const { activeColorScheme } = useTheme();

  return (
    <ThemeProvider activeColorScheme={activeColorScheme} theme={defaultGradientTheme}>
      <GradientButtonsContent />
    </ThemeProvider>
  );
};

function GradientButtonsContent() {
  const theme = useTheme();

  return (
    <VStack alignItems="flex-start" gap={4}>
      {/* Theme Gradient Presets */}
      <VStack gap={1}>
        <Text as="h2" display="block" font="title3">
          Theme Gradient Presets (gradient)
        </Text>
        <VStack alignItems="flex-start" gap={2}>
          {(['primary', 'brand', 'positive', 'negative', 'premium'] as const).map((preset) => (
            <Button color="fgInverse" gradient={preset} onClick={onClickConsole}>
              Preset: {preset}
            </Button>
          ))}
        </VStack>
      </VStack>

      {/* Custom Linear Gradients */}
      <VStack alignItems="flex-start" gap={2}>
        <Text as="h2" display="block" font="title3">
          Custom Linear Gradients (gradientConfig)
        </Text>
        <Button
          color="fgInverse"
          gradientConfig={{
            colors: [theme.color.accentBoldBlue, theme.color.accentBoldPurple],
            angle: 90,
          }}
          onClick={onClickConsole}
        >
          Custom: Blue to Purple
        </Button>
        <Button
          color="fgInverse"
          gradientConfig={{
            colors: [theme.color.bgPositive, theme.color.accentBoldBlue],
            angle: 45,
          }}
          onClick={onClickConsole}
        >
          Custom: 45° Angle
        </Button>
        <Button
          block
          color="fgInverse"
          gradientConfig={{
            colors: [
              theme.color.accentBoldBlue,
              theme.color.accentBoldPurple,
              theme.color.accentBoldYellow,
            ],
            angle: 90,
          }}
          onClick={onClickConsole}
        >
          Multi-Color Block Gradient
        </Button>
      </VStack>

      {/* Different Gradient Styles (radial/conic via style prop) */}
      <DifferentGradientStyles />

      {/* Gradient with Interactive States */}
      <VStack alignItems="flex-start" gap={2}>
        <Text as="h2" display="block" font="title3">
          Gradient with Hover/Active States
        </Text>
        <Button
          blendStyles={{
            backgroundGradient: `linear-gradient(90deg, ${theme.color.bgPositive}, ${theme.color.accentBoldBlue})`,
            hoveredBackgroundGradient: `linear-gradient(90deg, ${theme.color.accentBoldBlue}, ${theme.color.accentBoldPurple})`,
            pressedBackgroundGradient: `linear-gradient(90deg, ${theme.color.bgWarning}, ${theme.color.accentBoldPurple})`,
          }}
          color="fgInverse"
          onClick={onClickConsole}
          variant="gradient"
        >
          Gradient with Hover/Active States
        </Button>
        <Button
          disabled
          blendStyles={{
            disabledBackgroundGradient: `linear-gradient(90deg, ${theme.color.bgSecondary}, ${theme.color.bgOverlay})`,
          }}
          color="fg"
          onClick={onClickConsole}
          variant="gradient"
        >
          Disabled Gradient
        </Button>
      </VStack>
    </VStack>
  );
}

function DifferentGradientStyles() {
  const theme = useTheme();

  const radialGradient = `radial-gradient(circle, ${theme.color.accentBoldBlue}, ${theme.color.accentBoldPurple})`;
  const conicGradient = [
    'conic-gradient(from 0deg',
    theme.color.bgNegative,
    theme.color.bgWarning,
    theme.color.bgPositive,
    theme.color.accentBoldBlue,
    `${theme.color.bgNegative})`,
  ].join(', ');
  const blue = theme.color.accentBoldBlue;
  const purple = theme.color.accentBoldPurple;
  const repeatingGradient = `repeating-linear-gradient(45deg, ${blue}, ${blue} 10px, ${purple} 10px, ${purple} 20px)`;

  return (
    <VStack alignItems="flex-start" gap={2}>
      <Text as="h2" display="block" font="title3">
        Different Gradient Styles
      </Text>
      <Button
        color="fgInverse"
        onClick={onClickConsole}
        style={{ backgroundImage: radialGradient }}
        variant="gradient"
      >
        Radial Gradient
      </Button>
      <Button
        color="fgInverse"
        onClick={onClickConsole}
        style={{ backgroundImage: conicGradient }}
        variant="gradient"
      >
        Conic Gradient
      </Button>
      <Button
        color="fgInverse"
        onClick={onClickConsole}
        style={{ backgroundImage: repeatingGradient }}
        variant="gradient"
      >
        Repeating Linear Gradient
      </Button>
      <Button
        block
        color="fgInverse"
        gradientConfig={{
          colors: [
            theme.color.bgNegative,
            theme.color.bgWarning,
            theme.color.bgPositive,
            theme.color.accentBoldBlue,
          ],
          angle: 90,
        }}
        onClick={onClickConsole}
      >
        Rainbow Gradient
      </Button>

      <Text as="h3" display="block" font="title4">
        Via className
      </Text>
      <Button
        className={radialGradientButtonCss}
        color="fgInverse"
        onClick={onClickConsole}
        variant="gradient"
      >
        Radial (className)
      </Button>
      <Button
        className={animatedGradientButtonCss}
        color="fgInverse"
        onClick={onClickConsole}
        variant="gradient"
      >
        Animated Gradient (className)
      </Button>
    </VStack>
  );
}
