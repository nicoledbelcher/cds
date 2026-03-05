import React from 'react';

import { Example, ExampleScreen } from '../../examples/ExampleScreen';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from '../../icons';
import { HStack } from '../../layout/HStack';
import { VStack } from '../../layout/VStack';
import { RemoteImage } from '../../media/RemoteImage';
import { RadialGradientFill } from '../../gradients/RadialGradientFill';
import { ThemeProvider } from '../../system/ThemeProvider';
import { defaultGradientTheme } from '../../themes/gradients/defaultGradientTheme';
import { Text } from '../../typography/Text';
import { Button, type ButtonProps } from '../Button';
import { ButtonGroup } from '../ButtonGroup';

/**
 * Gradient button examples using preset gradients from defaultGradientTheme.
 */
const GradientButtonExamples = () => {
  const theme = useTheme();

  return (
    <>
      <Example title="Theme Gradient Presets">
        <Button color="fgInverse" gradient="brand" onPress={() => {}} variant="gradient">
          Brand Preset
        </Button>

        <Button color="fgInverse" gradient="premium" onPress={() => {}} variant="gradient">
          Premium Preset
        </Button>

        <Button color="fgInverse" gradient="positive" onPress={() => {}} variant="gradient">
          Positive Preset
        </Button>

        <Button color="fgInverse" gradient="negative" onPress={() => {}} variant="gradient">
          Negative Preset
        </Button>

        <Button color="fgInverse" gradient="primary" onPress={() => {}} variant="gradient">
          Primary Preset
        </Button>
      </Example>

      <Example title="Theme Gradient Presets (Block)">
        <Button block color="fgInverse" gradient="brand" onPress={() => {}} variant="gradient">
          Full Width Brand Gradient
        </Button>

        <Button block color="fgInverse" gradient="premium" onPress={() => {}} variant="gradient">
          Full Width Premium Gradient
        </Button>

        <Button
          block
          color="fgInverse"
          gradient="positive"
          onPress={() => {}}
          startIcon="checkmark"
          variant="gradient"
        >
          Positive with Icon
        </Button>
      </Example>

      <Example title="Custom Gradients (gradientConfig)">
        <Button
          color="fgInverse"
          gradientConfig={{
            colors: [theme.color.bgNegative, theme.color.bgWarning],
            angle: 90,
          }}
          onPress={() => {}}
          variant="gradient"
        >
          Custom Warning Gradient
        </Button>

        <Button
          color="fgInverse"
          gradientConfig={{
            colors: [
              theme.color.accentBoldPurple,
              theme.color.accentBoldBlue,
              theme.color.accentBoldGreen,
            ],
            stops: [0, 0.5, 1],
            angle: 45,
          }}
          onPress={() => {}}
          variant="gradient"
        >
          Multi-color Custom Gradient
        </Button>
      </Example>

      <Example title="Custom Gradients (gradientNode with RadialGradientFill)">
        <Button
          color="fgInverse"
          gradientNode={
            <RadialGradientFill
              colors={[theme.color.accentBoldPurple, theme.color.accentBoldBlue]}
            />
          }
          onPress={() => {}}
          variant="gradient"
        >
          Radial Gradient
        </Button>

        <Button
          color="fgInverse"
          gradientNode={
            <RadialGradientFill
              colors={[theme.color.bgPrimary, theme.color.accentBoldPurple]}
              cx={0.2}
              cy={0.2}
            />
          }
          onPress={() => {}}
          variant="gradient"
        >
          Radial Gradient (off-center)
        </Button>
      </Example>

      <Example title="Gradient with blendStyles (pressed/disabled states)">
        <Text color="fgMuted" font="caption">
          Press and hold to see the pressed gradient
        </Text>

        <Button
          blendStyles={{
            backgroundGradient: {
              colors: [theme.color.accentBoldBlue, theme.color.accentBoldPurple],
              angle: 90,
            },
            pressedBackgroundGradient: {
              colors: [theme.color.accentBoldPurple, theme.color.accentBoldBlue],
              angle: 90,
            },
          }}
          color="fgInverse"
          onPress={() => {}}
          variant="gradient"
        >
          Pressed: Gradient Reverses
        </Button>

        <Button
          blendStyles={{
            backgroundGradient: {
              colors: [theme.color.bgPrimary, theme.color.accentBoldPurple],
              angle: 90,
            },
            pressedBackgroundGradient: {
              colors: [theme.color.bgPositive, theme.color.accentBoldGreen],
              angle: 90,
            },
          }}
          color="fgInverse"
          onPress={() => {}}
          variant="gradient"
        >
          Pressed: Changes to Green
        </Button>

        <Button
          blendStyles={{
            backgroundGradient: theme.gradient?.premium,
            pressedBackgroundGradient: theme.gradient?.brand,
          }}
          color="fgInverse"
          onPress={() => {}}
          variant="gradient"
        >
          Premium → Brand on Press
        </Button>
      </Example>

      <Example title="Disabled Gradient Buttons">
        <Button
          disabled
          blendStyles={{
            backgroundGradient: {
              colors: [theme.color.accentBoldBlue, theme.color.accentBoldPurple],
              angle: 90,
            },
            disabledBackgroundGradient: {
              colors: [theme.color.bgSecondary, theme.color.bgTertiary],
              angle: 90,
            },
          }}
          color="fgMuted"
          onPress={() => {}}
          variant="gradient"
        >
          Disabled: Muted Gradient
        </Button>

        <Button
          disabled
          blendStyles={{
            backgroundGradient: theme.gradient?.brand,
            disabledBackgroundGradient: {
              colors: [theme.color.bgLine, theme.color.bgLineHeavy],
              angle: 90,
            },
          }}
          color="fgMuted"
          onPress={() => {}}
          variant="gradient"
        >
          Disabled: Gray Gradient
        </Button>
      </Example>

      <Example title="All States Combined">
        <Text color="fgMuted" font="caption">
          Button with base, pressed, and disabled gradient states
        </Text>

        <Button
          blendStyles={{
            backgroundGradient: {
              colors: [theme.color.accentBoldBlue, theme.color.accentBoldPurple],
              angle: 90,
            },
            pressedBackgroundGradient: {
              colors: [theme.color.bgPositive, theme.color.accentBoldGreen],
              angle: 90,
            },
            disabledBackgroundGradient: {
              colors: [theme.color.bgSecondary, theme.color.bgTertiary],
              angle: 90,
            },
          }}
          color="fgInverse"
          onPress={() => {}}
          variant="gradient"
        >
          Active Button (press me)
        </Button>

        <Button
          disabled
          blendStyles={{
            backgroundGradient: {
              colors: [theme.color.accentBoldBlue, theme.color.accentBoldPurple],
              angle: 90,
            },
            pressedBackgroundGradient: {
              colors: [theme.color.bgPositive, theme.color.accentBoldGreen],
              angle: 90,
            },
            disabledBackgroundGradient: {
              colors: [theme.color.bgSecondary, theme.color.bgTertiary],
              angle: 90,
            },
          }}
          color="fgMuted"
          onPress={() => {}}
          variant="gradient"
        >
          Same Button (disabled)
        </Button>
      </Example>
    </>
  );
};

const buttonStories: Omit<ButtonProps, 'children'>[] = [
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
];

const ButtonScreen = () => {
  const theme = useTheme();
  return (
    <ExampleScreen>
      <Example inline title="Complex example">
        <Button compact endIcon="caretDown" variant="secondary">
          <HStack alignItems="center" justifyContent="center" paddingTop={0}>
            <RemoteImage height={16} resizeMode="cover" shape="circle" width={16} />
            <Text color="fgMuted" font="label2" paddingStart={1} testID="DexInputNetwork">
              Ethereum
            </Text>
          </HStack>
        </Button>
      </Example>
      {buttonStories.map((props, index) => {
        return (
          <Example inline>
            <Button key={index} {...props}>
              I am a button
            </Button>
          </Example>
        );
      })}
      <Example title="Long text content">
        <Button>
          Some really really really long button text that should get truncated after wrapping two
          lines
        </Button>
      </Example>
      <Example title="Typography props">
        <VStack alignItems="flex-start" gap={2}>
          <Button>I am a headline button</Button>
          <Button font="body">I am a body button</Button>
          <Button font="title3">I am a title3 button</Button>
          <Button fontSize="title3" fontWeight="body">
            I have custom fontSize & fontWeight
          </Button>
        </VStack>
      </Example>

      <Example title="Custom endIcon on Button">
        <VStack gap={2}>
          <ButtonGroup accessibilityLabel="Group">
            <Button end={<Icon color="fg" name="caretRight" size="s" />}>
              <Text font="label1">Test</Text>
            </Button>
            <Button end={<Icon active color="fg" name="add" size="s" />} variant="secondary">
              <Text font="label1">Test</Text>
            </Button>
            <Button end={<Icon active color="fg" name="airdrop" size="s" />} variant="secondary">
              <Text font="label1">Test</Text>
            </Button>
          </ButtonGroup>
        </VStack>
      </Example>
      <Example title="Custom wrapperStyles for Wallet">
        <Button
          transparent
          wrapperStyles={{
            base: { backgroundColor: 'green' },
          }}
        >
          Hello world
        </Button>
      </Example>

      <ThemeProvider activeColorScheme={theme.activeColorScheme} theme={defaultGradientTheme}>
        <GradientButtonExamples />
      </ThemeProvider>
    </ExampleScreen>
  );
};

export default ButtonScreen;
