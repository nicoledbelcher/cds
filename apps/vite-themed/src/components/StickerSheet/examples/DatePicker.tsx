import { DatePicker } from '@coinbase/cds-web/dates/DatePicker';
import { type DateInputValidationError } from '@coinbase/cds-common/dates/DateInputValidationError';
import { VStack } from '@coinbase/cds-web/layout/VStack';
import { memo, useState } from 'react';

export const DatePickerExample = memo(() => {
  const [date, setDate] = useState<Date | null>(new Date());
  const [dateError, setDateError] = useState<DateInputValidationError | null>(null);
  return (
    <VStack style={{ gap: 16 }} width="100%">
      <DatePicker
        compact
        date={date}
        onChangeDate={setDate}
        error={dateError}
        onErrorDate={setDateError}
        label="Birthdate"
      />
      <DatePicker
        labelVariant="inside"
        date={date}
        onChangeDate={setDate}
        error={dateError}
        onErrorDate={setDateError}
        label="Birthdate"
      />
      <DatePicker
        date={date}
        onChangeDate={setDate}
        error={dateError}
        onErrorDate={setDateError}
        label="Birthdate"
      />
    </VStack>
  );
});
