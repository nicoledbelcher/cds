import React from 'react';
// @ts-expect-error -- Fixture intentionally imports Button/IconButton from @coinbase/cds-web to exercise codemod import matching; typings are not validated for fixture sources.
import { Button } from '@coinbase/cds-web';

const variant = getVariant();

export function Example() {
  return <Button variant={variant}>Save</Button>;
}
