import { useState, memo } from 'react';
import { Pagination } from '@coinbase/cds-web/pagination/Pagination';

export const PaginationExample = memo(() => {
  const [activePage, setActivePage] = useState(1);
  return (
    <Pagination
      style={{ width: 420 }}
      totalPages={9}
      activePage={activePage}
      onChange={setActivePage}
    />
  );
});
