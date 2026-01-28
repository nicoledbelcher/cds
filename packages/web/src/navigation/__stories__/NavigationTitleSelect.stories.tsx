import React, { useState } from 'react';

import { Example, ExampleScreen } from '../../__stories__/storybook';
import { VStack } from '../../layout';
import { Text } from '../../typography/Text';
import { NavigationTitleSelect } from '../NavigationTitleSelect';

export default {
  title: 'Components/Navigation/NavigationTitleSelect',
  component: NavigationTitleSelect,
};

const defaultOptions = [
  { label: 'Dashboard', id: 'dashboard' },
  { label: 'Analytics', id: 'analytics' },
  { label: 'Settings', id: 'settings' },
  { label: 'Profile', id: 'profile' },
];

const manyOptions = [
  { label: 'Dashboard', id: 'dashboard' },
  { label: 'Analytics', id: 'analytics' },
  { label: 'Settings', id: 'settings' },
  { label: 'Profile', id: 'profile' },
  { label: 'Reports', id: 'reports' },
  { label: 'Users', id: 'users' },
  { label: 'Billing', id: 'billing' },
  { label: 'Support', id: 'support' },
  { label: 'Documentation', id: 'documentation' },
  { label: 'API Keys', id: 'api-keys' },
];

const complexOptions = [
  { label: <Text font="headline">🏠 Home</Text>, id: 'home' },
  { label: <Text font="headline">📊 Analytics</Text>, id: 'analytics' },
  { label: <Text font="headline">⚙️ Settings</Text>, id: 'settings' },
  { label: <Text font="headline">👤 Profile</Text>, id: 'profile' },
];

const DefaultExample = () => {
  const [value, setValue] = useState('dashboard');
  return (
    <NavigationTitleSelect
      accessibilityLabel="Select page"
      onChange={setValue}
      options={defaultOptions}
      value={value}
    />
  );
};

const ManyOptionsExample = () => {
  const [value, setValue] = useState('dashboard');
  return (
    <NavigationTitleSelect
      accessibilityLabel="Select page from many options"
      onChange={setValue}
      options={manyOptions}
      value={value}
    />
  );
};

const ComplexLabelsExample = () => {
  const [value, setValue] = useState('home');
  return (
    <NavigationTitleSelect
      accessibilityLabel="Select page with icons"
      onChange={setValue}
      options={complexOptions}
      value={value}
    />
  );
};

const CustomColorExample = () => {
  const [value, setValue] = useState('dashboard');
  return (
    <ExampleScreen>
      <NavigationTitleSelect
        accessibilityLabel="Select page with primary color"
        color="fgPrimary"
        onChange={setValue}
        options={defaultOptions}
        value={value}
      />
      <NavigationTitleSelect
        accessibilityLabel="Select page with muted color"
        color="fgMuted"
        onChange={setValue}
        options={defaultOptions}
        value={value}
      />
    </ExampleScreen>
  );
};

const InteractiveExample = () => {
  const [value, setValue] = useState('dashboard');
  const [selectedOption, setSelectedOption] = useState(defaultOptions[0]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    const option = defaultOptions.find((opt) => opt.id === newValue);
    if (option) {
      setSelectedOption(option);
    }
  };

  return (
    <ExampleScreen>
      <NavigationTitleSelect
        accessibilityLabel="Interactive navigation title"
        onChange={handleChange}
        options={defaultOptions}
        value={value}
      />
      <VStack
        alignItems="center"
        background="bgAlternate"
        borderRadius={300}
        justifyContent="center"
        padding={3}
      >
        <Text as="p" color="fgMuted" display="block" font="caption">
          Selected Option:
        </Text>
        <Text as="p" display="block" font="headline">
          {selectedOption.label} (ID: {selectedOption.id})
        </Text>
      </VStack>
    </ExampleScreen>
  );
};

export const All = () => {
  return (
    <ExampleScreen>
      <Example title="Default">
        <DefaultExample />
      </Example>

      <Example title="With Many Options">
        <ManyOptionsExample />
      </Example>

      <Example title="With Complex Labels">
        <ComplexLabelsExample />
      </Example>

      <Example title="With Custom Color">
        <CustomColorExample />
      </Example>

      <Example title="Interactive">
        <InteractiveExample />
      </Example>
    </ExampleScreen>
  );
};
