import { Select } from '@coinbase/cds-web/alpha/select';
import { memo, useState } from 'react';

const selectOptions = [
  { value: 'option1', label: 'Option 1', description: 'Description' },
  { value: 'option2', label: 'Option 2', description: 'Description' },
  { value: 'option3', label: 'Option 3', description: 'Description' },
  { value: 'option4', label: 'Option 4', description: 'Description' },
  { value: 'option5', label: 'Option 5', description: 'Description' },
  { value: 'option6', label: 'Option 6', description: 'Description' },
];

export const SelectExample = memo(() => {
  const [selectValue, setSelectValue] = useState<string | null>(null);

  return (
    <>
      <Select
        label="Label"
        compact
        value={selectValue}
        onChange={setSelectValue}
        options={selectOptions}
        placeholder="Select an option"
        labelVariant="inside"
        style={{ flexGrow: 1 }}
      />
      <Select
        label="Label"
        value={selectValue}
        onChange={setSelectValue}
        options={selectOptions}
        placeholder="Select an option"
        labelVariant="inside"
        style={{ flexGrow: 1 }}
      />
      <Select
        label="Label"
        value={selectValue}
        onChange={setSelectValue}
        options={selectOptions}
        placeholder="Select an option"
        style={{ flexGrow: 1 }}
      />
    </>
  );
});
