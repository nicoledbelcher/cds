import React, { useCallback, useMemo, useRef } from 'react';
import { useTabsContext } from '@coinbase/cds-common/tabs/TabsContext';
import type { TabValue } from '@coinbase/cds-common/tabs/useTabs';
import { useDimensions } from '@coinbase/cds-web/hooks/useDimensions';
import { Box, VStack } from '@coinbase/cds-web/layout';
import { Pressable } from '@coinbase/cds-web/system';
import type { TabsActiveIndicatorProps } from '@coinbase/cds-web/tabs/Tabs';
import { Tabs, TabsActiveIndicator } from '@coinbase/cds-web/tabs/Tabs';
import type { TOCItem } from '@docusaurus/mdx-loader';
import { useHistory, useLocation } from '@docusaurus/router';
import { usePlatformContext } from '@site/src/utils/PlatformContext';

import { PropsTOCUpdater } from '../../../utils/toc/PropsTOCManager';
import { TOCUpdater } from '../../../utils/toc/TOCManager';

const examplesTab = { id: 'examples', label: 'Examples' };
const propsTab = { id: 'props', label: 'Props' };
const stylesTab = { id: 'styles', label: 'Styles API' };

type ComponentMetaContainerProps = {
  webPropsTable?: React.ReactNode;
  mobilePropsTable?: React.ReactNode;
  webExamples?: React.ReactNode;
  mobileExamples?: React.ReactNode;
  webPropsToc?: TOCItem[];
  mobilePropsToc?: TOCItem[];
  webExamplesToc?: TOCItem[];
  mobileExamplesToc?: TOCItem[];
  webStylesTable?: React.ReactNode;
  mobileStylesTable?: React.ReactNode;
};

const CustomTab = ({ id, label }: TabValue) => {
  const { activeTab, updateActiveTab } = useTabsContext();
  const isActive = activeTab?.id === id;
  return (
    <Pressable
      color={isActive ? 'fgPrimary' : 'fg'}
      font="headline"
      onClick={() => updateActiveTab(id)}
      paddingBottom={0.75}
      paddingTop={0.5}
    >
      {label}
    </Pressable>
  );
};

const CustomTabsActiveIndicator = (props: TabsActiveIndicatorProps) => {
  return <TabsActiveIndicator {...props} background="bgPrimary" bottom={0} height={2} />;
};

export const ComponentTabsContainer: React.FC<ComponentMetaContainerProps> = ({
  webExamples,
  mobileExamples,
  webPropsTable,
  mobilePropsTable,
  webExamplesToc,
  mobileExamplesToc,
  webPropsToc,
  mobilePropsToc,
  webStylesTable,
  mobileStylesTable,
}) => {
  const { platform } = usePlatformContext();
  const isWeb = platform === 'web';
  const isMobile = platform === 'mobile';
  const history = useHistory();
  const { search } = useLocation();

  // Dynamically build tabs based on available content
  const availableTabs = useMemo(() => {
    const tabsList = [examplesTab, propsTab];
    // Add styles tab if styles data is provided for the current platform
    if ((isWeb && webStylesTable) || (isMobile && mobileStylesTable)) {
      tabsList.push(stylesTab);
    }
    return tabsList;
  }, [isWeb, isMobile, webStylesTable, mobileStylesTable]);

  const activeTab = useMemo(() => {
    const tabId = new URLSearchParams(search).get('tab');
    return availableTabs.find((tab) => tab.id === tabId) ?? availableTabs[0];
  }, [search, availableTabs]);

  const tabsWrapperRef = useRef<HTMLDivElement>(null);

  useDimensions({
    ref: tabsWrapperRef,
    useBorderBoxSize: true,
    onResize: ({ height }) => {
      document.documentElement.style.setProperty('--tabs-wrapper-height', `${height}px`);
    },
  });

  const setActiveTab = useCallback(
    (tab: TabValue | null) => {
      const searchParams = new URLSearchParams(search);
      searchParams.set('tab', tab?.id ?? availableTabs[0].id);
      history.replace({ search: searchParams.toString() });
    },
    [history, search, availableTabs],
  );

  const shouldRenderExamples = activeTab?.id === examplesTab.id;
  const shouldRenderProps = activeTab?.id === propsTab.id;
  const shouldRenderStyles = activeTab?.id === stylesTab.id;

  return (
    <VStack as="section">
      <VStack
        ref={tabsWrapperRef}
        background="bg"
        id="tabs-container"
        position="sticky"
        top="var(--ifm-navbar-height)"
        zIndex={2}
      >
        <Box
          borderedBottom
          background="bgAlternate"
          borderTopLeftRadius={500}
          borderTopRightRadius={500}
          paddingTop={1}
          paddingX={{ base: 4, phone: 2 }}
        >
          <Tabs
            TabComponent={CustomTab}
            TabsActiveIndicatorComponent={CustomTabsActiveIndicator}
            accessibilityLabel="Component documentation sections"
            activeTab={activeTab}
            aria-controls={`tabpanel--${activeTab}`}
            gap={4}
            onChange={setActiveTab}
            tabs={availableTabs}
          />
        </Box>
      </VStack>
      <VStack
        accessibilityLabelledBy="tab--examples-tab"
        background="bgAlternate"
        borderBottomLeftRadius={500}
        borderBottomRightRadius={500}
        display={shouldRenderExamples ? 'block' : 'none'}
        gap={3}
        id="tabpanel--examples-tab"
        paddingBottom={2}
        paddingTop={{ base: 5, phone: 2 }}
        paddingX={{ base: 4, phone: 2 }}
        role="tabpanel"
      >
        {shouldRenderExamples && <TOCUpdater toc={isWeb ? webExamplesToc : mobileExamplesToc} />}
        {shouldRenderExamples && isWeb && webExamples}
        {shouldRenderExamples && isMobile && mobileExamples}
      </VStack>
      <VStack
        accessibilityLabelledBy="tab--props-tab"
        background="bgAlternate"
        borderBottomLeftRadius={500}
        borderBottomRightRadius={500}
        display={shouldRenderProps ? 'block' : 'none'}
        gap={3}
        id="tabpanel--props-tab"
        role="tabpanel"
      >
        {shouldRenderProps && <PropsTOCUpdater toc={isWeb ? webPropsToc : mobilePropsToc} />}
        {shouldRenderProps && isWeb && webPropsTable}
        {shouldRenderProps && isMobile && mobilePropsTable}
      </VStack>
      <VStack
        accessibilityLabelledBy="tab--styles-tab"
        background="bgAlternate"
        borderBottomLeftRadius={500}
        borderBottomRightRadius={500}
        display={shouldRenderStyles ? 'block' : 'none'}
        gap={3}
        id="tabpanel--styles-tab"
        paddingTop={2}
        role="tabpanel"
      >
        {shouldRenderStyles && isWeb && webStylesTable}
        {shouldRenderStyles && isMobile && mobileStylesTable}
      </VStack>
    </VStack>
  );
};
