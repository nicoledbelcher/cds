import { Text } from '../typography/Text';

import type { PaginationEllipsisProps } from './Pagination';

export const DefaultPaginationEllipsis = ({
  content = '...',
  className,
  style,
  testID,
}: PaginationEllipsisProps) => (
  <Text
    noWrap
    aria-hidden="true"
    className={className}
    color="fgMuted"
    data-ellipsis="true"
    font="headline"
    style={style}
    testID={testID}
  >
    {content}
  </Text>
);
