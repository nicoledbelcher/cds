import React from 'react';
// @ts-expect-error -- Fixture intentionally imports Button/IconButton from @coinbase/cds-web to exercise codemod import matching; typings are not validated for fixture sources.
import { IconButton } from '@coinbase/cds-web';

const iconProps = {
  variant: 'foregroundMuted' as const,
  compact: true,
};

export function Example() {
  return <IconButton {...iconProps} name="close" />;
}
