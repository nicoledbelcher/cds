import { LinearGradient as Lg, Stop } from 'react-native-svg';
import { render, screen } from '@testing-library/react-native';

import { LinearGradientFill } from '../LinearGradientFill';

describe('LinearGradientFill', () => {
  it('renders nothing when colors is empty', () => {
    const { toJSON } = render(<LinearGradientFill colors={[]} />);
    expect(toJSON()).toBeNull();
  });

  it('renders with two colors using evenly distributed stops', () => {
    render(<LinearGradientFill colors={['#0052FF', '#7B3FE4']} />);
    const stops = screen.UNSAFE_queryAllByType(Stop);
    expect(stops).toHaveLength(2);
    expect(stops[0].props.offset).toBe(0);
    expect(stops[1].props.offset).toBe(1);
  });

  it('renders with three colors using evenly distributed stops when stops are not provided', () => {
    render(<LinearGradientFill colors={['#0052FF', '#7B3FE4', '#FF6B6B']} />);
    const stops = screen.UNSAFE_queryAllByType(Stop);
    expect(stops).toHaveLength(3);
    expect(stops[0].props.offset).toBe(0);
    expect(stops[1].props.offset).toBeCloseTo(0.5);
    expect(stops[2].props.offset).toBe(1);
  });

  it('uses provided stops when length matches colors', () => {
    render(<LinearGradientFill colors={['#0052FF', '#7B3FE4', '#FF6B6B']} stops={[0, 0.3, 1]} />);
    const stops = screen.UNSAFE_queryAllByType(Stop);
    expect(stops[0].props.offset).toBe(0);
    expect(stops[1].props.offset).toBe(0.3);
    expect(stops[2].props.offset).toBe(1);
  });

  it('falls back to evenly distributed stops when stops length mismatches colors', () => {
    render(<LinearGradientFill colors={['#0052FF', '#7B3FE4', '#FF6B6B']} stops={[0, 1]} />);
    const stops = screen.UNSAFE_queryAllByType(Stop);
    expect(stops[0].props.offset).toBe(0);
    expect(stops[1].props.offset).toBeCloseTo(0.5);
    expect(stops[2].props.offset).toBe(1);
  });

  it('renders a vertical gradient by default (angle=180)', () => {
    render(<LinearGradientFill colors={['#0052FF', '#7B3FE4']} />);
    const gradient = screen.UNSAFE_queryAllByType(Lg);
    expect(gradient[0].props.x1).toBe(0.5);
    expect(gradient[0].props.y1).toBe(0);
    expect(gradient[0].props.x2).toBe(0.5);
    expect(gradient[0].props.y2).toBe(1);
  });

  it('renders a horizontal gradient with angle=90', () => {
    render(<LinearGradientFill angle={90} colors={['#0052FF', '#7B3FE4']} />);
    const gradient = screen.UNSAFE_queryAllByType(Lg);
    expect(gradient[0].props.x1).toBe(0);
    expect(gradient[0].props.y1).toBeCloseTo(0.5);
    expect(gradient[0].props.x2).toBe(1);
    expect(gradient[0].props.y2).toBeCloseTo(0.5);
  });

  it('uses explicit start/end coordinates over angle', () => {
    render(
      <LinearGradientFill
        colors={['#0052FF', '#7B3FE4']}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
      />,
    );
    const gradient = screen.UNSAFE_queryAllByType(Lg);
    expect(gradient[0].props.x1).toBe(0);
    expect(gradient[0].props.y1).toBe(0);
    expect(gradient[0].props.x2).toBe(1);
    expect(gradient[0].props.y2).toBe(1);
  });

  it('forwards testID to the wrapper view', () => {
    render(<LinearGradientFill colors={['#0052FF', '#7B3FE4']} testID="linear-gradient" />);
    expect(screen.getByTestId('linear-gradient')).toBeTruthy();
  });
});
