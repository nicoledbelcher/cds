import React from 'react';
// @ts-expect-error -- Fixture intentionally imports Button/IconButton from @coinbase/cds-web to exercise codemod import matching; typings are not validated for fixture sources.
import { Button } from '@coinbase/cds-web';

const variant = getVariant();

export function Example() {
  return (
    // TODO(cds-migration): Button variant requires manual migration
    // Found dynamic or non-literal variant value. Verify mapping to v9 variants and update manually if needed.
    <Button variant={variant}>Save</Button>
  );
}
