import React from 'react';
// @ts-expect-error -- Fixture intentionally imports Button/IconButton from @coinbase/cds-web to exercise codemod import matching; typings are not validated for fixture sources.
import { IconButton } from '@coinbase/cds-web';

const iconProps = {
  variant: 'secondary' as const,
  compact: true,
};

export function Example() {
  return (
    // TODO(cds-migration): IconButton spread props need manual review
    // Found spread props on IconButton. Spread values may still contain legacy variant values. Review spread source and flatten/update variant explicitly. An obvious local object-literal variant was auto-updated, but full spread safety still requires manual verification.
    <IconButton {...iconProps} name="close" />
  );
}
