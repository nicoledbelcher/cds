import TestRenderer from 'react-test-renderer';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { DefaultThemeProvider } from '../../utils/testHelpers';
import { Link, type LinkProps } from '../Link';

const TEST_ID = 'link';
const URL = 'www.coinbase.com';
const variants = [
  'display1',
  'display2',
  'display3',
  'title1',
  'title2',
  'title3',
  'title4',
  'headline',
  'body',
  'label1',
  'label2',
  'caption',
  'legal',
  'inherit',
] as LinkProps['font'][];

describe('Link', () => {
  it('passes a11y', () => {
    render(
      <DefaultThemeProvider>
        <Link font="body" testID={TEST_ID} to="/">
          Child
        </Link>
      </DefaultThemeProvider>,
    );

    expect(screen.getByTestId(TEST_ID)).toBeAccessible();
  });

  it('renders a children text', () => {
    render(
      <DefaultThemeProvider>
        <Link font="body" to="/">
          Child
        </Link>
      </DefaultThemeProvider>,
    );

    expect(screen.getByText('Child')).not.toBeNull();
  });

  it('renders a link', () => {
    render(
      <DefaultThemeProvider>
        <Link testID={TEST_ID} to="/">
          Child
        </Link>
      </DefaultThemeProvider>,
    );

    expect(screen.getByTestId(TEST_ID)).toBeTruthy();
  });

  variants.forEach((variant) => {
    it(`variant prop: "${variant}" works properly and passess a11y`, async () => {
      render(
        <DefaultThemeProvider>
          <Link font={variant} testID={TEST_ID} to="/">
            Child
          </Link>
        </DefaultThemeProvider>,
      );

      expect(screen.getByTestId(TEST_ID)).toBeAccessible();
    });
  });

  it('fires `onPress` when pressed', () => {
    const spy = jest.fn();
    render(
      <DefaultThemeProvider>
        <Link onPress={spy} testID={TEST_ID} to="/">
          Child
        </Link>
      </DefaultThemeProvider>,
    );

    fireEvent.press(screen.getByTestId(TEST_ID));

    expect(spy).toHaveBeenCalled();
  });

  it('to prop works as expected', async () => {
    const linkRenderer = TestRenderer.create(
      <DefaultThemeProvider>
        <Link testID={TEST_ID} to={URL}>
          Child
        </Link>
      </DefaultThemeProvider>,
    );
    const linkInstance = await linkRenderer.root.findByProps({ testID: TEST_ID });
    expect(linkInstance.props.to).toEqual(URL);
  });

  it('can set forceOpenOutsideApp to true', async () => {
    const linkRenderer = TestRenderer.create(
      <DefaultThemeProvider>
        <Link forceOpenOutsideApp testID={TEST_ID} to={URL}>
          Child
        </Link>
      </DefaultThemeProvider>,
    );
    const link = await linkRenderer.root.findByProps({ testID: TEST_ID });
    expect(link.props.forceOpenOutsideApp).toBe(true);
  });

  it('can set readerMode to true', async () => {
    const linkRenderer = TestRenderer.create(
      <DefaultThemeProvider>
        <Link readerMode testID={TEST_ID} to={URL}>
          Child
        </Link>
      </DefaultThemeProvider>,
    );
    const link = await linkRenderer.root.findByProps({ testID: TEST_ID });
    expect(link.props.readerMode).toBe(true);
  });

  it('removes text style when inherited', () => {
    render(
      <DefaultThemeProvider>
        <Link font="inherit" testID={TEST_ID} to={URL}>
          Child
        </Link>
      </DefaultThemeProvider>,
    );

    expect(screen.getByTestId(TEST_ID).props.style[1][1]).toBe(undefined);
  });

  it('inherits by default', () => {
    render(
      <DefaultThemeProvider>
        <Link testID={TEST_ID} to={URL}>
          Child
        </Link>
      </DefaultThemeProvider>,
    );
    expect(screen.getByTestId(TEST_ID).props.style[1][1]).toBe(undefined);
  });

  it('uses solid underline variant by default for backwards compatibility', () => {
    render(
      <DefaultThemeProvider>
        <Link underline testID={TEST_ID} to={URL}>
          Child
        </Link>
      </DefaultThemeProvider>,
    );

    expect(screen.getByText('Child')).toHaveStyle({
      textDecorationLine: 'underline',
    });
  });

  it('renders dotted underline variant line', () => {
    render(
      <DefaultThemeProvider>
        <Link underline underlineVariant="dotted" testID={TEST_ID} to={URL}>
          Child
        </Link>
      </DefaultThemeProvider>,
    );

    fireEvent(screen.getByTestId(TEST_ID), 'textLayout', {
      nativeEvent: {
        lines: [{ height: 14, width: 40, y: 0 }],
      },
    });

    const line = screen.getByTestId(`${TEST_ID}-dotted-underline-line-0`);
    const strokeDasharray = Array.isArray(line.props.strokeDasharray)
      ? line.props.strokeDasharray.map(Number)
      : String(line.props.strokeDasharray)
          .split(',')
          .map((value) => Number(value.trim()));

    expect(strokeDasharray).toEqual([0, 4]);
    expect(['round', 1]).toContain(line.props.strokeLinecap);
    expect(Number(line.props.x1)).toBeGreaterThan(0);
    expect(Number(line.props.x2)).toBeLessThan(40);
  });

  it('fires `onPress` when dotted variant is pressed', () => {
    const spy = jest.fn();
    render(
      <DefaultThemeProvider>
        <Link onPress={spy} underline underlineVariant="dotted" testID={TEST_ID} to="/">
          Child
        </Link>
      </DefaultThemeProvider>,
    );

    fireEvent.press(screen.getByTestId(TEST_ID));

    expect(spy).toHaveBeenCalled();
  });
});
