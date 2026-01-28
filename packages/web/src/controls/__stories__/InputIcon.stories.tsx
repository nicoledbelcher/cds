import type { InputVariant } from '@coinbase/cds-common';
import type { ThemeVars } from '@coinbase/cds-common/core/theme';

import { Example, ExampleScreen } from '../../__stories__/storybook';
import { Box } from '../../layout/Box';
import { InputIcon } from '../InputIcon';
import { TextInput } from '../TextInput';

export default {
  title: 'Components/Inputs/InputIcon',
  component: InputIcon,
};

const variants = ['foreground', 'foregroundMuted', 'primary', 'negative', 'positive'] as const;

const variantColorMap: Record<InputVariant, ThemeVars.Color> = {
  primary: 'fgPrimary',
  positive: 'fgPositive',
  negative: 'fgNegative',
  foreground: 'fg',
  foregroundMuted: 'fgMuted',
  secondary: 'bgSecondary',
};

export const All = () => {
  return (
    <ExampleScreen>
      <Example title="Add Custom Color">
        <TextInput
          label="Label"
          start={<InputIcon active disableInheritFocusStyle color="fg" name="add" />}
        />
      </Example>

      <Example title="Add Custom Color End">
        <TextInput
          end={<InputIcon active disableInheritFocusStyle color="fg" name="add" />}
          label="Label"
        />
      </Example>

      <Example title="Basic">
        <>
          {variants.map((variant) => (
            <TextInput
              key={`${variant}-inputicon`}
              label={variant}
              start={<InputIcon active color={variantColorMap[variant]} name="add" />}
              variant={variant}
            />
          ))}
        </>
      </Example>

      <Example title="Basic End">
        <TextInput end={<InputIcon active name="add" />} label="Label" />
      </Example>

      <Example title="Defaults To Foreground">
        <TextInput label="Search" start={<InputIcon name="search" />} variant="foregroundMuted" />
      </Example>

      <Example title="Invalid Placement">
        <Box background="bgAlternate">
          <InputIcon active name="add" />
        </Box>
      </Example>

      <Example title="Set Color And Inherit Focus Style">
        <TextInput
          label="Search"
          start={<InputIcon color="fgPositive" name="search" />}
          variant="foregroundMuted"
        />
      </Example>
    </ExampleScreen>
  );
};
