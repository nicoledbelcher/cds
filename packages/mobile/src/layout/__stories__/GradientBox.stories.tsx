import React from 'react';

import { Example, ExampleScreen } from '../../examples/ExampleScreen';
import { useTheme } from '../../hooks/useTheme';
import { ThemeProvider } from '../../system/ThemeProvider';
import { defaultGradientTheme } from '../../themes/gradients/defaultGradientTheme';
import { Text } from '../../typography/Text';
import { GradientBox } from '../GradientBox';
import { RadialGradientFill } from '../../gradients/RadialGradientFill';

const BasicGradient = () => (
  <Example title="Theme Gradient Presets">
    <GradientBox gradient="brand" padding={2}>
      <Text color="fgInverse" font="body">
        brand gradient
      </Text>
    </GradientBox>

    <GradientBox gradient="primary" padding={2}>
      <Text color="fgInverse" font="body">
        Primary gradient
      </Text>
    </GradientBox>

    <GradientBox gradient="positive" padding={2}>
      <Text color="fgInverse" font="body">
        Positive gradient
      </Text>
    </GradientBox>

    <GradientBox gradient="negative" padding={2}>
      <Text color="fgInverse" font="body">
        Negative gradient
      </Text>
    </GradientBox>

    <GradientBox gradient="premium" padding={2}>
      <Text color="fgInverse" font="body">
        Premium gradient
      </Text>
    </GradientBox>
  </Example>
);

const GradientBoxScreen = () => {
  const theme = useTheme();
  return (
    <ExampleScreen>
      <ThemeProvider activeColorScheme={theme.activeColorScheme} theme={defaultGradientTheme}>
        <BasicGradient />
        <Example title="Custom Directions (gradientConfig)">
          <GradientBox
            gradientConfig={{
              angle: 90,
              colors: [theme.color.bgPrimary, theme.color.bgPositive],
            }}
            padding={2}
          >
            <Text color="fgInverse" font="body">
              Horizontal (90° angle)
            </Text>
          </GradientBox>

          <GradientBox
            gradientConfig={{
              angle: 180,
              colors: [theme.color.bgNegative, theme.color.bgWarning],
            }}
            padding={2}
          >
            <Text color="fgInverse" font="body">
              Vertical (180° angle)
            </Text>
          </GradientBox>

          <GradientBox
            gradientConfig={{
              angle: 135,
              colors: [theme.color.bgPrimary, theme.color.accentBoldPurple],
            }}
            padding={2}
          >
            <Text color="fgInverse" font="body">
              Diagonal (135° angle)
            </Text>
          </GradientBox>

          <GradientBox
            gradientConfig={{
              angle: 45,
              colors: [theme.color.bgPositive, theme.color.bgPrimary],
            }}
            padding={2}
          >
            <Text color="fgInverse" font="body">
              Custom 45° angle
            </Text>
          </GradientBox>
        </Example>

        <Example title="Multiple Color Stops (gradientConfig)">
          <GradientBox
            gradientConfig={{
              angle: 90,
              colors: [
                theme.color.bgNegative,
                theme.color.bgWarning,
                theme.color.bgPositive,
                theme.color.bgPrimary,
              ],
              stops: [0, 0.33, 0.66, 1],
            }}
            padding={2}
          >
            <Text color="fgInverse" font="body">
              Rainbow gradient
            </Text>
          </GradientBox>
        </Example>

        <Example title="With Elevated (gradientConfig)">
          <GradientBox
            elevated
            gradientConfig={{
              colors: [theme.color.transparent, theme.color.bgPrimary],
              stops: [0, 0.6],
            }}
            padding={2}
          >
            <Text color="fg" font="body">
              Elevated gradient
            </Text>
          </GradientBox>
        </Example>

        <Example title="With Box Props (gradientConfig)">
          <GradientBox
            bordered
            borderColor="bgNegative"
            borderWidth={200}
            gradientConfig={{
              colors: [theme.color.bgPrimary, theme.color.accentBoldPurple],
            }}
            padding={3}
          >
            <Text color="fgInverse" font="body">
              With border and elevation
            </Text>
          </GradientBox>
        </Example>

        <Example title="Radial Gradient (gradientNode)">
          <GradientBox
            gradientNode={
              <RadialGradientFill
                colors={[theme.color.bgPrimary, theme.color.accentBoldPurple]}
                cx={0.5}
                cy={0.5}
                r={0.5}
              />
            }
            height={120}
            padding={2}
          >
            <Text color="fgInverse" font="body">
              Default radial gradient
            </Text>
          </GradientBox>

          <GradientBox
            gradientNode={
              <RadialGradientFill colors={[theme.color.bgPositive, theme.color.bgNegative]} />
            }
            height={120}
            padding={2}
          >
            <Text color="fgInverse" font="body">
              Top-left radial gradient
            </Text>
          </GradientBox>

          <GradientBox
            gradientNode={
              <RadialGradientFill
                colors={[
                  theme.color.bgWarning,
                  theme.color.bgPrimary,
                  theme.color.accentBoldPurple,
                ]}
                cx={0.5}
                cy={0.5}
                r={0.7}
                stops={[0, 0.5, 1]}
              />
            }
            height={120}
            padding={2}
          >
            <Text color="fgInverse" font="body">
              Multi-color radial gradient
            </Text>
          </GradientBox>
        </Example>
      </ThemeProvider>
    </ExampleScreen>
  );
};

export default GradientBoxScreen;
