import { type TextDefaultElement, type TextProps, Text } from '@coinbase/cds-web/typography/Text';
import { memo } from 'react';

export const BodyText = memo(({ style, ...props }: TextProps<TextDefaultElement>) => (
  <Text
    style={{
      fontFamily: 'var(--defaultFont-sans)',
      fontSize: 14,
      ...style,
    }}
    {...props}
  />
));
