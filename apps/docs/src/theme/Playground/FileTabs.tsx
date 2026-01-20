import React, { memo, useCallback, useMemo } from 'react';
import { useTabsContext } from '@coinbase/cds-common/tabs/TabsContext';
import type { TabValue } from '@coinbase/cds-common/tabs/useTabs';
import { HStack } from '@coinbase/cds-web/layout/HStack';
import { Pressable } from '@coinbase/cds-web/system';
import type { TabsActiveIndicatorProps } from '@coinbase/cds-web/tabs/Tabs';
import { Tabs, TabsActiveIndicator } from '@coinbase/cds-web/tabs/Tabs';
import { Text } from '@coinbase/cds-web/typography/Text';

import type { NormalizedPlaygroundFile } from './types';

type FileTabsProps = {
  files: NormalizedPlaygroundFile[];
  activeFileIndex: number;
  onFileChange: (index: number) => void;
};

const FileTab = ({ id, label }: TabValue) => {
  const { activeTab, updateActiveTab } = useTabsContext();
  const isActive = activeTab?.id === id;

  return (
    <Pressable
      color={isActive ? 'fgPrimary' : 'fg'}
      font="label1"
      onClick={() => updateActiveTab(id)}
      paddingBottom={0.5}
      paddingTop={0.5}
      paddingX={1}
    >
      <Text color={isActive ? 'fgPrimary' : 'fg'} font="label1">
        {label}
      </Text>
    </Pressable>
  );
};

const FileTabsActiveIndicator = (props: TabsActiveIndicatorProps) => {
  return <TabsActiveIndicator {...props} background="bgLine" bottom={0} height={2} />;
};

export const FileTabs = memo(({ files, activeFileIndex, onFileChange }: FileTabsProps) => {
  const tabs = useMemo(
    () =>
      files.map((file, index) => ({
        id: `file-${index}`,
        label: file.displayName,
      })),
    [files],
  );

  const activeTab = useMemo(
    () => (activeFileIndex >= 0 && activeFileIndex < files.length ? tabs[activeFileIndex] : null),
    [activeFileIndex, tabs, files.length],
  );

  const handleChange = useCallback(
    (tab: TabValue | null) => {
      if (!tab) return;
      const index = tabs.findIndex((t) => t.id === tab.id);
      if (index >= 0) {
        // Allow switching to any file, even if read-only
        onFileChange(index);
      }
    },
    [tabs, onFileChange],
  );

  if (files.length <= 1) {
    return null; // Don't show tabs if there's only one file
  }

  return (
    <Tabs
      TabComponent={FileTab}
      TabsActiveIndicatorComponent={FileTabsActiveIndicator}
      activeTab={activeTab}
      gap={1}
      onChange={handleChange}
      tabs={tabs}
      width="100%"
    />
  );
});

FileTabs.displayName = 'FileTabs';
