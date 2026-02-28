import React from 'react';
import { css } from '@linaria/core';

import { useTheme } from '../../hooks/useTheme';
import { ThemeProvider } from '../../system/ThemeProvider';
import { defaultGradientTheme } from '../../themes/gradients';
import { Text } from '../../typography/Text';
import { GradientBox } from '../GradientBox';
import { VStack } from '../VStack';

const radialGradientCss = css`
  background-image: radial-gradient(circle at center, #0052ff, #7b3fe4);
`;

const conicGradientCss = css`
  background-image: conic-gradient(from 0deg, #ff4d4d, #ffaa00, #00cc66, #0052ff, #7b3fe4, #ff4d4d);
`;

const animatedGradientCss = css`
  background-image: linear-gradient(270deg, #0052ff, #7b3fe4, #00cc66, #0052ff);
  background-size: 400% 400%;
  animation: gradientShift 5s ease infinite;

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
  title: 'Components/GradientBox (tsx)',
  component: GradientBox,
};

export const Default = () => {
  const theme = useTheme();

  return (
    <VStack gap={2}>
      {/* Theme Gradient Presets using gradient prop */}
      <ThemeProvider activeColorScheme={theme.activeColorScheme} theme={defaultGradientTheme}>
        <Text as="h2" display="block" font="title3">
          Theme Gradient Presets (gradient)
        </Text>
        <VStack gap={1}>
          {(['primary', 'brand', 'positive', 'negative', 'premium'] as const).map((preset) => (
            <GradientBox key={preset} borderRadius={200} gradient={preset} padding={2}>
              <Text as="p" color="fgInverse" display="block" font="body">
                Preset: {preset}
              </Text>
            </GradientBox>
          ))}
        </VStack>
      </ThemeProvider>

      {/* Custom Linear Gradients (using gradientConfig) */}
      <Text as="h2" display="block" font="title3">
        Custom Linear Gradients (gradientConfig)
      </Text>
      <VStack gap={1}>
        <GradientBox
          borderRadius={200}
          gradientConfig={{
            colors: [theme.color.accentBoldBlue, theme.color.accentBoldPurple],
            angle: 90,
          }}
          padding={2}
        >
          <Text as="p" color="fgInverse" display="block" font="body">
            Horizontal (left to right)
          </Text>
        </GradientBox>
        <GradientBox
          borderRadius={200}
          gradientConfig={{
            colors: [theme.color.bgNegative, theme.color.bgWarning],
            angle: 180,
          }}
          padding={2}
        >
          <Text as="p" color="fgInverse" display="block" font="body">
            Vertical (top to bottom)
          </Text>
        </GradientBox>
        <GradientBox
          borderRadius={200}
          gradientConfig={{
            colors: [theme.color.accentBoldBlue, theme.color.accentBoldPurple],
            angle: 135,
          }}
          padding={2}
        >
          <Text as="p" color="fgInverse" display="block" font="body">
            Diagonal (135°)
          </Text>
        </GradientBox>
        <GradientBox
          borderRadius={200}
          gradientConfig={{
            colors: [theme.color.bgPositive, theme.color.accentBoldBlue],
            angle: 45,
          }}
          padding={2}
        >
          <Text as="p" color="fgInverse" display="block" font="body">
            Custom angle (45°)
          </Text>
        </GradientBox>
      </VStack>

      {/* Multiple Color Stops */}
      <Text as="h2" display="block" font="title3">
        Multiple Color Stops (gradientConfig)
      </Text>
      <VStack gap={1}>
        <GradientBox
          borderRadius={200}
          gradientConfig={{
            colors: [
              theme.color.bgNegative,
              theme.color.bgWarning,
              theme.color.bgPositive,
              theme.color.accentBoldBlue,
            ],
            angle: 90,
          }}
          padding={2}
        >
          <Text as="p" color="fgInverse" display="block" font="body">
            Four color stops
          </Text>
        </GradientBox>
        <GradientBox
          borderRadius={200}
          gradientConfig={{
            colors: [theme.color.accentBoldBlue, theme.color.bgPositive, theme.color.bgWarning],
            stops: [0, 0.7, 1],
            angle: 90,
          }}
          padding={2}
        >
          <Text as="p" color="fgInverse" display="block" font="body">
            Custom stop positions (0%, 70%, 100%)
          </Text>
        </GradientBox>
      </VStack>

      {/* Other Gradient Types (using inline style) */}
      <Text as="h2" display="block" font="title3">
        Other Gradient Types (via style prop)
      </Text>
      <VStack gap={1}>
        <RadialGradientExample />
        <ConicGradientExample />
        <RepeatingGradientExample />
      </VStack>

      {/* Custom Gradients via className */}
      <Text as="h2" display="block" font="title3">
        Custom Gradients (via className)
      </Text>
      <VStack gap={1}>
        <GradientBox borderRadius={200} className={radialGradientCss} height={150} padding={2}>
          <Text as="p" color="fgInverse" display="block" font="body">
            Radial gradient (className)
          </Text>
        </GradientBox>
        <GradientBox
          borderRadius={1000}
          className={conicGradientCss}
          height={150}
          padding={2}
          width={150}
        >
          <Text as="p" color="fgInverse" display="block" font="body">
            Conic (className)
          </Text>
        </GradientBox>
        <GradientBox borderRadius={200} className={animatedGradientCss} height={150} padding={2}>
          <Text as="p" color="fgInverse" display="block" font="body">
            Animated gradient (className)
          </Text>
        </GradientBox>
      </VStack>
    </VStack>
  );
};

function RadialGradientExample() {
  const theme = useTheme();
  const radialGradient = `radial-gradient(circle, ${theme.color.accentBoldBlue}, ${theme.color.accentBoldPurple})`;

  return (
    <GradientBox
      borderRadius={200}
      height={150}
      padding={2}
      style={{ backgroundImage: radialGradient }}
    >
      <Text as="p" color="fgInverse" display="block" font="body">
        Radial gradient
      </Text>
    </GradientBox>
  );
}

function ConicGradientExample() {
  const theme = useTheme();
  const conicGradient = [
    'conic-gradient(from 0deg',
    theme.color.bgNegative,
    theme.color.bgWarning,
    theme.color.bgPositive,
    theme.color.accentBoldBlue,
    theme.color.accentBoldPurple,
    `${theme.color.bgNegative})`,
  ].join(', ');

  return (
    <GradientBox
      borderRadius={1000}
      height={150}
      padding={2}
      style={{ backgroundImage: conicGradient }}
      width={150}
    >
      <Text as="p" color="fgInverse" display="block" font="body">
        Conic
      </Text>
    </GradientBox>
  );
}

function RepeatingGradientExample() {
  const theme = useTheme();
  const blue = theme.color.accentBoldBlue;
  const purple = theme.color.accentBoldPurple;
  const repeatingGradient = `repeating-linear-gradient(45deg, ${blue}, ${blue} 10px, ${purple} 10px, ${purple} 20px)`;

  return (
    <GradientBox
      borderRadius={200}
      height={150}
      padding={2}
      style={{ backgroundImage: repeatingGradient }}
    >
      <Text as="p" color="fgInverse" display="block" font="body">
        Repeating linear gradient
      </Text>
    </GradientBox>
  );
}
