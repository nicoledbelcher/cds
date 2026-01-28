import React from 'react';

import { Example, ExampleScreen } from '../../__stories__/storybook';
import { Box } from '../../layout/Box';
import { VStack } from '../../layout/VStack';
import { InputIconButton } from '../InputIconButton';
import { TextInput } from '../TextInput';

export default {
  title: 'Components/Inputs/InputIconButton',
  component: InputIconButton,
};

const variants = ['foreground', 'foregroundMuted', 'primary', 'negative', 'positive'] as const;

export const All = () => {
  return (
    <ExampleScreen>
      <Example title="Add Custom Color">
        <TextInput
          label="Label"
          start={
            <InputIconButton
              active
              disableInheritFocusStyle
              accessibilityLabel="Add"
              name="add"
              variant="foregroundMuted"
            />
          }
        />
      </Example>

      <Example title="Add Custom Color End">
        <TextInput
          end={
            <InputIconButton
              active
              disableInheritFocusStyle
              transparent
              accessibilityLabel="Add"
              name="add"
              variant="foregroundMuted"
            />
          }
          label="Label"
        />
      </Example>

      <Example title="Basic">
        <>
          {variants.map((variant) => (
            <TextInput
              key={`${variant}-input-iconbutton`}
              label={variant}
              start={
                <InputIconButton
                  active
                  accessibilityLabel="Add"
                  name="add"
                  variant="foregroundMuted"
                />
              }
              variant={variant}
            />
          ))}
        </>
      </Example>

      <Example title="Basic End">
        <TextInput
          end={<InputIconButton active accessibilityLabel="Add" name="add" />}
          label="Label"
        />
      </Example>

      <Example title="Defaults To Primary">
        <TextInput
          label="Label"
          start={<InputIconButton accessibilityLabel="Search" name="search" />}
          variant="foregroundMuted"
        />
      </Example>

      <Example title="Invalid Placement">
        <Box background="bgAlternate">
          <InputIconButton active accessibilityLabel="Add" name="add" variant="foregroundMuted" />
        </Box>
      </Example>

      <Example title="Set Color And Inherit Focus Style">
        <TextInput
          label="Search"
          start={<InputIconButton accessibilityLabel="Search" name="search" variant="secondary" />}
          variant="foregroundMuted"
        />
      </Example>
    </ExampleScreen>
  );
};
