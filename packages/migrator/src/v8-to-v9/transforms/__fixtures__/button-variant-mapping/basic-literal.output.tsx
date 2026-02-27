import React from 'react';
// @ts-expect-error -- Fixture intentionally imports Button/IconButton from @coinbase/cds-web to exercise codemod import matching; typings are not validated for fixture sources.
import { Button, IconButton } from '@coinbase/cds-web';

export function Example() {
  return (
    <>
      <Button variant="inverse">Save</Button>
      <IconButton name="close" variant="secondary" />
    </>
  );
}
