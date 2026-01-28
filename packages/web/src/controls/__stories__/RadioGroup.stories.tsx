import React, { useState } from 'react';

import { Example, ExampleScreen } from '../../__stories__/storybook';
import { VStack } from '../../layout';
import { Box } from '../../layout/Box';
import { Text } from '../../typography/Text';
import { Radio, RadioGroup } from '../RadioGroup';

export default {
  title: 'Components/RadioGroup',
  component: RadioGroup,
};

const options1 = {
  btc: 'Bitcoin',
  eth: 'Ethereum',
  dai: 'Dai',
};

const options2 = {
  'yellow-jacket': 'Yellow Jacket',
  bruin: 'Bruin',
  bronco: 'Bronco',
};

const options3 = {
  taco: 'tacos',
  puttanesca: 'Spaghetti',
  'hamachi-salad': <Text font="label1">Hamachi salad</Text>,
};

const NormalRadio = () => {
  const [checked, setChecked] = useState(false);
  return (
    <Radio checked={checked} name="normal-radio" onChange={() => setChecked((s) => !s)}>
      Normal
    </Radio>
  );
};

const CustomColorsRadio = () => {
  const [checked, setChecked] = useState(false);
  return (
    <ExampleScreen>
      <Radio
        checked={checked}
        controlColor="bgPositive"
        name="normal-radio"
        onChange={() => setChecked((s) => !s)}
      >
        Control color prop
      </Radio>
      <Radio
        background={checked ? 'accentBoldPurple' : 'bg'}
        borderColor={checked ? 'bgNegative' : 'bgWarning'}
        checked={checked}
        color="bgPrimary"
        controlColor="bgPositive"
        name="normal-radio"
        onChange={() => setChecked((s) => !s)}
      >
        Style props
      </Radio>
    </ExampleScreen>
  );
};

const GroupExample = () => {
  const [group1, setGroup1] = useState<string>('btc');
  const [group2, setGroup2] = useState<string>();
  const [group3, setGroup3] = useState<string>();
  const [group4, setGroup4] = useState<keyof typeof options3>();

  return (
    <ExampleScreen>
      <RadioGroup
        aria-labelledby="choose-a-currency"
        id="currency-radio-group"
        label={
          <Text font="headline" id="choose-a-currency">
            Choose a currency
          </Text>
        }
        name="radio-group1"
        onChange={setGroup1}
        options={options1}
        value={group1}
      />
      <Text font="headline" id="choose-a-mascot">
        Choose a mascot
      </Text>
      <RadioGroup
        accessibilityLabelledBy="choose-a-mascot"
        id="mascot-radio-group"
        name="radio-group2"
        onChange={setGroup2}
        options={options2}
        value={group2}
      />
      <RadioGroup
        aria-labelledby="choose-a-currency2"
        direction="horizontal"
        gap={2}
        id="horizontal-radio-group"
        label={
          <Text font="headline" id="choose-a-currency2">
            Choose a currency (Horizontal)
          </Text>
        }
        name="radio-group3"
        onChange={setGroup3}
        options={options1}
        value={group3}
      />
      <Text font="headline" id="select-dish-to-order">
        Select a dish to order
      </Text>
      <RadioGroup
        aria-labelledby="select-dish-to-order"
        direction="horizontal"
        gap={2}
        name="radio-group4"
        onChange={setGroup4}
        options={options3}
        value={group4}
      />
    </ExampleScreen>
  );
};

export const All = () => {
  return (
    <ExampleScreen>
      <Example title="Normal">
        <NormalRadio />
      </Example>

      <Example title="Custom Colors">
        <CustomColorsRadio />
      </Example>

      <Example title="Disabled Unselected">
        <Radio disabled>Disabled unselected</Radio>
      </Example>

      <Example title="Disabled Selected">
        <Radio checked disabled>
          Disabled selected
        </Radio>
      </Example>

      <Example title="Multi Line Labels">
        <Box width="250px">
          <Radio>
            This radio has a multi-line label. The radio and label should align at the top.
          </Radio>
        </Box>
      </Example>

      <Example title="Radio Groups">
        <GroupExample />
      </Example>
    </ExampleScreen>
  );
};
