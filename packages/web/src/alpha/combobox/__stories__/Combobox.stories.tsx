import { useRef, useState } from 'react';
import { useMultiSelect } from '@coinbase/cds-common/select/useMultiSelect';
import { css } from '@linaria/core';

import { Example } from '../../../__stories__/storybook';
import { Button } from '../../../buttons/Button';
import { Icon } from '../../../icons/Icon';
import { HStack } from '../../../layout/HStack';
import { VStack } from '../../../layout/VStack';
import { Text } from '../../../typography/Text';
import type { SelectOptionList } from '../../select';
import type { SelectOption } from '../../select/Select';
import {
  Combobox,
  type ComboboxControlComponent,
  type ComboboxRef,
  DefaultComboboxControl,
} from '../';

export default {
  title: 'Components/Alpha/Combobox',
  component: Combobox,
};

const fruitOptions: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
  { value: 'elderberry', label: 'Elderberry' },
  { value: 'fig', label: 'Fig' },
  { value: 'grape', label: 'Grape' },
  { value: 'honeydew', label: 'Honeydew' },
  { value: 'kiwi', label: 'Kiwi' },
  { value: 'lemon', label: 'Lemon' },
  { value: 'mango', label: 'Mango' },
  { value: 'orange', label: 'Orange' },
  { value: 'papaya', label: 'Papaya' },
  { value: 'raspberry', label: 'Raspberry' },
  { value: 'strawberry', label: 'Strawberry' },
];

const singleFruitOptions: SelectOption[] = [
  { value: null, label: 'Remove selection' },
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
  { value: 'elderberry', label: 'Elderberry' },
  { value: 'fig', label: 'Fig' },
];

const longLabelOptions: SelectOption[] = [
  {
    value: 'apple',
    label:
      'Apple is a very long label that should test how the component handles extensive label content',
  },
  {
    value: 'banana',
    label:
      'Banana is a very long label that should test how the component handles extensive label content',
  },
  {
    value: 'cherry',
    label:
      'Cherry is a very long label that should test how the component handles extensive label content',
  },
];

const countryOptions: SelectOption[] = [
  { value: 'us', label: 'United States', description: 'North America' },
  { value: 'ca', label: 'Canada', description: 'North America' },
  { value: 'mx', label: 'Mexico', description: 'North America' },
  { value: 'uk', label: 'United Kingdom', description: 'Europe' },
  { value: 'fr', label: 'France', description: 'Europe' },
  { value: 'de', label: 'Germany', description: 'Europe' },
  { value: 'jp', label: 'Japan', description: 'Asia' },
  { value: 'cn', label: 'China', description: 'Asia' },
  { value: 'in', label: 'India', description: 'Asia' },
  { value: 'br', label: 'Brazil', description: 'South America' },
  { value: 'ar', label: 'Argentina', description: 'South America' },
  { value: 'au', label: 'Australia', description: 'Oceania' },
];

const cryptoOptions: SelectOption[] = [
  { value: 'btc', label: 'Bitcoin', description: 'BTC • Digital Gold' },
  { value: 'eth', label: 'Ethereum', description: 'ETH • Smart Contracts' },
  { value: 'usdc', label: 'USD Coin', description: 'USDC • Stablecoin' },
  { value: 'usdt', label: 'Tether', description: 'USDT • Stablecoin' },
  { value: 'bnb', label: 'BNB', description: 'BNB • Exchange Token' },
  { value: 'xrp', label: 'XRP', description: 'XRP • Payments' },
];

const teamOptions: SelectOption[] = [
  { value: 'john', label: 'John Smith', description: 'Engineering' },
  { value: 'jane', label: 'Jane Doe', description: 'Design' },
  { value: 'bob', label: 'Bob Johnson', description: 'Product' },
  { value: 'alice', label: 'Alice Williams', description: 'Engineering' },
  { value: 'charlie', label: 'Charlie Brown', description: 'Marketing' },
];

const customControlCss = css`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 4px;
`;

const customDropdownCss = css`
  border: 2px solid #667eea;
  border-radius: 12px;
`;

/**
 * All basic combobox variations: single/multi select, compact, variants, states
 */
export const All_Basics = () => {
  const multi1 = useMultiSelect({ initialValue: ['apple', 'banana'] });
  const multi2 = useMultiSelect({ initialValue: [] });
  const multi3 = useMultiSelect({ initialValue: [] });
  const multi4 = useMultiSelect({ initialValue: ['apple', 'banana'] });
  const multi5 = useMultiSelect({ initialValue: [] });
  const multi6 = useMultiSelect({ initialValue: [] });
  const multi7 = useMultiSelect({ initialValue: [] });
  const multi8 = useMultiSelect({ initialValue: [] });
  const [single1, setSingle1] = useState<string | null>('apple');
  const [single2, setSingle2] = useState<string | null>('apple');
  const [single3, setSingle3] = useState<string | null>('apple');
  const [single4, setSingle4] = useState<string | null>('apple');

  return (
    <VStack gap={4} padding={2}>
      <Example title="Basic Multi Select">
        <Combobox
          label="Select fruits"
          onChange={multi1.onChange}
          options={fruitOptions}
          placeholder="Search and select fruits..."
          type="multi"
          value={multi1.value}
        />
      </Example>

      <Example title="Single Select">
        <Combobox
          label="Select fruit"
          onChange={setSingle1}
          options={singleFruitOptions}
          placeholder="Search and select fruit..."
          value={single1}
        />
      </Example>

      <Example title="Compact Multi">
        <Combobox
          compact
          label="Compact size"
          onChange={multi2.onChange}
          options={fruitOptions}
          placeholder="Compact combobox..."
          type="multi"
          value={multi2.value}
        />
      </Example>

      <Example title="Compact Single">
        <Combobox
          compact
          label="Compact size"
          onChange={setSingle2}
          options={singleFruitOptions}
          placeholder="Compact combobox..."
          type="single"
          value={single2}
        />
      </Example>

      <Example title="Disabled">
        <Combobox
          disabled
          label="Disabled combobox"
          onChange={multi3.onChange}
          options={fruitOptions}
          placeholder="Cannot interact..."
          type="multi"
          value={multi4.value}
        />
      </Example>

      <Example title="Helper Text">
        <Combobox
          helperText="Select up to 5 team members for this project"
          label="Team members"
          onChange={multi5.onChange}
          options={teamOptions}
          placeholder="Search team members..."
          type="multi"
          value={multi5.value}
        />
      </Example>

      <Example title="Variants">
        <VStack gap={2}>
          <Combobox
            label="Default variant"
            onChange={multi6.onChange}
            options={fruitOptions}
            placeholder="Default style..."
            type="multi"
            value={multi6.value}
          />
          <Combobox
            label="Positive variant"
            onChange={multi7.onChange}
            options={fruitOptions}
            placeholder="Success style..."
            type="multi"
            value={multi7.value}
            variant="positive"
          />
          <Combobox
            label="Negative variant"
            onChange={multi8.onChange}
            options={fruitOptions}
            placeholder="Error style..."
            type="multi"
            value={multi8.value}
            variant="negative"
          />
        </VStack>
      </Example>

      <Example title="Borderless">
        <HStack gap={2}>
          <Combobox
            bordered={false}
            label="Borderless single"
            onChange={setSingle3}
            options={singleFruitOptions}
            placeholder="Search fruits..."
            type="single"
            value={single3}
          />
          <Combobox
            bordered={false}
            label="Borderless multi"
            onChange={setSingle4}
            options={singleFruitOptions}
            placeholder="Search fruits..."
            type="single"
            value={single4}
          />
        </HStack>
      </Example>
    </VStack>
  );
};

/**
 * All filtering, searching, and selection features
 */
export const All_Features = () => {
  const multi1 = useMultiSelect({ initialValue: [] });
  const multi2 = useMultiSelect({ initialValue: [] });
  const multi3 = useMultiSelect({
    initialValue: ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape'],
  });
  const multi4 = useMultiSelect({ initialValue: ['us', 'ca', 'mx', 'uk', 'fr', 'de'] });
  const multi5 = useMultiSelect({ initialValue: ['apple', 'banana'] });
  const multi6 = useMultiSelect({ initialValue: [] });
  const multi7 = useMultiSelect({ initialValue: [] });
  const multi8 = useMultiSelect({ initialValue: ['apple', 'banana', 'cherry'] });
  const multi9 = useMultiSelect({ initialValue: [] });
  const [searchText, setSearchText] = useState('');

  const customFilterFunction = (options: SelectOptionList<'multi'>, searchText: string) => {
    const search = searchText.toLowerCase();
    return (options as SelectOption[]).filter((option) => {
      const label = typeof option.label === 'string' ? option.label.toLowerCase() : '';
      const description =
        typeof option.description === 'string' ? option.description.toLowerCase() : '';
      return label.startsWith(search) || description.startsWith(search);
    });
  };

  return (
    <VStack gap={4} padding={2}>
      <Example title="With Descriptions">
        <Combobox
          label="Select countries"
          onChange={multi1.onChange}
          options={countryOptions}
          placeholder="Search countries..."
          type="multi"
          value={multi1.value}
        />
      </Example>

      <Example title="Controlled Search">
        <VStack gap={2}>
          <Text>Current search: &quot;{searchText}&quot;</Text>
          <Combobox
            label="Controlled search"
            onChange={multi2.onChange}
            onSearch={setSearchText}
            options={fruitOptions}
            placeholder="Type to search..."
            searchText={searchText}
            type="multi"
            value={multi2.value}
          />
          <Button onClick={() => setSearchText('apple')}>Set search to &quot;apple&quot;</Button>
        </VStack>
      </Example>

      <Example title="Custom Filter (starts with)">
        <Combobox
          filterFunction={customFilterFunction}
          label="Custom filter logic"
          onChange={multi9.onChange}
          options={cryptoOptions}
          placeholder="Type to filter..."
          type="multi"
          value={multi9.value}
        />
      </Example>

      <Example title="Max Selected Display (3)">
        <Combobox
          label="Limited display"
          maxSelectedOptionsToShow={3}
          onChange={multi3.onChange}
          options={fruitOptions}
          placeholder="Shows max 3 selections..."
          type="multi"
          value={multi3.value}
        />
      </Example>

      <Example title="Hidden Options Label">
        <Combobox
          hiddenSelectedOptionsLabel="countries"
          label="Countries"
          maxSelectedOptionsToShow={3}
          onChange={multi4.onChange}
          options={countryOptions}
          placeholder="Select countries..."
          type="multi"
          value={multi4.value}
        />
      </Example>

      <Example title="Select All">
        <Combobox
          label="With select all"
          onChange={multi5.onChange}
          options={fruitOptions}
          placeholder="Can select all..."
          selectAllLabel="Select all fruits"
          type="multi"
          value={multi5.value}
        />
      </Example>

      <Example title="Hide Select All">
        <Combobox
          hideSelectAll
          label="No select all"
          onChange={multi6.onChange}
          options={fruitOptions}
          placeholder="No select all option..."
          type="multi"
          value={multi6.value}
        />
      </Example>

      <Example title="Clear All">
        <Combobox
          clearAllLabel="Clear selection"
          label="With clear all"
          onChange={multi8.onChange}
          options={fruitOptions}
          placeholder="Can clear all..."
          type="multi"
          value={multi8.value}
        />
      </Example>

      <Example title="Hide Search Input">
        <Combobox
          hideSearchInput
          label="Hide search input"
          onChange={multi7.onChange}
          options={fruitOptions}
          placeholder="Empty value"
          type="multi"
          value={multi7.value}
        />
      </Example>

      <Example title="Empty Options">
        <Combobox
          emptyOptionsLabel="No matching fruits found"
          label="Custom empty message"
          onChange={multi6.onChange}
          options={[]}
          placeholder="No options available..."
          type="multi"
          value={multi6.value}
        />
      </Example>

      <Example title="Disabled Options">
        <Combobox
          label="Some disabled options"
          onChange={multi7.onChange}
          options={fruitOptions.map((option, index) => ({
            ...option,
            disabled: index % 3 === 0,
          }))}
          placeholder="Some options disabled..."
          type="multi"
          value={multi7.value}
        />
      </Example>
    </VStack>
  );
};

/**
 * All advanced features: custom components, styling, refs, large datasets
 */
export const All_Advanced = () => {
  const multi1 = useMultiSelect({ initialValue: [] });
  const multi2 = useMultiSelect({ initialValue: [] });
  const multi3 = useMultiSelect({ initialValue: [] });
  const multi4 = useMultiSelect({ initialValue: [] });
  const multi5 = useMultiSelect({ initialValue: [] });
  const multi6 = useMultiSelect({ initialValue: [] });
  const multi7 = useMultiSelect({ initialValue: [] });
  const comboboxRef = useRef<ComboboxRef>(null);
  const [open, setOpen] = useState(false);

  const CustomComponent: ComboboxControlComponent = (props) => {
    return <DefaultComboboxControl {...props} searchText={`${props.value?.length ?? 0}`} />;
  };

  const hugeOptions: SelectOption[] = Array.from({ length: 1000 }, (_, i) => ({
    value: `item${i}`,
    label: `Item ${i + 1}`,
    description: `Category ${Math.floor(i / 100) + 1}`,
  }));

  return (
    <VStack gap={4} padding={2}>
      <Example title="Start Node">
        <Combobox
          label="With icon"
          onChange={multi1.onChange}
          options={cryptoOptions}
          placeholder="Search crypto..."
          startNode={<Icon name="search" size="s" />}
          type="multi"
          value={multi1.value}
        />
      </Example>

      <Example title="End Node">
        <Combobox
          endNode={<Icon name="filter" size="s" />}
          label="Custom end icon"
          onChange={multi2.onChange}
          options={fruitOptions}
          placeholder="Custom icon..."
          type="multi"
          value={multi2.value}
        />
      </Example>

      <Example title="Options with Media">
        <Combobox
          label="Options with icons"
          onChange={multi3.onChange}
          options={fruitOptions.slice(0, 5).map((option) => ({
            ...option,
            media: <Icon color="fgMuted" name="star" size="s" />,
          }))}
          placeholder="Icons in options..."
          type="multi"
          value={multi3.value}
        />
      </Example>

      <Example title="Options with Accessory">
        <Combobox
          label="Team with badges"
          onChange={multi4.onChange}
          options={teamOptions.map((option) => ({
            ...option,
            accessory: (
              <Text color="fgMuted" fontSize="caption">
                {option.description}
              </Text>
            ),
          }))}
          placeholder="Select team members..."
          type="multi"
          value={multi4.value}
        />
      </Example>

      <Example title="Controlled Open">
        <VStack gap={2}>
          <HStack gap={2}>
            <Button onClick={() => setOpen(true)}>Open</Button>
            <Button onClick={() => setOpen(false)}>Close</Button>
            <Text color="fg">{open ? 'Open' : 'Closed'}</Text>
          </HStack>
          <Combobox
            label="Controlled dropdown"
            onChange={multi5.onChange}
            open={open}
            options={fruitOptions}
            placeholder="Controlled state..."
            setOpen={setOpen}
            type="multi"
            value={multi5.value}
          />
        </VStack>
      </Example>

      <Example title="Ref Imperative Handle">
        <VStack gap={2}>
          <HStack gap={2}>
            <Button onClick={() => comboboxRef.current?.setOpen?.(true)}>Open</Button>
            <Button onClick={() => comboboxRef.current?.setOpen?.(false)}>Close</Button>
          </HStack>
          <Combobox
            ref={comboboxRef}
            onChange={multi6.onChange}
            options={fruitOptions}
            placeholder="Select fruits..."
            type="multi"
            value={multi6.value}
          />
        </VStack>
      </Example>

      <Example title="Custom Control Component">
        <Combobox
          ComboboxControlComponent={CustomComponent}
          label="Shows count of selected options"
          onChange={multi7.onChange}
          options={fruitOptions}
          placeholder="Select fruits..."
          type="multi"
          value={multi7.value}
        />
      </Example>

      <Example title="Custom Styles">
        <Combobox
          label="Styled combobox"
          onChange={multi1.onChange}
          options={fruitOptions}
          placeholder="Custom styles..."
          styles={{
            root: { padding: '8px' },
            control: { borderRadius: '12px', border: '2px solid #667eea' },
            dropdown: { borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
            option: { padding: '12px' },
            optionLabel: { fontWeight: 'bold' },
          }}
          type="multi"
          value={multi1.value}
        />
      </Example>

      <Example title="Custom CSS Classes">
        <Combobox
          classNames={{
            root: 'custom-root',
            control: customControlCss,
            dropdown: customDropdownCss,
          }}
          label="Custom CSS classes"
          onChange={multi2.onChange}
          options={fruitOptions}
          placeholder="Custom classes..."
          type="multi"
          value={multi2.value}
        />
      </Example>

      <Example title="Long List (100 options)">
        <Combobox
          label="Large dataset"
          onChange={multi3.onChange}
          options={Array.from({ length: 100 }, (_, i) => ({
            value: `option${i}`,
            label: `Option ${i + 1}`,
            description: `Description for option ${i + 1}`,
          }))}
          placeholder="Search from 100 options..."
          type="multi"
          value={multi3.value}
        />
      </Example>

      <Example title="Stress Test (1000 options)">
        <Text color="fgMuted" fontSize="caption">
          1000 options with search
        </Text>
        <Combobox
          label="Performance test"
          onChange={multi4.onChange}
          options={hugeOptions}
          placeholder="Search 1000 items..."
          type="multi"
          value={multi4.value}
        />
      </Example>

      <Example title="Long Labels">
        <Combobox
          label="Options with long labels"
          onChange={multi5.onChange}
          options={longLabelOptions}
          placeholder="Search fruits..."
          type="multi"
          value={multi5.value}
        />
      </Example>

      <Example title="Persistent Dropdown">
        <Combobox
          disableClickOutsideClose
          label="Persistent dropdown"
          onChange={multi6.onChange}
          options={fruitOptions}
          placeholder="Stays open..."
          type="multi"
          value={multi6.value}
        />
      </Example>
    </VStack>
  );
};
