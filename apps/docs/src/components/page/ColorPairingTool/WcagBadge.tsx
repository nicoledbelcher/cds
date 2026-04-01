import React, { memo } from 'react';
import { Icon } from '@coinbase/cds-web/icons';
import { HStack } from '@coinbase/cds-web/layout';
import { Tag } from '@coinbase/cds-web/tag';
import { Text } from '@coinbase/cds-web/typography';

type WcagBadgeProps = {
  label: string;
  passes: boolean;
};

export const WcagBadge = memo(function WcagBadge({ label, passes }: WcagBadgeProps) {
  return (
    <Tag
      colorScheme={passes ? 'green' : 'red'}
      emphasis="low"
      intent="informational"
      paddingEnd={0.5}
      paddingStart={0.5}
    >
      <HStack alignItems="center" gap={0.5}>
        <Text font="label1" style={{ color: 'inherit' }}>
          {label}
        </Text>
        <Icon
          active
          name={passes ? 'circleCheckmark' : 'circleCross'}
          size="s"
          style={{ color: 'inherit' }}
        />
      </HStack>
    </Tag>
  );
});
