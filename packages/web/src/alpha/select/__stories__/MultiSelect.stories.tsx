/* stylelint-disable color-named */
import { useState } from 'react';
import { useMultiSelect } from '@coinbase/cds-common/select/useMultiSelect';
import { css } from '@linaria/core';

import { Example } from '../../../__stories__/storybook';
import { Icon } from '../../../icons/Icon';
import { VStack } from '../../../layout/VStack';
import { Pressable } from '../../../system/Pressable';
import { Text } from '../../../typography/Text';
import { Select, type SelectOptionComponent } from '../Select';

export default {
  title: 'Components/Alpha/Select/MultiSelect',
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

const exampleOptionsWithDisabled = [
  { value: null, label: 'Remove selection' },
  { value: '1', label: 'Option 1', disabled: true },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
  { value: '4', label: 'Option 4', disabled: true },
  { value: '5', label: 'Option 5' },
  { value: '6', label: 'Option 6', disabled: true },
  { value: '7', label: 'Option 7', disabled: true },
  { value: '8', label: 'Option 8' },
];

const exampleOptionsWithCustomAccessoriesAndMedia = [
  { value: null, label: 'Remove selection' },
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

const manyExampleOptions = Array.from({ length: 100 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `Option ${i + 1}`,
}));

export const All = () => {
  const multi1 = useMultiSelect({ initialValue: ['1', '2'] });
  const multi2 = useMultiSelect({ initialValue: ['1', '2'] });
  const multi3 = useMultiSelect({ initialValue: ['1', '2', '3', '4'] });
  const multi4 = useMultiSelect({ initialValue: ['1', '3', '7', '8', '9', '10'] });
  const multi5 = useMultiSelect({ initialValue: ['1'] });
  const multi6 = useMultiSelect({ initialValue: ['1'] });
  const multi7 = useMultiSelect({ initialValue: ['1'] });
  const multi8 = useMultiSelect({ initialValue: ['1'] });
  const multi9 = useMultiSelect({ initialValue: ['1', '2', '3', '4', '5', '6', '7', '8'] });
  const multi10 = useMultiSelect({ initialValue: ['1'] });
  const multi11 = useMultiSelect({ initialValue: ['1'] });
  const multi12 = useMultiSelect({ initialValue: manyExampleOptions.map((o) => o.value) });
  const multi13 = useMultiSelect({ initialValue: manyExampleOptions.map((o) => o.value) });
  const multi14 = useMultiSelect({ initialValue: manyExampleOptions.map((o) => o.value) });
  const multi15 = useMultiSelect({ initialValue: ['1'] });
  const multi16 = useMultiSelect({ initialValue: ['1'] });
  const multi17 = useMultiSelect({ initialValue: ['1'] });
  const multi18 = useMultiSelect({ initialValue: ['1'] });
  const multi19 = useMultiSelect({ initialValue: ['3'] });
  const multi20 = useMultiSelect({ initialValue: ['1'] });
  const multi21 = useMultiSelect({ initialValue: [] });
  const multi22 = useMultiSelect({ initialValue: ['1', '2'] });
  const [open, setOpen] = useState(false);

  const CustomSelectAllOption: SelectOptionComponent<'multi'> = ({
    onClick,
    selected,
    disabled,
    label,
    blendStyles,
    className,
    style,
  }) => (
    <Pressable
      noScaleOnPress
      background={selected ? 'bgSecondary' : 'bg'}
      blendStyles={blendStyles}
      className={className}
      disabled={disabled}
      onClick={() => onClick?.('select-all')}
      paddingX={2}
      paddingY={3}
      style={style}
    >
      <Text color={selected ? 'fgPrimary' : 'fg'} font="headline">
        {label || 'Custom Select All Option'}
      </Text>
    </Pressable>
  );

  return (
    <VStack gap={4} padding={2}>
      {/* Basic Multi-Select */}
      <Example title="Default">
        <Select
          controlAccessibilityLabel="Multi select control with selected options"
          label="Multi select"
          onChange={multi1.onChange}
          options={exampleOptions}
          placeholder="Empty value"
          type="multi"
          value={multi1.value}
        />
      </Example>

      <Example title="Compact">
        <Select
          compact
          label="Multi select - compact"
          onChange={multi2.onChange}
          options={exampleOptions}
          placeholder="Empty value"
          type="multi"
          value={multi2.value}
        />
      </Example>

      <Example title="Inside Label Variant">
        <Select
          label="Multi select - inside label variant"
          labelVariant="inside"
          onChange={multi3.onChange}
          options={exampleOptions.slice(0, 5)}
          placeholder="Empty value"
          type="multi"
          value={multi3.value}
        />
      </Example>

      <Example title="Compact Many Selected">
        <Select
          compact
          label="Multi select - compact with many selected"
          onChange={multi4.onChange}
          options={[
            ...exampleOptions,
            { value: '9', label: 'Option 9' },
            { value: '10', label: 'Option 10' },
          ]}
          placeholder="Empty value"
          type="multi"
          value={multi4.value}
        />
      </Example>

      {/* Select All Options */}
      <Example title="Hide Select All">
        <Select
          hideSelectAll
          label="Multi select - hide select all"
          onChange={multi5.onChange}
          options={exampleOptions}
          placeholder="Empty value"
          type="multi"
          value={multi5.value}
        />
      </Example>

      <Example title="Custom Select All Label">
        <Select
          label="Multi select - custom select all label"
          onChange={multi6.onChange}
          options={exampleOptions}
          placeholder="Empty value"
          selectAllLabel="~Custom!~ Select every single option here"
          type="multi"
          value={multi6.value}
        />
      </Example>

      <Example title="Custom Clear All Label">
        <Select
          clearAllLabel="Custom Clear All Label"
          label="Multi select - custom clear all label"
          onChange={multi7.onChange}
          options={exampleOptions}
          placeholder="Empty value"
          type="multi"
          value={multi7.value}
        />
      </Example>

      <Example title="Custom Select All Option Component">
        <Select
          SelectAllOptionComponent={CustomSelectAllOption}
          label="Multi select - custom select all option"
          onChange={multi8.onChange}
          options={exampleOptions}
          placeholder="Empty value"
          type="multi"
          value={multi8.value}
        />
      </Example>

      {/* States */}
      <Example title="Disabled">
        <Select
          disabled
          label="Multi select - disabled"
          onChange={multi10.onChange}
          options={exampleOptions}
          placeholder="Empty value"
          type="multi"
          value={multi10.value}
        />
      </Example>

      <Example title="Disabled Options">
        <Select
          label="Multi select - disabled options"
          onChange={multi9.onChange}
          options={exampleOptionsWithDisabled}
          placeholder="Empty value"
          type="multi"
          value={multi9.value}
        />
      </Example>

      {/* Custom Content */}
      <Example title="Custom Accessory">
        <Select
          accessory={<Icon color="fg" name="star" />}
          label="Multi select - custom accessory"
          onChange={multi11.onChange}
          options={exampleOptions}
          placeholder="Empty value"
          type="multi"
          value={multi11.value}
        />
      </Example>

      <Example title="Custom Media">
        <Select
          label="Multi select - custom media"
          media={<Icon color="fg" name="star" />}
          onChange={multi10.onChange}
          options={exampleOptions}
          placeholder="Empty value"
          type="multi"
          value={multi10.value}
        />
      </Example>

      <Example title="Mixed Unique Accessories and Media">
        <Select
          label="Multi select - mixed unique accessories and media"
          onChange={multi17.onChange}
          options={exampleOptionsWithCustomAccessoriesAndMedia}
          placeholder="Empty value"
          type="multi"
          value={multi17.value}
        />
      </Example>

      {/* Many Options */}
      <Example title="Many Options (100)">
        <Select
          label="Multi select - many options"
          onChange={multi12.onChange}
          options={manyExampleOptions}
          placeholder="Empty value"
          type="multi"
          value={multi12.value}
        />
      </Example>

      <Example title="Max Selected Options to Show (2)">
        <Select
          label="Multi select - max num of selected options to show"
          maxSelectedOptionsToShow={2}
          onChange={multi13.onChange}
          options={manyExampleOptions}
          placeholder="Empty value"
          type="multi"
          value={multi13.value}
        />
      </Example>

      <Example title="Custom Hidden Selected Options Label">
        <Select
          hiddenSelectedOptionsLabel="custom label"
          label="Multi select - custom hidden selected options label"
          maxSelectedOptionsToShow={2}
          onChange={multi14.onChange}
          options={manyExampleOptions}
          placeholder="Empty value"
          type="multi"
          value={multi14.value}
        />
      </Example>

      {/* Descriptions */}
      <Example title="With Descriptions">
        <Select
          label="Multi select - with descriptions"
          onChange={multi15.onChange}
          options={exampleOptionsWithDescription}
          placeholder="Empty value"
          type="multi"
          value={multi15.value}
        />
      </Example>

      <Example title="Descriptions Only">
        <Select
          label="Multi select - with descriptions only"
          onChange={multi16.onChange}
          options={[
            { value: null, label: 'Remove selection' },
            { value: '1', description: 'Description 1' },
            { value: '2', description: 'Description 2' },
            { value: '3', description: 'Description 3' },
            { value: '4', description: 'Description 4' },
          ]}
          placeholder="Empty value"
          type="multi"
          value={multi16.value}
        />
      </Example>

      {/* Combined Features */}
      <Example title="All Combined Features">
        <Select
          helperText="All multi-select features combined"
          label="Multi select - all combined features"
          maxSelectedOptionsToShow={3}
          onChange={multi18.onChange}
          options={exampleOptionsWithCustomAccessoriesAndMedia}
          placeholder="Choose options"
          selectAllLabel="Select all these amazing options"
          startNode={<Icon color="fg" name="filter" />}
          type="multi"
          value={multi18.value}
          variant="positive"
        />
      </Example>

      {/* Edge Cases */}
      <Example title="Edge Case: Empty Labels">
        <Select
          label="Multi select - edge case empty labels"
          onChange={multi19.onChange}
          options={[
            { value: '1', label: '' },
            { value: '2', label: ' ' },
            { value: '3', label: 'Normal Label' },
            { value: '4', label: '\t\n' },
          ]}
          placeholder="Empty value"
          type="multi"
          value={multi19.value}
        />
      </Example>

      {/* Controlled Open */}
      <Example title="Controlled Open">
        <div>
          <button onClick={() => setOpen(!open)} style={{ marginBottom: '10px' }}>
            Toggle Multi-Select: {open ? 'Close' : 'Open'}
          </button>
          <Select
            disableClickOutsideClose
            label="Multi select - controlled open state"
            onChange={multi20.onChange}
            open={open}
            options={exampleOptions}
            placeholder="Empty value"
            setOpen={setOpen}
            type="multi"
            value={multi20.value}
          />
        </div>
      </Example>

      {/* Variants */}
      <Example title="Positive Variant">
        <Select
          helperText="Multi-select with positive variant"
          label="Multi select - positive variant"
          onChange={multi5.onChange}
          options={exampleOptions}
          placeholder="Empty value"
          type="multi"
          value={multi5.value}
          variant="positive"
        />
      </Example>

      <Example title="Negative Variant">
        <Select
          helperText="Multi-select with negative variant"
          label="Multi select - negative variant"
          onChange={multi6.onChange}
          options={exampleOptions}
          placeholder="Empty value"
          type="multi"
          value={multi6.value}
          variant="negative"
        />
      </Example>

      <Example title="Start Node">
        <Select
          label="Multi select - with start node"
          onChange={multi7.onChange}
          options={exampleOptions}
          placeholder="Empty value"
          startNode={<Icon color="fg" name="filter" />}
          type="multi"
          value={multi7.value}
        />
      </Example>

      <Example title="Empty Options">
        <Select
          label="Multi select - empty options"
          onChange={multi21.onChange}
          options={[]}
          placeholder="Empty value"
          type="multi"
          value={multi21.value}
        />
      </Example>

      <Example title="Complex Styles">
        <Select
          classNames={{
            control: paddingCss,
            dropdown: hoveredBackgroundCss,
          }}
          label="Multi select - complex styles"
          onChange={multi22.onChange}
          options={exampleOptions}
          placeholder="Empty value"
          styles={{
            control: { backgroundColor: 'lightblue', border: '2px solid navy' },
            dropdown: { backgroundColor: 'lightyellow', border: '1px solid gold' },
            optionBlendStyles: { background: 'lightcyan', hoveredBackground: 'cyan' },
          }}
          type="multi"
          value={multi22.value}
        />
      </Example>
    </VStack>
  );
};
