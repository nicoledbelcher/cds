import React, { useCallback, useMemo, useState } from 'react';

import { Example, ExampleScreen } from '../../__stories__/storybook';
import { AvatarButton, Button, IconButton } from '../../buttons';
import { SearchInput } from '../../controls';
import { LogoMark } from '../../icons';
import { HStack, VStack } from '../../layout';
import { TabNavigation } from '../../tabs';
import { NavigationBar } from '../NavigationBar';
import { NavigationTitle } from '../NavigationTitle';
import { NavigationTitleSelect } from '../NavigationTitleSelect';

export default {
  component: NavigationBar,
  title: 'Components/Navigation/NavigationBar',
};

const a11ySkipConfig = {
  config: {
    rules: [{ id: 'aria-valid-attr-value', enabled: false }],
  },
};

const handlePress = (name: string) => console.log(`Pressed ${name}`);

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'tradable', label: 'Tradable' },
  { id: 'gainers', label: 'Gainers' },
  { id: 'losers', label: 'Losers' },
  { id: 'trending', label: 'Trending' },
  { id: 'schill', label: 'Schill' },
];

const NavigationBarFullExampleDefault = () => {
  const [value, setValue] = useState(tabs[0].id);

  const showBackButton = useMemo(() => value !== tabs[0].id, [value]);
  const pageTitle = tabs.find((tab) => tab.id === value)?.label;

  const handleBackPress = useCallback(() => {
    setValue(tabs[0].id);
  }, []);

  const handleTabChange = useCallback((id: string) => {
    setValue(id);
  }, []);

  return (
    <NavigationBar
      bottom={<TabNavigation onChange={handleTabChange} tabs={tabs} value={value} />}
      end={
        <HStack alignItems="center" gap={1}>
          <IconButton name="helpCenterQuestionMark" />
          <IconButton
            active
            accessibilityLabel="Notifications"
            name="bell"
            onClick={() => handlePress('Notifications')}
          />
          <IconButton name="appSwitcher" />
          <IconButton active name="profile" />
        </HStack>
      }
      start={
        showBackButton ? (
          <IconButton
            compact
            accessibilityLabel="Back"
            name="backArrow"
            onClick={handleBackPress}
            variant="secondary"
          />
        ) : undefined
      }
    >
      <NavigationTitle>Personal Portfolio ({pageTitle ?? 'All'})</NavigationTitle>
    </NavigationBar>
  );
};

const NavigationBarMobileExample = () => {
  return (
    <NavigationBar
      end={
        <HStack alignItems="center" gap={1}>
          <IconButton compact name="search" variant="secondary" />
          <IconButton compact name="appSwitcher" variant="secondary" />
          <AvatarButton compact alt="User" name="Sam Smith" />
        </HStack>
      }
      start={<IconButton compact transparent name="hamburger" />}
    >
      <LogoMark size={32} />
    </NavigationBar>
  );
};

const NavigationBarWithSearch = () => {
  return (
    <NavigationBar
      end={
        <HStack gap={2}>
          <HStack flexBasis={0} flexShrink={1}>
            <SearchInput
              compact
              onChangeText={() => {}}
              onSearch={() => {}}
              placeholder="Search"
              value=""
            />
          </HStack>
          <HStack gap={1}>
            <Button compact>Action 1</Button>
            <Button compact variant="secondary">
              Action 2
            </Button>
          </HStack>
          <HStack gap={1}>
            <IconButton active compact name="search" variant="secondary" />
            <IconButton active compact name="appSwitcher" variant="secondary" />
            <AvatarButton compact alt="User" name="Sam Smith" />
          </HStack>
        </HStack>
      }
      start={<IconButton compact name="backArrow" variant="secondary" />}
    >
      <NavigationTitle>Page Title</NavigationTitle>
    </NavigationBar>
  );
};

const NavigationBarWithSelectableTitle = () => {
  const [selectedPage, setSelectedPage] = useState('dashboard');

  const pageOptions = [
    { label: 'Dashboard', id: 'dashboard' },
    { label: 'Analytics', id: 'analytics' },
    { label: 'Portfolio', id: 'portfolio' },
    { label: 'Transactions', id: 'transactions' },
    { label: 'Settings', id: 'settings' },
  ];

  return (
    <NavigationBar
      end={
        <HStack alignItems="center" gap={1}>
          <IconButton active accessibilityLabel="Notifications" name="bell" />
          <AvatarButton compact alt="User" />
        </HStack>
      }
    >
      <NavigationTitleSelect
        accessibilityLabel="Select page"
        onChange={setSelectedPage}
        options={pageOptions}
        value={selectedPage}
      />
    </NavigationBar>
  );
};

const NavigationBarWithActions = () => {
  const handleAction = useCallback((action: string) => {
    console.log(`Action pressed: ${action}`);
  }, []);

  return (
    <NavigationBar
      end={
        <HStack alignItems="center" gap={1}>
          <IconButton
            active
            accessibilityLabel="Search"
            name="magnifyingGlass"
            onClick={() => handleAction('search')}
          />
          <IconButton
            active
            accessibilityLabel="Filter"
            name="filter"
            onClick={() => handleAction('filter')}
          />
          <IconButton
            active
            accessibilityLabel="More options"
            name="more"
            onClick={() => handleAction('more')}
          />
        </HStack>
      }
    >
      <NavigationTitle>Asset Portfolio</NavigationTitle>
    </NavigationBar>
  );
};

const NavigationBarWithCustomPadding = () => {
  return (
    <NavigationBar paddingBottom={4} paddingTop={4} paddingX={6}>
      <NavigationTitle>Extended Padding Example</NavigationTitle>
    </NavigationBar>
  );
};

export const All = () => {
  return (
    <ExampleScreen>
      <Example title="Full Example with Tabs">
        <NavigationBarFullExampleDefault />
      </Example>

      <Example title="Mobile Example">
        <NavigationBarMobileExample />
      </Example>

      <Example title="With Search">
        <NavigationBarWithSearch />
      </Example>

      <Example title="With Selectable Title">
        <NavigationBarWithSelectableTitle />
      </Example>

      <Example title="With Actions">
        <NavigationBarWithActions />
      </Example>

      <Example title="With Custom Padding">
        <NavigationBarWithCustomPadding />
      </Example>
    </ExampleScreen>
  );
};

All.parameters = {
  a11y: a11ySkipConfig,
};
