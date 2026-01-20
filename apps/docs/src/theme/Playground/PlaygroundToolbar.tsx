import React, { memo } from 'react';
import { Icon } from '@coinbase/cds-web/icons/Icon';
import { HStack } from '@coinbase/cds-web/layout/HStack';
import { Pressable } from '@coinbase/cds-web/system';
import { Text } from '@coinbase/cds-web/typography/Text';

type PlaygroundToolbarProps = {
  onReset: () => void;
  onCopy: () => void;
  onOpenCodeSandbox: () => void;
  headingText?: string;
};

export const PlaygroundToolbar = memo(
  ({ onReset, onCopy, onOpenCodeSandbox, headingText = '' }: PlaygroundToolbarProps) => {
    return (
      <HStack alignItems="center" gap={2} paddingTop={0.5}>
        <Pressable
          noScaleOnPress
          accessibilityLabel={`Reset code${headingText ? ` for ${headingText} example` : ''}`}
          onClick={onReset}
        >
          <HStack alignItems="center">
            <Icon name="refresh" paddingEnd={0.5} size="xs" />
            <Text color="fgPrimary" font="label1">
              Reset
            </Text>
          </HStack>
        </Pressable>
        <Pressable
          noScaleOnPress
          accessibilityLabel={`Copy code${headingText ? ` for ${headingText} example` : ''}`}
          onClick={onCopy}
        >
          <HStack alignItems="center">
            <Icon name="copy" paddingEnd={0.5} size="xs" />
            <Text color="fgPrimary" font="label1">
              Copy
            </Text>
          </HStack>
        </Pressable>
        <Pressable
          noScaleOnPress
          accessibilityLabel={`Open in CodeSandbox${headingText ? ` for ${headingText} example` : ''}`}
          onClick={onOpenCodeSandbox}
        >
          <HStack alignItems="center">
            <Icon name="externalLink" paddingEnd={0.5} size="xs" />
            <Text color="fgPrimary" font="label1">
              CodeSandbox
            </Text>
          </HStack>
        </Pressable>
      </HStack>
    );
  },
);

PlaygroundToolbar.displayName = 'PlaygroundToolbar';
