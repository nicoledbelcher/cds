import { act, render, screen } from '@testing-library/react';
import React, { memo, useState } from 'react';

import type { ComponentsConfig } from '../../core/theme';
import { useComponentConfig } from '../../hooks/useComponentConfig';
import { defaultTheme } from '../../themes/defaultTheme';
import { ComponentConfigProvider } from '../ComponentConfigProvider';
import { ThemeProvider } from '../ThemeProvider';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider activeColorScheme="light" theme={defaultTheme}>
    {children}
  </ThemeProvider>
);

const ButtonSpy = ({ testID, ...props }: Record<string, any>) => {
  const mergedProps = useComponentConfig('Button', props);
  return <div data-testid={testID} data-props={JSON.stringify(mergedProps)} />;
};

const IconButtonSpy = ({ testID, ...props }: Record<string, any>) => {
  const mergedProps = useComponentConfig('IconButton', props);
  return <div data-testid={testID} data-props={JSON.stringify(mergedProps)} />;
};

const getProps = (testID: string) => {
  const el = screen.getByTestId(testID);
  return JSON.parse(el.getAttribute('data-props')!);
};

describe('ComponentConfigProvider', () => {
  it('returns local props unchanged when no provider is present', () => {
    render(
      <Wrapper>
        <ButtonSpy testID="btn" variant="primary" />
      </Wrapper>,
    );
    expect(getProps('btn')).toEqual({ variant: 'primary' });
  });

  it('merges static config with local props', () => {
    const config: ComponentsConfig = {
      Button: { variant: 'secondary', compact: true },
    };
    render(
      <Wrapper>
        <ComponentConfigProvider value={config}>
          <ButtonSpy testID="btn" />
        </ComponentConfigProvider>
      </Wrapper>,
    );
    const props = getProps('btn');
    expect(props.variant).toBe('secondary');
    expect(props.compact).toBe(true);
  });

  it('local props override config defaults', () => {
    const config: ComponentsConfig = {
      Button: { variant: 'secondary', compact: true },
    };
    render(
      <Wrapper>
        <ComponentConfigProvider value={config}>
          <ButtonSpy compact={false} testID="btn" variant="primary" />
        </ComponentConfigProvider>
      </Wrapper>,
    );
    const props = getProps('btn');
    expect(props.variant).toBe('primary');
    expect(props.compact).toBe(false);
  });

  it('supports functional config resolvers', () => {
    const config: ComponentsConfig = {
      Button: (props) => ({
        compact: true,
        borderRadius: props.compact ? 700 : 900,
      }),
    };
    render(
      <Wrapper>
        <ComponentConfigProvider value={config}>
          <ButtonSpy compact testID="btn-compact" />
          <ButtonSpy testID="btn-default" />
        </ComponentConfigProvider>
      </Wrapper>,
    );
    expect(getProps('btn-compact').borderRadius).toBe(700);
    expect(getProps('btn-default').borderRadius).toBe(900);
  });

  it('does not affect unrelated components', () => {
    const config: ComponentsConfig = {
      Button: { variant: 'secondary' },
    };
    render(
      <Wrapper>
        <ComponentConfigProvider value={config}>
          <IconButtonSpy testID="icon-btn" variant="primary" />
        </ComponentConfigProvider>
      </Wrapper>,
    );
    expect(getProps('icon-btn')).toEqual({ variant: 'primary' });
  });

  it('nested providers inherit parent config', () => {
    const parentConfig: ComponentsConfig = {
      Button: { variant: 'secondary' },
    };
    const childConfig: ComponentsConfig = {
      IconButton: { variant: 'secondary' },
    };
    render(
      <Wrapper>
        <ComponentConfigProvider value={parentConfig}>
          <ComponentConfigProvider value={childConfig}>
            <ButtonSpy testID="btn" />
            <IconButtonSpy testID="icon-btn" />
          </ComponentConfigProvider>
        </ComponentConfigProvider>
      </Wrapper>,
    );
    expect(getProps('btn').variant).toBe('secondary');
    expect(getProps('icon-btn').variant).toBe('secondary');
  });

  it('child provider overrides parent config per component', () => {
    const parentConfig: ComponentsConfig = {
      Button: { variant: 'secondary', compact: true },
    };
    const childConfig: ComponentsConfig = {
      Button: { variant: 'positive' },
    };
    render(
      <Wrapper>
        <ComponentConfigProvider value={parentConfig}>
          <ButtonSpy testID="parent-btn" />
          <ComponentConfigProvider value={childConfig}>
            <ButtonSpy testID="child-btn" />
          </ComponentConfigProvider>
        </ComponentConfigProvider>
      </Wrapper>,
    );
    expect(getProps('parent-btn').variant).toBe('secondary');
    expect(getProps('parent-btn').compact).toBe(true);
    expect(getProps('child-btn').variant).toBe('positive');
  });

  it('mergeClassNameAndStyle=true concatenates classNames', () => {
    const config: ComponentsConfig = {
      Button: { className: 'theme-btn' },
    };
    render(
      <Wrapper>
        <ComponentConfigProvider mergeClassNameAndStyle value={config}>
          <ButtonSpy className="local-btn" testID="btn" />
        </ComponentConfigProvider>
      </Wrapper>,
    );
    const props = getProps('btn');
    expect(props.className).toContain('theme-btn');
    expect(props.className).toContain('local-btn');
  });

  it('mergeClassNameAndStyle=false (default) uses local className only', () => {
    const config: ComponentsConfig = {
      Button: { className: 'theme-btn' },
    };
    render(
      <Wrapper>
        <ComponentConfigProvider value={config}>
          <ButtonSpy className="local-btn" testID="btn" />
        </ComponentConfigProvider>
      </Wrapper>,
    );
    expect(getProps('btn').className).toBe('local-btn');
  });

  it('returns local props when provider has undefined value', () => {
    render(
      <Wrapper>
        <ComponentConfigProvider>
          <ButtonSpy testID="btn" variant="primary" />
        </ComponentConfigProvider>
      </Wrapper>,
    );
    expect(getProps('btn')).toEqual({ variant: 'primary' });
  });
});

// =============================================================================
// Re-render isolation tests
// =============================================================================

describe('ComponentConfigProvider re-render isolation', () => {
  it('changing Button config does not re-render an unrelated Modal component', () => {
    let buttonRenderCount = 0;
    let modalRenderCount = 0;

    const ButtonCounter = memo(function ButtonCounter() {
      useComponentConfig('Button', {});
      buttonRenderCount++;
      return <div data-testid="button-counter" />;
    });

    const ModalCounter = memo(function ModalCounter() {
      useComponentConfig('Modal', {});
      modalRenderCount++;
      return <div data-testid="modal-counter" />;
    });

    const buttonConfigA = { variant: 'primary' as const };
    const buttonConfigB = { variant: 'secondary' as const };
    const modalConfig = { visible: true };

    const ConfigSwitcher = () => {
      const [useAltConfig, setUseAltConfig] = useState(false);
      return (
        <ComponentConfigProvider
          value={{
            Button: useAltConfig ? buttonConfigB : buttonConfigA,
            Modal: modalConfig,
          }}
        >
          <ButtonCounter />
          <ModalCounter />
          <button data-testid="toggle" onClick={() => setUseAltConfig(true)} type="button">
            toggle
          </button>
        </ComponentConfigProvider>
      );
    };

    render(
      <Wrapper>
        <ConfigSwitcher />
      </Wrapper>,
    );

    expect(buttonRenderCount).toBe(1);
    expect(modalRenderCount).toBe(1);

    act(() => {
      screen.getByTestId('toggle').click();
    });

    expect(buttonRenderCount).toBe(2);
    expect(modalRenderCount).toBe(1);
  });

  it('changing Button config does not re-render an IconButton component', () => {
    let buttonRenderCount = 0;
    let iconButtonRenderCount = 0;

    const ButtonCounter = memo(function ButtonCounter() {
      useComponentConfig('Button', {});
      buttonRenderCount++;
      return <div />;
    });

    const IconButtonCounter = memo(function IconButtonCounter() {
      useComponentConfig('IconButton', {});
      iconButtonRenderCount++;
      return <div />;
    });

    const buttonConfigA = { variant: 'primary' as const };
    const buttonConfigB = { variant: 'secondary' as const };
    const iconButtonConfig = { variant: 'primary' as const };

    const ConfigSwitcher = () => {
      const [useAltConfig, setUseAltConfig] = useState(false);
      return (
        <ComponentConfigProvider
          value={{
            Button: useAltConfig ? buttonConfigB : buttonConfigA,
            IconButton: iconButtonConfig,
          }}
        >
          <ButtonCounter />
          <IconButtonCounter />
          <button data-testid="toggle" onClick={() => setUseAltConfig(true)} type="button">
            toggle
          </button>
        </ComponentConfigProvider>
      );
    };

    render(
      <Wrapper>
        <ConfigSwitcher />
      </Wrapper>,
    );

    expect(buttonRenderCount).toBe(1);
    expect(iconButtonRenderCount).toBe(1);

    act(() => {
      screen.getByTestId('toggle').click();
    });

    expect(buttonRenderCount).toBe(2);
    expect(iconButtonRenderCount).toBe(1);
  });

  it('components without config are never affected by config changes', () => {
    let textInputRenderCount = 0;

    const TextInputCounter = memo(function TextInputCounter() {
      useComponentConfig('TextInput', {});
      textInputRenderCount++;
      return <div />;
    });

    const buttonConfigA = { variant: 'primary' as const };
    const buttonConfigB = { variant: 'secondary' as const };

    const ConfigSwitcher = () => {
      const [useAltConfig, setUseAltConfig] = useState(false);
      return (
        <ComponentConfigProvider value={{ Button: useAltConfig ? buttonConfigB : buttonConfigA }}>
          <TextInputCounter />
          <button data-testid="toggle" onClick={() => setUseAltConfig(true)} type="button">
            toggle
          </button>
        </ComponentConfigProvider>
      );
    };

    render(
      <Wrapper>
        <ConfigSwitcher />
      </Wrapper>,
    );

    expect(textInputRenderCount).toBe(1);

    act(() => {
      screen.getByTestId('toggle').click();
    });

    expect(textInputRenderCount).toBe(1);
  });
});
