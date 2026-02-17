import { useState } from 'react';
import type { ColorScheme } from '@coinbase/cds-common';
import type { TabValue } from '@coinbase/cds-common/tabs/useTabs';
import { ThemeProvider } from '@coinbase/cds-web';
import { IconButton } from '@coinbase/cds-web/buttons/IconButton';
import type { ComponentsConfig, ThemeConfig } from '@coinbase/cds-web/core/theme';
import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { NavigationBar } from '@coinbase/cds-web/navigation/NavigationBar';
import { ComponentConfigProvider } from '@coinbase/cds-web/system';
import { MediaQueryProvider } from '@coinbase/cds-web/system';
import { SegmentedTabs } from '@coinbase/cds-web/tabs/SegmentedTabs';
import { defaultTheme } from '@coinbase/cds-web/themes/defaultTheme';
import { Text } from '@coinbase/cds-web/typography/Text';

import { StickerSheet } from './components/StickerSheet';
import { advancedTheme } from './themes/advanced';
import { advancedComponents } from './themes/advancedComponents';

type ThemeOption = 'default' | 'advanced';

const themes: Record<ThemeOption, ThemeConfig> = {
  default: defaultTheme,
  advanced: advancedTheme,
};

const themeComponents: Record<ThemeOption, ComponentsConfig | undefined> = {
  default: undefined,
  advanced: advancedComponents,
};

const themeTabs = [
  { id: 'default', label: 'Default' },
  { id: 'advanced', label: 'Advanced' },
];

export const App = () => {
  const [activeColorScheme, setActiveColorScheme] = useState<ColorScheme>('dark');
  const [activeThemeTab, setActiveThemeTab] = useState<TabValue | null>(themeTabs[0]);

  const activeThemeId = (activeThemeTab?.id ?? 'default') as ThemeOption;
  const themeConfig = themes[activeThemeId];
  const components = themeComponents[activeThemeId];

  const toggleColorScheme = () =>
    setActiveColorScheme((scheme) => (scheme === 'dark' ? 'light' : 'dark'));

  return (
    <MediaQueryProvider>
      <ThemeProvider activeColorScheme={activeColorScheme} theme={themeConfig}>
        <ComponentConfigProvider value={components}>
          <VStack background="bg" minHeight="100vh">
            {/* Sticky Navigation Bar */}
            <Box background="bgSecondary" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
              <NavigationBar
                end={
                  <HStack alignItems="center" gap={2}>
                    <SegmentedTabs
                      accessibilityLabel="Switch theme"
                      activeTab={activeThemeTab}
                      onChange={setActiveThemeTab}
                      tabs={themeTabs}
                    />
                    <IconButton
                      accessibilityLabel={`Switch to ${activeColorScheme === 'light' ? 'dark' : 'light'} mode`}
                      name={activeColorScheme === 'light' ? 'light' : 'moon'}
                      onClick={toggleColorScheme}
                    />
                  </HStack>
                }
                start={<Text font="title2">CDS Theme Tester</Text>}
              >
                <Box />
              </NavigationBar>
            </Box>

            {/* Sticker Sheet */}
            <Box display="flex" flexGrow={1} justifyContent="center" overflow="auto" padding={4}>
              <StickerSheet showComponents themeConfig={themeConfig} />
            </Box>
          </VStack>
        </ComponentConfigProvider>
      </ThemeProvider>
    </MediaQueryProvider>
  );
};
