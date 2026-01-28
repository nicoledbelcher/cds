/* stylelint-disable color-named */
import { useRef, useState } from 'react';
import { useMultiSelect } from '@coinbase/cds-common/select/useMultiSelect';
import { css } from '@linaria/core';

import { Example, ExampleScreen } from '../../../__stories__/storybook';
import { Button } from '../../../buttons/Button';
import { UpsellCard } from '../../../cards/UpsellCard';
import { TextInput } from '../../../controls';
import { cx } from '../../../cx';
import { Icon } from '../../../icons/Icon';
import { HStack } from '../../../layout/HStack';
import { VStack } from '../../../layout/VStack';
import { Spinner } from '../../../loaders';
import { Text } from '../../../typography/Text';
import {
  Select,
  type SelectControlComponent,
  type SelectOption,
  type SelectOptionComponent,
  type SelectRef,
} from '../Select';

export default {
  title: 'Components/Alpha/Select/SingleSelect',
  component: Select,
};

const paddingCss = css`
  /* stylelint-disable-next-line color-named */
  background-color: pink;
  padding: 20px;
`;

const hoveredBackgroundCss = css`
  &:hover {
    /* stylelint-disable-next-line color-named */
    background-color: lightblue;
  }
`;

const exampleOptions = [
  { value: null, label: 'Remove selection' },
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
  { value: '4', label: 'Option 4' },
  { value: '5', label: 'Option 5' },
  { value: '6', label: 'Option 6' },
  { value: '7', label: 'Option 7' },
  { value: '8', label: 'Option 8' },
  { value: '9', label: 'Option 9' },
];

const exampleOptionsWithDescription = [
  { value: null, label: 'Remove selection' },
  { value: '1', label: 'Option 1', description: 'Description 1' },
  { value: '2', label: 'Option 2', description: 'Description 2' },
  { value: '3', label: 'Option 3', description: 'Description 3' },
  { value: '4', label: 'Option 4', description: 'Description 4' },
  { value: '5', label: 'Option 5', description: 'Description 5' },
  { value: '6', label: 'Option 6', description: 'Description 6' },
  { value: '7', label: 'Option 7', description: 'Description 7' },
  { value: '8', label: 'Option 8', description: 'Description 8' },
];

const exampleOptionsWithCustomAccessoriesAndMedia = [
  {
    value: '1',
    label: 'Option 1',
    accessory: <Icon color="fg" name="star" />,
    media: <Icon color="fg" name="heart" />,
  },
  {
    value: '2',
    label: 'Option 2',
    accessory: <Icon color="fg" name="checkmark" />,
    media: <Icon color="fg" name="cross" />,
  },
  {
    value: '3',
    label: 'Option 3',
    accessory: <Icon color="fg" name="add" />,
    media: <Icon color="fg" name="minus" />,
  },
  {
    value: '4',
    label: 'Option 4',
    accessory: <Icon color="fg" name="caretRight" />,
    media: <Icon color="fg" name="caretLeft" />,
  },
  {
    value: '5',
    label: 'Option 5',
    accessory: <Icon color="fg" name="arrowUp" />,
    media: <Icon color="fg" name="home" />,
  },
];

const longOptions = [
  { value: null, label: 'Remove selection' },
  {
    value: '1',
    label:
      'This is an extremely long option label that should test how the component handles very long text content',
    description:
      'This is an extremely long option description that should test how the component handles very long text content',
  },
  {
    value: '2',
    label:
      'Another super long option label with even more text to see how it wraps or truncates in the UI',
    description:
      'Another super long option description with even more text to see how it wraps or truncates in the UI',
  },
  { value: '3', label: 'Short', description: 'Short description' },
];

/**
 * All basic select variations: default, compact, variants, states, labels
 */
export const All_Basics = () => {
  const [value1, setValue1] = useState<string | null>('1');
  const [value2, setValue2] = useState<string | null>('1');
  const [value3, setValue3] = useState<string | null>('1');
  const [value4, setValue4] = useState<string | null>('1');
  const [value5, setValue5] = useState<string | null>('1');
  const [value6, setValue6] = useState<string | null>('1');
  const [value7, setValue7] = useState<string | null>('1');
  const [value8, setValue8] = useState<string | null>('1');
  const [value9, setValue9] = useState<string | null>('1');
  const [value10, setValue10] = useState<string | null>('1');
  const [value11, setValue11] = useState<string | null>('1');
  const [value12, setValue12] = useState<string | null>(null);
  const [value13, setValue13] = useState<string | null>('1');
  const { value: multiValue, onChange: multiOnChange } = useMultiSelect({
    initialValue: ['1', '2'],
  });

  return (
    <ExampleScreen>
      <Example title="Default">
        <Select
          label="Single select"
          onChange={setValue1}
          options={exampleOptions}
          placeholder="Empty value"
          value={value1}
        />
      </Example>

      <Example title="Compact">
        <Select
          compact
          label="Single select - compact"
          onChange={setValue2}
          options={exampleOptions}
          placeholder="Empty value"
          value={value2}
        />
      </Example>

      <Example title="Label Variant (Inside)">
        <Select
          label="Single select - label variant"
          labelVariant="inside"
          onChange={setValue3}
          options={exampleOptions}
          placeholder="Empty value"
          value={value3}
        />
      </Example>

      <Example title="Helper Text">
        <Select
          helperText="Helper text"
          label="Single select - helper text"
          onChange={setValue4}
          options={exampleOptions}
          placeholder="Empty value"
          value={value4}
        />
      </Example>

      <Example title="Positive Variant">
        <Select
          helperText="Helper text"
          label="Single select - positive variant"
          onChange={setValue5}
          options={exampleOptions}
          placeholder="Empty value"
          value={value5}
          variant="positive"
        />
      </Example>

      <Example title="Negative Variant">
        <Select
          helperText="Helper text"
          label="Single select - negative variant"
          onChange={setValue6}
          options={exampleOptions}
          placeholder="Empty value"
          value={value6}
          variant="negative"
        />
      </Example>

      <Example title="Disabled">
        <Select
          disabled
          label="Single select - disabled"
          onChange={setValue7}
          options={exampleOptionsWithDescription}
          placeholder="Empty value"
          value={value7}
        />
      </Example>

      <Example title="Disabled Options">
        <Select
          label="Single select - disabled options"
          onChange={setValue8}
          options={[
            { value: null, label: 'Remove selection' },
            { value: '1', label: 'Option 1', disabled: true },
            { value: '2', label: 'Option 2' },
            { value: '3', label: 'Option 3' },
            { value: '4', label: 'Option 4', disabled: true },
          ]}
          placeholder="Empty value"
          value={value8}
        />
      </Example>

      <Example title="No Label">
        <Select
          accessibilityLabel="No label. An accessibility label is required."
          onChange={setValue9}
          options={exampleOptions}
          placeholder="Empty value"
          value={value9}
        />
      </Example>

      <Example title="Without Null Option">
        <Select
          label="Single select - no null"
          onChange={setValue10}
          options={exampleOptions.filter((o) => o.value !== null)}
          placeholder="Empty value"
          value={value10}
        />
      </Example>

      <Example title="Compact with Variants">
        <HStack gap={2}>
          <Select
            compact
            helperText="Compact positive"
            label="Compact + Positive"
            onChange={setValue11}
            options={exampleOptions}
            placeholder="Empty value"
            value={value11}
            variant="positive"
          />
          <Select
            compact
            helperText="Compact negative"
            label="Compact + Negative"
            onChange={setValue12}
            options={exampleOptions}
            placeholder="Empty value"
            value={value12}
            variant="negative"
          />
        </HStack>
      </Example>

      <Example title="Borderless">
        <HStack gap={2}>
          <Select
            bordered={false}
            label="Borderless single"
            onChange={setValue13}
            options={exampleOptions}
            placeholder="Empty value"
            value={value13}
          />
          <Select
            bordered={false}
            controlAccessibilityLabel="Borderless multi"
            label="Borderless multi"
            onChange={multiOnChange}
            options={exampleOptions}
            placeholder="Empty value"
            type="multi"
            value={multiValue}
          />
        </HStack>
      </Example>

      <Example title="Example Form">
        <VStack gap={2} width="100%">
          <HStack gap={1}>
            <Select
              label="Single select"
              onChange={setValue1}
              options={exampleOptions}
              placeholder="Empty value"
              style={{ flexGrow: 1 }}
              value={value1}
            />
            <TextInput label="Text input" width="40%" />
          </HStack>
          <HStack gap={1}>
            <Select
              compact
              label="Single select - compact"
              onChange={setValue2}
              options={exampleOptions}
              placeholder="Empty value"
              style={{ flexGrow: 1 }}
              value={value2}
            />
            <TextInput compact label="Text input" width="40%" />
          </HStack>
        </VStack>
      </Example>
    </ExampleScreen>
  );
};

/**
 * All option customization: descriptions, media, accessories, custom components
 */
export const All_Options = () => {
  const [value1, setValue1] = useState<string | null>('1');
  const [value2, setValue2] = useState<string | null>('1');
  const [value3, setValue3] = useState<string | null>('1');
  const [value4, setValue4] = useState<string | null>('1');
  const [value5, setValue5] = useState<string | null>('1');
  const [value6, setValue6] = useState<string | null>('1');
  const [value7, setValue7] = useState<string | null>('1');
  const [value8, setValue8] = useState<string | null>('1');
  const [value9, setValue9] = useState<string | null>('1');
  const [value10, setValue10] = useState<string | null>('1');
  const [value11, setValue11] = useState<string | null>(null);

  const CustomOptionComponent: SelectOptionComponent = ({ value, onClick }) => (
    <HStack justifyContent="center">
      <Spinner size={4} />
      <Button transparent onClick={() => onClick?.(value)} width="80%">
        {value ?? 'Empty value'}
      </Button>
      <Spinner size={4} />
    </HStack>
  );

  return (
    <ExampleScreen>
      <Example title="With Descriptions">
        <Select
          label="Options with descriptions"
          onChange={setValue1}
          options={exampleOptionsWithDescription}
          placeholder="Empty value"
          value={value1}
        />
      </Example>

      <Example title="Only Descriptions">
        <Select
          label="Options with only description"
          onChange={setValue2}
          options={[
            { value: null, label: 'Remove selection' },
            { value: '1', description: 'Description 1' },
            { value: '2', description: 'Description 2' },
            { value: '3', description: 'Description 3' },
          ]}
          placeholder="Empty value"
          value={value2}
        />
      </Example>

      <Example title="Start Node">
        <Select
          label="With start node"
          onChange={setValue3}
          options={exampleOptions}
          placeholder="Empty value"
          startNode={<Icon color="fg" name="search" />}
          value={value3}
        />
      </Example>

      <Example title="Custom End Node">
        <Select
          endNode={<Icon alignItems="center" color="fg" name="search" />}
          label="With end node"
          onChange={setValue4}
          options={exampleOptions}
          placeholder="Empty value"
          value={value4}
        />
      </Example>

      <Example title="Custom Accessory (all options)">
        <Select
          accessory={<Icon color="fg" name="star" />}
          label="Custom accessory"
          onChange={setValue5}
          options={exampleOptions}
          placeholder="Empty value"
          value={value5}
        />
      </Example>

      <Example title="Custom Media (all options)">
        <Select
          label="Custom media"
          media={<Icon color="fg" name="star" />}
          onChange={setValue6}
          options={exampleOptions}
          placeholder="Empty value"
          value={value6}
        />
      </Example>

      <Example title="Unique Accessory and Media per Option">
        <Select
          label="Unique accessory and media"
          onChange={setValue7}
          options={exampleOptionsWithCustomAccessoriesAndMedia}
          placeholder="Empty value"
          value={value7}
        />
      </Example>

      <Example title="Options as React Nodes">
        <Select
          helperText="Options are displayed as react nodes"
          label="React node options"
          onChange={setValue8}
          options={[
            {
              value: '1',
              label: <Text font="title3">Option 1</Text>,
              description: <Text font="title3">Description 1</Text>,
            },
            { value: '2', label: 'Option 2', description: 'Not a react node' },
            {
              value: '3',
              label: <Text font="title4">Option 3</Text>,
              description: <Text font="title4">Description 3</Text>,
            },
          ]}
          placeholder="Empty value"
          value={value8}
        />
      </Example>

      <Example title="Mixed Default and Custom Component Options">
        <Select
          label="Mixed components"
          onChange={setValue9}
          options={[
            { value: null, label: 'Remove selection' },
            { value: '1', label: 'Option 1', Component: CustomOptionComponent },
            { value: '2', label: 'Option 2' },
            { value: '3', label: 'Option 3', Component: CustomOptionComponent },
            { value: '4', label: 'Option 4' },
          ]}
          placeholder="Empty value"
          value={value9}
        />
      </Example>

      <Example title="Very Long Labels">
        <Select
          label="Very long option labels"
          onChange={setValue10}
          options={longOptions}
          placeholder="Empty value"
          value={value10}
        />
      </Example>

      <Example title="Empty Options">
        <Select
          label="Empty options"
          onChange={setValue11}
          options={[]}
          placeholder="No options available"
          value={value11}
        />
      </Example>

      <Example title="Empty Options with Custom Label">
        <Select
          emptyOptionsLabel="Custom label! No choices to choose from"
          label="Empty options with custom label"
          onChange={setValue11}
          options={[]}
          placeholder="No options available"
          value={value11}
        />
      </Example>
    </ExampleScreen>
  );
};

/**
 * All advanced features: controlled state, custom components, styling, accessibility, edge cases
 */
export const All_Advanced = () => {
  const [value1, setValue1] = useState<string | null>('1');
  const [value2, setValue2] = useState<string | null>('1');
  const [value3, setValue3] = useState<string | null>('1');
  const [value4, setValue4] = useState<string | null>('1');
  const [value5, setValue5] = useState<string | null>('3');
  const [value6, setValue6] = useState<string | null>('1');
  const [value7, setValue7] = useState<string | null>('1');
  const selectRef = useRef<SelectRef>(null);

  type TestValue = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
  const typedOptions: SelectOption<TestValue>[] = [
    { value: null, label: 'Remove selection' },
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' },
  ];
  const [typedValue, setTypedValue] = useState<TestValue | null>('1');

  const CustomControlComponent: SelectControlComponent = ({ value, setOpen }) => (
    <Button onClick={() => setOpen(true)}>{value ?? 'Empty value'}</Button>
  );

  const CustomOptionComponent: SelectOptionComponent = ({ value, onClick }) => (
    <HStack justifyContent="center">
      <Spinner size={4} />
      <Button transparent onClick={() => onClick?.(value)} width="80%">
        {value ?? 'Empty value'}
      </Button>
      <Spinner size={4} />
    </HStack>
  );

  return (
    <ExampleScreen>
      <Example title="Accessibility Labels">
        <Select
          accessibilityLabel="Custom dropdown accessibility label"
          controlAccessibilityLabel="Custom control accessibility label"
          label="Accessibility labels"
          onChange={setValue1}
          options={exampleOptions}
          placeholder="Empty value"
          value={value1}
        />
      </Example>

      <Example title="Accessibility Roles">
        <Select
          accessibilityRoles={{ dropdown: 'menu', option: 'menuitem' }}
          label="Accessibility roles"
          onChange={setValue2}
          options={exampleOptions}
          placeholder="Empty value"
          value={value2}
        />
      </Example>

      <Example title="Typed Select">
        <Select
          label="Typed select"
          onChange={setTypedValue}
          options={typedOptions}
          placeholder="Empty value"
          value={typedValue}
        />
      </Example>

      <Example title="Custom Styles">
        <Select
          label="Custom styles"
          onChange={setValue3}
          options={exampleOptions}
          placeholder="Empty value"
          styles={{
            control: { padding: '20px', backgroundColor: 'lightgray' },
            controlBlendStyles: {
              background: 'coral',
              hoveredBackground: 'crimson',
              pressedBackground: 'red',
            },
            optionBlendStyles: { background: 'lightblue', hoveredBackground: 'blue' },
            dropdown: { padding: '20px', backgroundColor: 'pink' },
          }}
          value={value3}
        />
      </Example>

      <Example title="Custom Class Names">
        <Select
          classNames={{
            control: cx(paddingCss, hoveredBackgroundCss),
            option: hoveredBackgroundCss,
          }}
          label="Custom class names"
          onChange={setValue4}
          options={exampleOptions}
          placeholder="Empty value"
          value={value4}
        />
      </Example>

      <Example title="Custom Control Component">
        <Select
          SelectControlComponent={CustomControlComponent}
          label="Custom control component"
          onChange={setValue5}
          options={exampleOptions}
          placeholder="Empty value"
          value={value5}
        />
      </Example>

      <Example title="Custom Option Component">
        <Select
          SelectOptionComponent={CustomOptionComponent}
          label="Custom option component"
          onChange={setValue6}
          options={exampleOptions}
          placeholder="Empty value"
          value={value6}
        />
      </Example>

      <Example title="Ref Imperative Handle">
        <VStack gap={2}>
          <HStack gap={2}>
            <Button onClick={() => selectRef.current?.setOpen?.(true)}>Open</Button>
            <Button onClick={() => selectRef.current?.setOpen?.(false)}>Close</Button>
          </HStack>
          <Select
            ref={selectRef}
            label="Ref imperative handle"
            onChange={setValue7}
            options={exampleOptions}
            placeholder="Empty value"
            value={value7}
          />
        </VStack>
      </Example>

      <Example title="Value Displayed">
        <VStack gap={2}>
          <UpsellCard description={value1 ?? 'Empty value'} title="Your selection" />
          <Select
            label="Value displayed"
            onChange={setValue1}
            options={exampleOptions}
            placeholder="Empty value"
            value={value1}
          />
        </VStack>
      </Example>

      <Example title="Edge Case: Empty Labels">
        <Select
          label="Edge case empty labels"
          onChange={setValue5}
          options={[
            { value: '1', label: '' },
            { value: '2', label: ' ' },
            { value: '3', label: 'Normal Label' },
            { value: '4', label: '\t\n' },
          ]}
          placeholder="Empty value"
          value={value5}
        />
      </Example>

      <Example title="Edge Case: Single Null Only Option">
        <Select
          label="Only null option"
          onChange={setValue5}
          options={[{ value: null, label: 'None' }]}
          placeholder="Empty value"
          value={null}
        />
      </Example>

      <Example title="Stress Test: Many Options with Descriptions">
        <Select
          label="50 options"
          onChange={setValue6}
          options={Array.from({ length: 50 }, (_, i) => ({
            value: (i + 1).toString(),
            label: `Option ${i + 1}`,
            description: `Description for option ${i + 1}`,
            ...(i % 3 === 0 && { disabled: true }),
            ...(i % 5 === 0 && { accessory: <Icon color="fg" name="star" /> }),
          }))}
          placeholder="Choose from many options"
          value={value6}
        />
      </Example>
    </ExampleScreen>
  );
};
