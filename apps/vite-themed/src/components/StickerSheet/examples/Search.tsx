import { memo, useState } from 'react';
import { SearchInput } from '@coinbase/cds-web/controls/SearchInput';

export const SearchExample = memo(() => {
  const [searchValue, setSearchValue] = useState('');
  return (
    <>
      <SearchInput
        compact
        value={searchValue}
        onChangeText={setSearchValue}
        placeholder="Search..."
      />
      <SearchInput value={searchValue} onChangeText={setSearchValue} placeholder="Search..." />
    </>
  );
});
