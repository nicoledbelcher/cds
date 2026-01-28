import React, { useState } from 'react';
import { css } from '@linaria/core';

import { Example, ExampleScreen } from '../../__stories__/storybook';
import { useCheckboxGroupState } from '../../hooks/useCheckboxGroupState';
import { Box, VStack } from '../../layout';
import { ThemeProvider } from '../../system/ThemeProvider';
import { defaultTheme } from '../../themes/defaultTheme';
import { Text } from '../../typography/Text';
import { Checkbox } from '../Checkbox';
import { CheckboxGroup } from '../CheckboxGroup';

const Normal = () => {
  const [checked, setChecked] = useState(false);
  return (
    <Checkbox checked={checked} name="normal-checkbox" onChange={() => setChecked((s) => !s)}>
      Normal
    </Checkbox>
  );
};

const CustomColor = () => {
  const [checked, setChecked] = useState(false);
  return (
    <ExampleScreen>
      <Checkbox
        checked={checked}
        controlColor="bgNegative"
        name="control-color-checkbox"
        onChange={() => setChecked((s) => !s)}
      >
        Control color
      </Checkbox>
      <Checkbox
        background={checked ? 'bgNegative' : 'bg'}
        borderColor={checked ? 'bgNegative' : 'bgPositive'}
        checked={checked}
        controlColor="fg"
        name="style-props-checkbox"
        onChange={() => setChecked((s) => !s)}
      >
        Style props
      </Checkbox>
      <Checkbox
        background={checked ? 'bgNegative' : 'bg'}
        borderColor={checked ? 'bgNegative' : 'bgPositive'}
        borderRadius={200}
        borderWidth={500}
        color="bgPrimary"
        controlColor="fg"
        indeterminate={checked}
        name="indeterminate-checkbox"
        onChange={() => setChecked((s) => !s)}
      >
        Style props indeterminate
      </Checkbox>
    </ExampleScreen>
  );
};

const Indeterminate = () => {
  const [indeterminate, setIndeterminate] = useState(false);
  return (
    <Checkbox
      indeterminate={indeterminate}
      name="indeterminate-checkbox"
      onChange={() => setIndeterminate((s) => !s)}
    >
      Indeterminate
    </Checkbox>
  );
};

const darkNormalCss = css`
  padding: 20px;
  /* All stories have the light story container. This offsets the light story container's padding. */
  margin: -20px;
  background-color: var(--color-bg);
`;

const DarkNormal = () => {
  const [checked, setChecked] = useState(false);
  return (
    <ThemeProvider activeColorScheme="dark" theme={defaultTheme}>
      <div className={darkNormalCss}>
        {' '}
        <Checkbox checked={checked} onChange={() => setChecked((s) => !s)}>
          Normal
        </Checkbox>
      </div>
    </ThemeProvider>
  );
};

const NoLabel = () => {
  const [checked, setChecked] = useState(false);
  return <Checkbox checked={checked} onChange={() => setChecked((s) => !s)} />;
};

const DisabledUnselected = () => (
  <Checkbox checked disabled>
    Disabled selected
  </Checkbox>
);

const ReadOnlyUnselected = () => <Checkbox readOnly>Read-only unselected</Checkbox>;

const ReadOnlySelected = () => (
  <Checkbox checked readOnly>
    Read-only selected
  </Checkbox>
);

const MultiLineLabel = () => (
  <Box width="250px">
    <Checkbox>
      This checkbox has a multi-line label. The checkbox and label should align at the top.
    </Checkbox>
  </Box>
);

const options = {
  'fish-taco': 'Fish tacos',
  puttanesca: 'Spaghetti alla puttanesca',
  'hamachi-salad': 'Hamachi salad',
  'pad-thai': 'Pad Thai',
  pizza: 'Margherita Pizza',
  ramen: 'Tonkotsu Ramen',
};
const optionValues = Object.keys(options);

const Group = () => {
  const [selectedValues, { toggle }] = useCheckboxGroupState(optionValues);
  return (
    <>
      <Text as="h1" display="block" font="headline" id="order-dinner-label-no-select-all">
        Checkbox Group Default
      </Text>
      <CheckboxGroup
        aria-labelledby="order-dinner-label-no-select-all"
        name="checkbox-group-default"
        onChange={toggle}
        selectedValues={selectedValues}
      >
        {Object.entries(options).map(([value, label]) => (
          <Checkbox key={value} value={value}>
            {label}
          </Checkbox>
        ))}
      </CheckboxGroup>
    </>
  );
};

const gridLayoutCss = css`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
`;

const CustomLayoutCheckboxGroup = () => {
  const [selectedValues, { toggle }] = useCheckboxGroupState(optionValues);
  return (
    <>
      <Text as="h2" display="block" font="headline" paddingY={1}>
        Two Column Layout
      </Text>
      <CheckboxGroup
        className={gridLayoutCss}
        name="checkbox-grid"
        onChange={toggle}
        selectedValues={selectedValues}
      >
        {Object.entries(options).map(([value, label]) => (
          <Checkbox key={value} value={value}>
            {label}
          </Checkbox>
        ))}
      </CheckboxGroup>
    </>
  );
};

export const All = () => (
  <VStack gap={3}>
    <Example title="Normal">
      <Normal />
    </Example>

    <Example title="Custom Color">
      <CustomColor />
    </Example>

    <Example title="Indeterminate">
      <Indeterminate />
    </Example>

    <Example title="Dark Normal">
      <DarkNormal />
    </Example>

    <Example title="No Label">
      <NoLabel />
    </Example>

    <Example title="Disabled Unselected">
      <DisabledUnselected />
    </Example>

    <Example title="Read-Only Unselected">
      <ReadOnlyUnselected />
    </Example>

    <Example title="Read-Only Selected">
      <ReadOnlySelected />
    </Example>

    <Example title="Multi-Line Label">
      <MultiLineLabel />
    </Example>

    <Example title="Group">
      <Group />
    </Example>

    <Example title="Custom Layout Checkbox Group">
      <CustomLayoutCheckboxGroup />
    </Example>
  </VStack>
);
// a11y rules disabled for No Label and Read-Only stories intentionally
All.parameters = {
  a11y: {
    config: {
      rules: [
        { id: 'label', enabled: false },
        { id: 'color-contrast', enabled: false },
      ],
    },
  },
};

export default {
  title: 'Components/Checkbox',
  component: Checkbox,
};
