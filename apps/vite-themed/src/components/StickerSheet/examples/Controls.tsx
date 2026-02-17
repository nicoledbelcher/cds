import { useState, memo } from 'react';
import { Checkbox } from '@coinbase/cds-web/controls/Checkbox';
import { Radio } from '@coinbase/cds-web/controls/Radio';
import { Switch } from '@coinbase/cds-web/controls/Switch';
import { VStack } from '@coinbase/cds-web/layout/VStack';

export const ControlsExample = memo(() => {
  const [checkboxValue, setCheckboxValue] = useState(true);
  const [radioValue, setRadioValue] = useState('option1');
  const [switchValue, setSwitchValue] = useState(true);
  return (
    <>
      <VStack style={{ gap: 16 }}>
        <Switch checked={switchValue} onChange={() => setSwitchValue((s) => !s)}>
          Switch
        </Switch>
      </VStack>

      <VStack style={{ gap: 16 }}>
        <Checkbox checked={checkboxValue} onChange={() => setCheckboxValue((s) => !s)}>
          Checkbox
        </Checkbox>
      </VStack>

      <VStack style={{ gap: 16 }}>
        <Radio
          value="option1"
          checked={radioValue === 'option1'}
          onChange={() => setRadioValue((s) => (s === 'option1' ? '' : 'option1'))}
        >
          Radio
        </Radio>
      </VStack>
    </>
  );
});
