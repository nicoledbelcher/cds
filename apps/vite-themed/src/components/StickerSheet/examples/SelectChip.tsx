import { useState, memo } from 'react';
import { SelectChip } from '@coinbase/cds-web/chips/SelectChip';
import { SelectOption } from '@coinbase/cds-web/controls/SelectOption';
import { VStack } from '@coinbase/cds-web/layout/VStack';

const selectChipOptions = ['USD', 'CAD', 'GBP', 'JPY'];

export const SelectChipExample = memo(() => {
  const [selectChipValue, setSelectChipValue] = useState<string | undefined>('USD');
  return (
    <SelectChip
      value={selectChipValue}
      onChange={setSelectChipValue}
      placeholder="Select a currency"
      content={
        <VStack>
          {selectChipOptions.map((option) => (
            <SelectOption key={option} value={option} title={option} />
          ))}
        </VStack>
      }
    />
  );
});
