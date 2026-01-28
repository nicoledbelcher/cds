import { useMemo, useState } from 'react';
import { assets } from '@coinbase/cds-common/internal/data/assets';
import { useMultiSelect } from '@coinbase/cds-common/select/useMultiSelect';

import { VStack } from '../../../layout/VStack';
import { RemoteImage } from '../../../media/RemoteImage';
import { RemoteImageGroup } from '../../../media/RemoteImageGroup';
import { Example } from '../../../__stories__/storybook';
import type { SelectOption, SelectOptionGroup, SelectType } from '../../select/Select';
import { SelectChip } from '../SelectChip';

export default {
  title: 'Components/Alpha/SelectChip',
  component: SelectChip,
};

const exampleOptions = [
  { value: null, label: 'Clear selection' },
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
  { value: '4', label: 'Option 4' },
];

const multiExampleOptions = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
  { value: '4', label: 'Option 4' },
  { value: '5', label: 'Option 5' },
];

const assetOptions = [
  { value: 'btc', label: assets.btc.name },
  { value: 'eth', label: assets.eth.name },
  { value: 'dai', label: assets.dai.name },
];

const multiAssetOptions = [
  { value: 'btc', label: assets.btc.name },
  { value: 'eth', label: assets.eth.name },
  { value: 'dai', label: assets.dai.name },
  { value: 'ltc', label: assets.ltc.name },
  { value: 'xrp', label: assets.xrp.name },
];

const assetImageMap: Record<string, string> = {
  btc: assets.btc.imageUrl,
  eth: assets.eth.imageUrl,
  dai: assets.dai.imageUrl,
  ltc: assets.ltc.imageUrl,
  xrp: assets.xrp.imageUrl,
};

const groupedOptions: (SelectOption<string> | SelectOptionGroup<SelectType, string>)[] = [
  {
    label: 'Group A',
    options: [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' },
      { value: '3', label: 'Option 3' },
    ],
  },
  {
    label: 'Group B',
    disabled: true,
    options: [
      { value: '4', label: 'Option 4' },
      { value: '5', label: 'Option 5' },
    ],
  },
  {
    label: 'Group C',
    options: [{ value: '6', label: 'Option 6' }],
  },
];

const multiGroupedOptions: (SelectOption<string> | SelectOptionGroup<SelectType, string>)[] = [
  {
    label: 'Group A',
    options: [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' },
      { value: '3', label: 'Option 3' },
    ],
  },
  {
    label: 'Group B',
    options: [
      { value: '4', label: 'Option 4' },
      { value: '5', label: 'Option 5' },
    ],
  },
  {
    label: 'Group C',
    options: [{ value: '6', label: 'Option 6' }],
  },
];

const disabledGroupOptions: (SelectOption<string> | SelectOptionGroup<SelectType, string>)[] = [
  {
    label: 'Available Options',
    options: [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' },
      { value: '3', label: 'Option 3' },
    ],
  },
  {
    label: 'Unavailable Options (Group Disabled)',
    disabled: true,
    options: [
      { value: '4', label: 'Option 4' },
      { value: '5', label: 'Option 5' },
      { value: '6', label: 'Option 6' },
    ],
  },
  {
    label: 'More Available Options',
    options: [
      { value: '7', label: 'Option 7' },
      { value: '8', label: 'Option 8' },
    ],
  },
];

const disabledOptions = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2', disabled: true },
  { value: '3', label: 'Option 3' },
  { value: '4', label: 'Option 4', disabled: true },
];

const optionsWithDescriptions = [
  { value: '1', label: 'Option 1', description: 'First option description' },
  { value: '2', label: 'Option 2', description: 'Second option description' },
  { value: '3', label: 'Option 3', description: 'Third option description' },
  { value: '4', label: 'Option 4', description: 'Fourth option description' },
];

export const All = () => {
  const [single1, setSingle1] = useState<string | null>(null);
  const [single2, setSingle2] = useState<string | null>('1');
  const [single3, setSingle3] = useState<string | null>('eth');
  const [single4, setSingle4] = useState<string | null>(null);
  const [single5, setSingle5] = useState<string | null>(null);
  const [single6, setSingle6] = useState<string | null>(null);
  const [single7, setSingle7] = useState<string | null>(null);
  const [single8, setSingle8] = useState<string | null>('1');
  const [single9, setSingle9] = useState<string | null>(null);
  const [single10, setSingle10] = useState<string | null>(null);
  const multi1 = useMultiSelect({ initialValue: [] });
  const multi2 = useMultiSelect({ initialValue: ['eth', 'btc'] });
  const multi3 = useMultiSelect({ initialValue: [] });
  const multi4 = useMultiSelect({ initialValue: [] });
  const multi5 = useMultiSelect({ initialValue: [] });

  // Map each option value to a different asset
  const getStartNode = (selectedValue: string | null) => {
    if (!selectedValue) return null;
    const imageUrl = assetImageMap[selectedValue];
    if (!imageUrl) return null;
    return <RemoteImage height={24} shape="circle" source={imageUrl} width={24} />;
  };

  // Get startNode based on selected assets for multi
  const multiStartNode = useMemo(() => {
    if (multi2.value.length === 0) return null;
    return (
      <RemoteImageGroup shape="circle" size={24}>
        {multi2.value.map((assetValue) => {
          const imageUrl = assetImageMap[assetValue];
          if (!imageUrl) return null;
          return <RemoteImage key={assetValue} source={imageUrl} />;
        })}
      </RemoteImageGroup>
    );
  }, [multi2.value]);

  // Display value for multi select
  const displayValue =
    Array.isArray(multi5.value) && multi5.value.length > 0
      ? `${multi5.value.length} ${multi5.value.length === 1 ? 'option' : 'options'} selected`
      : undefined;

  return (
    <VStack gap={4} padding={2}>
      {/* Basic Single & Multi Select */}
      <Example title="Default Single">
        <SelectChip
          accessibilityLabel="Select a value"
          onChange={setSingle1}
          options={exampleOptions}
          placeholder="Choose an option"
          value={single1}
        />
      </Example>

      <Example title="Default Multi">
        <SelectChip
          controlAccessibilityLabel="Select multiple values"
          onChange={multi1.onChange}
          options={multiExampleOptions}
          placeholder="Choose options"
          type="multi"
          value={multi1.value}
        />
      </Example>

      <Example title="Compact">
        <SelectChip
          compact
          onChange={setSingle2}
          options={exampleOptions.filter((o) => o.value !== null)}
          placeholder="Choose an option"
          value={single2}
        />
      </Example>

      {/* With Assets */}
      <Example title="With Start/End Nodes (Assets)">
        <SelectChip
          onChange={setSingle3}
          options={assetOptions}
          placeholder="Choose an asset"
          startNode={getStartNode(single3)}
          value={single3}
        />
      </Example>

      <Example title="Multi Select with Assets">
        <SelectChip
          controlAccessibilityLabel="Select multiple assets"
          maxWidth={400}
          onChange={multi2.onChange}
          options={multiAssetOptions}
          placeholder="Choose assets"
          startNode={multiStartNode}
          type="multi"
          value={multi2.value}
        />
      </Example>

      {/* Color Scheme */}
      <Example title="Invert Color Scheme">
        <VStack background="bgAlternate" borderRadius={200} padding={2}>
          <SelectChip
            invertColorScheme
            onChange={setSingle4}
            options={exampleOptions.filter((o) => o.value !== null)}
            placeholder="Choose an option"
            value={single4}
          />
        </VStack>
      </Example>

      {/* Groups */}
      <Example title="With Groups">
        <SelectChip
          accessibilityLabel="Select a value"
          onChange={setSingle5}
          options={groupedOptions as any}
          placeholder="Choose an option"
          value={single5}
        />
      </Example>

      <Example title="Multi with Groups">
        <SelectChip
          controlAccessibilityLabel="Select multiple values"
          onChange={multi3.onChange}
          options={multiGroupedOptions as any}
          placeholder="Choose options"
          type="multi"
          value={multi3.value}
        />
      </Example>

      <Example title="With Disabled Group">
        <SelectChip
          accessibilityLabel="Select a value"
          onChange={setSingle6}
          options={disabledGroupOptions as any}
          placeholder="Choose an option"
          value={single6}
        />
      </Example>

      <Example title="Multi with Disabled Group">
        <SelectChip
          controlAccessibilityLabel="Select multiple values"
          onChange={multi4.onChange}
          options={disabledGroupOptions as any}
          placeholder="Choose options"
          type="multi"
          value={multi4.value}
        />
      </Example>

      {/* Disabled States */}
      <Example title="Fully Disabled">
        <VStack gap={2}>
          <SelectChip
            disabled
            accessibilityLabel="Select a value"
            onChange={setSingle7}
            options={exampleOptions.filter((o) => o.value !== null)}
            placeholder="Choose an option"
            value={null}
          />
          <SelectChip
            disabled
            accessibilityLabel="Select a value"
            onChange={setSingle8}
            options={exampleOptions.filter((o) => o.value !== null)}
            placeholder="Choose an option"
            value={single8}
          />
        </VStack>
      </Example>

      <Example title="With Disabled Options">
        <SelectChip
          accessibilityLabel="Select a value"
          onChange={setSingle9}
          options={disabledOptions}
          placeholder="Choose an option"
          value={single9}
        />
      </Example>

      {/* Options with Descriptions */}
      <Example title="With Descriptions">
        <SelectChip
          accessibilityLabel="Select a value"
          onChange={setSingle10}
          options={optionsWithDescriptions}
          placeholder="Choose an option"
          value={single10}
        />
      </Example>

      {/* Display Value */}
      <Example title="With Display Value">
        <SelectChip
          controlAccessibilityLabel="Select multiple values"
          displayValue={displayValue}
          onChange={multi5.onChange}
          options={multiExampleOptions}
          placeholder="Choose options"
          type="multi"
          value={multi5.value}
        />
      </Example>

      {/* Empty Options */}
      <Example title="Empty Options">
        <SelectChip
          onChange={setSingle1}
          options={[]}
          placeholder="No options available"
          value={single1}
        />
      </Example>
    </VStack>
  );
};
