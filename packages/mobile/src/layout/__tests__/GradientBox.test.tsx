import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { LinearGradient as SvgLinearGradient, Svg } from 'react-native-svg';

import { ThemeProvider } from '../../system/ThemeProvider';
import { defaultTheme } from '../../themes/defaultTheme';
import type { GradientBoxProps } from '../GradientBox';
import { GradientBox as GradientBoxComponent } from '../GradientBox';

const GradientBox = (props: GradientBoxProps) => (
  <ThemeProvider activeColorScheme="light" theme={defaultTheme}>
    <GradientBoxComponent {...props} />
  </ThemeProvider>
);

describe('GradientBox', () => {
  it('renders SVG gradient with colors', async () => {
    render(
      <GradientBox colors={['#0052FF', '#7B43D9']} testID="parent">
        <Text>Child</Text>
      </GradientBox>,
    );

    await screen.findByTestId('parent');

    // GradientBox uses react-native-svg's LinearGradient under the hood
    expect(screen.UNSAFE_queryAllByType(Svg)).toHaveLength(1);
  });

  it('renders SVG gradient with custom angle', async () => {
    render(
      <GradientBox angle={90} colors={['#FF6B6B', '#4ECDC4']} testID="parent">
        <Text>Child</Text>
      </GradientBox>,
    );

    await screen.findByTestId('parent');

    expect(screen.UNSAFE_queryAllByType(Svg)).toHaveLength(1);
  });

  it('renders children correctly', async () => {
    render(
      <GradientBox colors={['#0052FF', '#7B43D9']} testID="parent">
        <Text testID="child">Child Content</Text>
      </GradientBox>,
    );

    await screen.findByTestId('parent');
    expect(screen.getByTestId('child')).toBeTruthy();
    expect(screen.getByText('Child Content')).toBeTruthy();
  });

  it('applies Box style props', async () => {
    render(
      <GradientBox
        bordered
        borderRadius={200}
        colors={['#0052FF', '#7B43D9']}
        padding={2}
        testID="parent"
      >
        <Text>Child</Text>
      </GradientBox>,
    );

    await screen.findByTestId('parent');

    expect(screen.getByTestId('parent')).toHaveStyle({
      borderRadius: 8,
      borderWidth: 1,
      padding: 16,
    });
  });

  it('sets overflow hidden for gradient clipping', async () => {
    render(
      <GradientBox colors={['#0052FF', '#7B43D9']} testID="parent">
        <Text>Child</Text>
      </GradientBox>,
    );

    await screen.findByTestId('parent');

    expect(screen.getByTestId('parent')).toHaveStyle({
      overflow: 'hidden',
    });
  });
});
