import React from 'react';
import type { ColorScheme } from '@coinbase/cds-common/core/theme';
import { css } from '@linaria/core';

import { Button, IconButton } from '../../buttons';
import type { ComponentsConfig, ThemeConfig } from '../../core/theme';
import { useTheme } from '../../hooks/useTheme';
import { Divider } from '../../layout/Divider';
import { HStack } from '../../layout/HStack';
import { VStack } from '../../layout/VStack';
import { defaultTheme } from '../../themes/defaultTheme';
import { Text } from '../../typography/Text';
import { ComponentConfigProvider } from '../ComponentConfigProvider';
import { ThemeProvider, useThemeProviderStyles } from '../ThemeProvider';

const Child = ({ expectedColorScheme }: { expectedColorScheme: ColorScheme }) => {
  const theme = useTheme();
  return (
    <VStack background="bg">
      <VStack gap={3} padding={1}>
        <VStack>
          <Button variant="secondary">Secondary button</Button>
          <Button variant="primary">Primary button</Button>
          <Text as="p" color="bgSecondary" display="block" font="body">
            Secondary text
          </Text>
        </VStack>
        <VStack bordered borderRadius={400} elevation={1} gap={1} padding={2}>
          <Text as="p" display="block" font="body">
            Elevation 1
          </Text>
          <Button variant="secondary">Secondary button</Button>
          <Button variant="primary">Primary button</Button>
        </VStack>
        <VStack bordered borderRadius={400} elevation={2} gap={1} padding={2}>
          <Text as="p" display="block" font="body">
            Elevation 2
          </Text>
          <Button variant="secondary">Secondary button</Button>
          <Button variant="primary">Primary button</Button>
        </VStack>
        <Text as="p" display="block" font="body">
          ClassName value at nested ThemeProvider parent level: {theme.activeColorScheme}
        </Text>
        <Text as="p" display="block" font="body">
          Should be {expectedColorScheme}
        </Text>
      </VStack>
    </VStack>
  );
};

const StyledThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const theme = useTheme();
  const style = useThemeProviderStyles(theme);
  return <div style={style}>{children}</div>;
};

const ChildThemeProviderDark = () => {
  const theme = useTheme();
  return (
    <ThemeProvider activeColorScheme="dark" theme={theme}>
      <StyledThemeProvider>
        <Child expectedColorScheme="dark" />
      </StyledThemeProvider>
    </ThemeProvider>
  );
};

const customTheme: ThemeConfig = {
  ...defaultTheme,
  lightColor: {
    ...defaultTheme.lightColor,
    bg: `rgb(${defaultTheme.lightSpectrum.orange50})`,
    bgPrimary: `rgb(${defaultTheme.lightSpectrum.red20})`,
    bgSecondary: `rgb(${defaultTheme.lightSpectrum.blue50})`,
  },
  darkColor: {
    ...defaultTheme.darkColor,
    bg: `rgb(${defaultTheme.darkSpectrum.orange50})`,
    bgPrimary: `rgb(${defaultTheme.darkSpectrum.red20})`,
    bgSecondary: `rgb(${defaultTheme.darkSpectrum.blue50})`,
  },
};

const ChildThemeWithOverrides = () => {
  const theme = useTheme();
  return (
    <ThemeProvider activeColorScheme={theme.activeColorScheme} theme={customTheme}>
      <Text as="p" display="block" font="body">
        With theme overrides
      </Text>
      <Child expectedColorScheme="light" />
    </ThemeProvider>
  );
};

const ChildThemeWithOverridesDark = () => {
  return (
    <ThemeProvider activeColorScheme="dark" theme={customTheme}>
      <Text as="p" display="block" font="body">
        With theme overrides
      </Text>
      <Child expectedColorScheme="dark" />
    </ThemeProvider>
  );
};

const ChildThemeWithNestedOverrides = () => {
  const theme = useTheme();
  return (
    <ThemeProvider activeColorScheme={theme.activeColorScheme} theme={customTheme}>
      <ThemeProvider activeColorScheme="light" theme={theme}>
        <Text as="p" display="block" font="body">
          With nested theme overrides
        </Text>
        <Child expectedColorScheme="light" />
      </ThemeProvider>
    </ThemeProvider>
  );
};

const ChildThemeWithNestedOverridesDark = () => {
  const theme = useTheme();
  return (
    <ThemeProvider activeColorScheme="dark" theme={customTheme}>
      <ThemeProvider activeColorScheme="dark" theme={theme}>
        <Text as="p" display="block" font="body">
          With nested theme overrides
        </Text>
        <Child expectedColorScheme="dark" />
      </ThemeProvider>
    </ThemeProvider>
  );
};

export const ThemeProviderTest = () => {
  const theme = useTheme();
  return (
    <ThemeProvider activeColorScheme="light" theme={theme}>
      <VStack gap={3}>
        <Child expectedColorScheme="light" />
        <ChildThemeProviderDark />
        <ChildThemeWithOverrides />
        <ChildThemeWithOverridesDark />
        <ChildThemeWithNestedOverrides />
        <ChildThemeWithNestedOverridesDark />
      </VStack>
    </ThemeProvider>
  );
};

// ============================================================================
// Components Config Examples
// ============================================================================

/**
 * Simple ThemeProvider with component configuration.
 * All Buttons and IconButtons will use the configured defaults.
 */
const SimpleComponentsConfig = () => {
  const { activeColorScheme } = useTheme();
  const componentsConfig: ComponentsConfig = {
    Button: {
      variant: 'secondary',
      compact: true,
    },
  };

  return (
    <ThemeProvider activeColorScheme={activeColorScheme} theme={defaultTheme}>
      <ComponentConfigProvider value={componentsConfig}>
        <VStack gap={{ base: 2, tablet: 3 }} padding={{ base: 2, tablet: 4 }}>
          <Text as="h3" display="block" font="title2">
            Simple Components Config
          </Text>
          <Text as="p" color="fgMuted" display="block" font="body">
            All buttons inherit: variant=&quot;secondary&quot;, compact=true
          </Text>

          <HStack flexWrap="wrap" gap={2}>
            <Button>Button 1</Button>
            <Button>Button 2</Button>
            <Button>Button 3</Button>
          </HStack>
        </VStack>
      </ComponentConfigProvider>
    </ThemeProvider>
  );
};

/**
 * Component configuration with local prop overrides.
 * Local props take precedence over ThemeProvider configuration.
 */
const ComponentsConfigWithLocalOverrides = () => {
  const { activeColorScheme } = useTheme();
  const componentsConfig: ComponentsConfig = {
    Button: {
      variant: 'secondary',
      compact: true,
    },
  };

  return (
    <ThemeProvider activeColorScheme={activeColorScheme} theme={defaultTheme}>
      <ComponentConfigProvider value={componentsConfig}>
        <VStack gap={{ base: 2, tablet: 3 }} padding={{ base: 2, tablet: 4 }}>
          <Text as="h3" display="block" font="title2">
            Components Config with Local Overrides
          </Text>
          <Text as="p" color="fgMuted" display="block" font="body">
            Theme provides defaults, but local props override them
          </Text>

          <VStack gap={2}>
            <Text as="p" display="block" font="label1">
              Buttons (theme: secondary/compact, local overrides)
            </Text>
            <HStack flexWrap="wrap" gap={2}>
              <Button>Themed Default</Button>
              <Button variant="primary">Local Primary</Button>
              <Button compact={false}>Local Not Compact</Button>
            </HStack>
          </VStack>
        </VStack>
      </ComponentConfigProvider>
    </ThemeProvider>
  );
};

/**
 * Nested ThemeProviders with component configuration.
 * Child ThemeProvider merges with parent configuration.
 */
const NestedComponentsConfig = () => {
  const { activeColorScheme } = useTheme();
  const parentConfig: ComponentsConfig = {
    Button: {
      variant: 'secondary',
    },
  };

  const childConfig: ComponentsConfig = {
    IconButton: {
      variant: 'secondary',
    },
  };

  return (
    <ThemeProvider activeColorScheme={activeColorScheme} theme={defaultTheme}>
      <ComponentConfigProvider value={parentConfig}>
        <VStack gap={{ base: 2, tablet: 4 }} padding={{ base: 2, tablet: 4 }}>
          <Text as="h3" display="block" font="title2">
            Nested Components Config
          </Text>

          <VStack gap={2}>
            <Text as="p" display="block" font="label1">
              Parent Level (variant: secondary)
            </Text>
            <HStack flexWrap="wrap" gap={2}>
              <Button>Parent Button 1</Button>
              <Button>Parent Button 2</Button>
            </HStack>
          </VStack>

          <ComponentConfigProvider value={childConfig}>
            <VStack
              gap={2}
              padding={{ base: 2, tablet: 3 }}
              style={{ border: '2px dashed var(--color-bgPositive)' }}
            >
              <Text as="p" display="block" font="label1">
                Child Level (inherits Button global config + adds IconButton config - variant:
                secondary)
              </Text>
              <HStack flexWrap="wrap" gap={2}>
                <Button>Child Button 1</Button>
                <Button>Child Button 2</Button>
                <IconButton name="settings" />
                <IconButton name="info" />
              </HStack>
            </VStack>
          </ComponentConfigProvider>
        </VStack>
      </ComponentConfigProvider>
    </ThemeProvider>
  );
};

/**
 * Complex nested ThemeProviders with multiple override levels.
 * Demonstrates deep nesting and configuration inheritance.
 */
const ComplexNestedComponentsConfig = () => {
  const { activeColorScheme } = useTheme();
  const level1Config: ComponentsConfig = {
    Button: {
      variant: 'primary',
      style: {
        borderColor: 'red',
      },
    },
  };

  const level2Config: ComponentsConfig = {
    Button: {
      variant: 'secondary',
      compact: true,
      style: {
        borderColor: 'green',
      },
    },
  };

  const level3Config: ComponentsConfig = {
    Button: {
      transparent: true,
      variant: 'positive',
      style: {
        borderColor: 'blue',
      },
    },
  };

  return (
    <ThemeProvider activeColorScheme={activeColorScheme} theme={defaultTheme}>
      <ComponentConfigProvider value={level1Config}>
        <VStack gap={{ base: 2, tablet: 4 }} padding={{ base: 2, tablet: 4 }}>
          <Text as="h3" display="block" font="title2">
            Complex Nested Components Config
          </Text>

          <VStack gap={2}>
            <Text as="p" display="block" font="label1">
              Level 1: variant=&quot;primary&quot;, borderColor=&quot;red&quot;
            </Text>
            <HStack flexWrap="wrap" gap={2}>
              <Button>Level 1 Button</Button>
            </HStack>
          </VStack>

          <ComponentConfigProvider value={level2Config}>
            <VStack
              gap={2}
              padding={{ base: 2, tablet: 3 }}
              style={{ border: '2px dashed var(--color-bgPositive)' }}
            >
              <Text as="p" display="block" font="label1">
                Level 2: variant=&quot;secondary&quot;, compact=true, borderColor=&quot;green&quot;
              </Text>
              <HStack flexWrap="wrap" gap={2}>
                <Button>Level 2 Button</Button>
              </HStack>

              <ComponentConfigProvider value={level3Config}>
                <VStack
                  gap={2}
                  padding={{ base: 2, tablet: 3 }}
                  style={{ border: '2px dashed var(--color-bgPrimary)' }}
                >
                  <Text as="p" display="block" font="label1">
                    Level 3: adds transparent=true, variant=positive, borderColor=&quot;blue&quot;
                  </Text>
                  <HStack flexWrap="wrap" gap={2}>
                    <Button>Level 3 Button</Button>
                  </HStack>
                </VStack>
              </ComponentConfigProvider>
            </VStack>
          </ComponentConfigProvider>
        </VStack>
      </ComponentConfigProvider>
    </ThemeProvider>
  );
};

/**
 * Nested ThemeProviders with selective component overrides.
 * Some nested providers have config, others don't.
 */
const NestedWithSelectiveOverrides = () => {
  const { activeColorScheme } = useTheme();
  const parentConfig: ComponentsConfig = {
    Button: {
      variant: 'primary',
      compact: true,
    },
  };

  const childOverrideConfig: ComponentsConfig = {
    Button: {
      variant: 'secondary',
    },
  };

  return (
    <ThemeProvider activeColorScheme={activeColorScheme} theme={defaultTheme}>
      <ComponentConfigProvider value={parentConfig}>
        <VStack gap={{ base: 2, tablet: 4 }} padding={{ base: 2, tablet: 4 }}>
          <Text as="h3" display="block" font="title2">
            Nested with Selective Overrides
          </Text>

          <VStack gap={2}>
            <Text as="p" display="block" font="label1">
              Parent: primary + compact
            </Text>
            <HStack flexWrap="wrap" gap={2}>
              <Button>Parent Button</Button>
            </HStack>
          </VStack>

          <VStack
            gap={2}
            padding={{ base: 2, tablet: 3 }}
            style={{ border: '2px dashed var(--color-bgPositive)' }}
          >
            <Text as="p" display="block" font="label1">
              Child 1: No config override (inherits parent)
            </Text>
            <HStack flexWrap="wrap" gap={2}>
              <Button>Child 1 Button</Button>
            </HStack>
          </VStack>

          <ComponentConfigProvider value={childOverrideConfig}>
            <VStack
              gap={2}
              padding={{ base: 2, tablet: 3 }}
              style={{ border: '2px dashed var(--color-bgPositive)' }}
            >
              <Text as="p" display="block" font="label1">
                Child 2: Overrides Button config totally (variant: secondary)
              </Text>
              <HStack flexWrap="wrap" gap={2}>
                <Button>Child 2 Button</Button>
              </HStack>
            </VStack>
          </ComponentConfigProvider>
        </VStack>
      </ComponentConfigProvider>
    </ThemeProvider>
  );
};

/**
 * Comprehensive example combining component config with local overrides
 * and nested providers.
 */
const ComprehensiveExample = () => {
  const { activeColorScheme } = useTheme();
  const globalConfig: ComponentsConfig = {
    Button: {
      variant: 'secondary',
    },
  };

  const sectionConfig: ComponentsConfig = {
    Button: {
      compact: true,
    },
  };

  return (
    <ThemeProvider activeColorScheme={activeColorScheme} theme={defaultTheme}>
      <ComponentConfigProvider value={globalConfig}>
        <VStack gap={{ base: 2, tablet: 4 }} padding={{ base: 2, tablet: 4 }}>
          <Text as="h3" display="block" font="title2">
            Comprehensive Example
          </Text>
          <Text as="p" color="fgMuted" display="block" font="body">
            Demonstrates global config, nested overrides, and local prop overrides
          </Text>

          <VStack gap={2}>
            <Text as="p" display="block" font="label1">
              Global Level: All buttons are secondary variant
            </Text>
            <HStack flexWrap="wrap" gap={2}>
              <Button>Global Default</Button>
              <Button variant="primary">Local Override to Primary</Button>
            </HStack>
          </VStack>

          <ComponentConfigProvider value={sectionConfig}>
            <VStack
              gap={{ base: 2, tablet: 3 }}
              padding={{ base: 2, tablet: 3 }}
              style={{ border: '2px dashed var(--color-bgPositive)' }}
            >
              <Text as="p" display="block" font="label1">
                Section Level: sets Button global config to compact=true
              </Text>
              <HStack flexWrap="wrap" gap={2}>
                <Button>Section Default (compact)</Button>
                <Button variant="positive">Local Positive (still compact)</Button>
                <Button compact={false}>Local Not Compact</Button>
              </HStack>
            </VStack>
          </ComponentConfigProvider>
        </VStack>
      </ComponentConfigProvider>
    </ThemeProvider>
  );
};

/**
 * Example demonstrating mergeClassNameAndStyle feature.
 * When enabled, className and styles are merged instead of being overridden.
 */
const themeButtonCss = css`
  background-color: var(--color-bgWarning);
  padding: 0;
`;
const localButtonCss = css`
  background-color: var(--color-bgTertiary);
  border-radius: 0;
`;

const StyleConfigurationDetails = () => (
  <>
    <Text as="p" display="block" font="label1">
      Theme:
      <Text as="p" display="block" font="inherit">
        - className:{' '}
        <Text mono font="label2">
          background-color: var(--color-bgWarning); padding: 0;
        </Text>
      </Text>
      <Text as="p" display="block" font="inherit">
        - style:{' '}
        <Text mono font="label2">
          borderColor: var(--color-bgPositive); color: var(--color-bgPositive); border-style:
          dashed;
        </Text>
      </Text>
    </Text>
    <Text as="p" display="block" font="label1">
      Local:
      <Text as="p" display="block" font="inherit">
        - className:{' '}
        <Text mono font="label2">
          background-color: var(--color-bgTertiary); border-radius: 0;
        </Text>
      </Text>
      <Text as="p" display="block" font="inherit">
        - style:{' '}
        <Text mono font="label2">
          borderColor: var(--color-bgNegative); color: var(--color-bgNegative);
        </Text>
      </Text>
    </Text>
  </>
);
const MergeClassNameAndStyleExample = () => {
  const { activeColorScheme } = useTheme();
  // Config without merging (default behavior)
  const configWithoutMerge: ComponentsConfig = {
    Button: {
      className: themeButtonCss,
      style: {
        borderColor: 'var(--color-bgPositive)',
        color: 'var(--color-fgPositive)',
        borderStyle: 'dashed',
      },
    },
  };

  // Config with merging enabled (same config, but mergeClassNameAndStyle is set on the provider)
  const configWithMerge: ComponentsConfig = {
    ...configWithoutMerge,
  };

  return (
    <VStack gap={{ base: 3, tablet: 4 }} padding={{ base: 2, tablet: 4 }}>
      <Text as="h3" display="block" font="title2">
        mergeClassNameAndStyle Feature
      </Text>
      <Text as="p" color="fgMuted" display="block" font="body">
        Demonstrates how className and styles are handled with merging enabled vs disabled
      </Text>

      {/* Without merging (default) */}
      <ThemeProvider activeColorScheme={activeColorScheme} theme={defaultTheme}>
        <ComponentConfigProvider value={configWithoutMerge}>
          <VStack
            gap={2}
            padding={{ base: 2, tablet: 3 }}
            style={{ border: '2px solid var(--color-bgLine)' }}
          >
            <Text as="p" display="block" font="label1">
              Without Merging (default: mergeClassNameAndStyle=false)
            </Text>
            <Text as="p" color="fgMuted" display="block" font="label1">
              Local className and style completely override theme values
            </Text>

            <VStack gap={1}>
              <StyleConfigurationDetails />
              <HStack flexWrap="wrap" gap={2}>
                <Button>Theme Only</Button>
                <Button className={localButtonCss}>Local className (overrides theme)</Button>
                <Button
                  style={{
                    borderColor: 'var(--color-bgNegative)',
                    color: 'var(--color-bgNegative)',
                  }}
                >
                  Local style (overrides theme)
                </Button>
                <Button
                  className={localButtonCss}
                  style={{
                    borderColor: 'var(--color-bgNegative)',
                    color: 'var(--color-bgNegative)',
                  }}
                >
                  Both (both override)
                </Button>
              </HStack>
            </VStack>
          </VStack>
        </ComponentConfigProvider>
      </ThemeProvider>

      {/* With merging enabled */}
      <ThemeProvider activeColorScheme={activeColorScheme} theme={defaultTheme}>
        <ComponentConfigProvider mergeClassNameAndStyle value={configWithMerge}>
          <VStack
            gap={2}
            padding={{ base: 2, tablet: 3 }}
            style={{ border: '2px solid var(--color-bgPositive)' }}
          >
            <Text as="p" display="block" font="label1">
              With Merging (mergeClassNameAndStyle=true)
            </Text>
            <Text as="p" color="fgMuted" display="block" font="label1">
              Local className concatenated with theme, local style merged with theme
            </Text>

            <VStack gap={1}>
              <StyleConfigurationDetails />
              <HStack flexWrap="wrap" gap={2}>
                <Button>Theme Only</Button>
                <Button className={localButtonCss}>Local className (concatenated)</Button>
                <Button
                  style={{
                    borderColor: 'var(--color-bgNegative)',
                    color: 'var(--color-bgNegative)',
                  }}
                >
                  Local style (merged)
                </Button>
                <Button
                  className={localButtonCss}
                  style={{
                    borderColor: 'var(--color-bgNegative)',
                    color: 'var(--color-bgNegative)',
                  }}
                >
                  Both (className concatenated, style merged)
                </Button>
              </HStack>
            </VStack>
          </VStack>
        </ComponentConfigProvider>
      </ThemeProvider>
    </VStack>
  );
};

export const ThemeProviderWithComponentsConfig = () => {
  return (
    <VStack gap={{ base: 1, tablet: 2 }}>
      <SimpleComponentsConfig />
      <Divider />
      <ComponentsConfigWithLocalOverrides />
      <Divider />
      <NestedComponentsConfig />
      <Divider />
      <ComplexNestedComponentsConfig />
      <Divider />
      <NestedWithSelectiveOverrides />
      <Divider />
      <ComprehensiveExample />
      <Divider />
      <MergeClassNameAndStyleExample />
      <Divider />
    </VStack>
  );
};

ThemeProviderTest.parameters = {
  a11y: {
    config: {
      /**
       * Color contrast ratio doesn't need to meet 4.5:1, as these are test examples for color override
       * @link https://dequeuniversity.com/rules/axe/4.3/color-contrast
       */
      rules: [{ id: 'color-contrast', enabled: false }],
    },
  },
};

export default {
  title: 'Components/ThemeProvider',
};
