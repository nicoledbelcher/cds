import { RadialGradient as Rg, Stop } from 'react-native-svg';
import { render, screen } from '@testing-library/react-native';

import { RadialGradientFill } from '../RadialGradientFill';

describe('RadialGradientFill', () => {
  it('renders nothing when colors is empty', () => {
    const { toJSON } = render(<RadialGradientFill colors={[]} />);
    expect(toJSON()).toBeNull();
  });

  it('renders with two colors using evenly distributed stops', () => {
    render(<RadialGradientFill colors={['#0052FF', '#7B3FE4']} />);
    const stops = screen.UNSAFE_queryAllByType(Stop);
    expect(stops).toHaveLength(2);
    expect(stops[0].props.offset).toBe(0);
    expect(stops[1].props.offset).toBe(1);
  });

  it('renders with three colors using evenly distributed stops when stops are not provided', () => {
    render(<RadialGradientFill colors={['#0052FF', '#7B3FE4', '#FF6B6B']} />);
    const stops = screen.UNSAFE_queryAllByType(Stop);
    expect(stops).toHaveLength(3);
    expect(stops[0].props.offset).toBe(0);
    expect(stops[1].props.offset).toBeCloseTo(0.5);
    expect(stops[2].props.offset).toBe(1);
  });

  it('uses provided stops when length matches colors', () => {
    render(<RadialGradientFill colors={['#0052FF', '#7B3FE4', '#FF6B6B']} stops={[0, 0.3, 1]} />);
    const stops = screen.UNSAFE_queryAllByType(Stop);
    expect(stops[0].props.offset).toBe(0);
    expect(stops[1].props.offset).toBe(0.3);
    expect(stops[2].props.offset).toBe(1);
  });

  it('falls back to evenly distributed stops when stops length mismatches colors', () => {
    render(<RadialGradientFill colors={['#0052FF', '#7B3FE4', '#FF6B6B']} stops={[0, 1]} />);
    const stops = screen.UNSAFE_queryAllByType(Stop);
    expect(stops[0].props.offset).toBe(0);
    expect(stops[1].props.offset).toBeCloseTo(0.5);
    expect(stops[2].props.offset).toBe(1);
  });

  it('forwards cx, cy, r props to the radial gradient', () => {
    render(<RadialGradientFill colors={['#0052FF', '#7B3FE4']} cx={0.3} cy={0.7} r={0.4} />);
    const gradient = screen.UNSAFE_queryAllByType(Rg);
    expect(gradient[0].props.cx).toBe(0.3);
    expect(gradient[0].props.cy).toBe(0.7);
    expect(gradient[0].props.r).toBe(0.4);
  });

  it('forwards rx, ry for elliptical gradients', () => {
    render(<RadialGradientFill colors={['#0052FF', '#7B3FE4']} rx={0.6} ry={0.3} />);
    const gradient = screen.UNSAFE_queryAllByType(Rg);
    expect(gradient[0].props.rx).toBe(0.6);
    expect(gradient[0].props.ry).toBe(0.3);
  });

  it('forwards fx, fy focal point props', () => {
    render(<RadialGradientFill colors={['#0052FF', '#7B3FE4']} fx={0.2} fy={0.8} />);
    const gradient = screen.UNSAFE_queryAllByType(Rg);
    expect(gradient[0].props.fx).toBe(0.2);
    expect(gradient[0].props.fy).toBe(0.8);
  });

  it('forwards testID to the wrapper view', () => {
    render(<RadialGradientFill colors={['#0052FF', '#7B3FE4']} testID="radial-gradient" />);
    expect(screen.getByTestId('radial-gradient')).toBeTruthy();
  });
});
