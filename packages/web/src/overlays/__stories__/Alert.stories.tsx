import React, { useCallback, useEffect, useState } from 'react';
import { useAlert } from '@coinbase/cds-common/overlays/useAlert';

import { Example, ExampleScreen } from '../../__stories__/storybook';
import { Button } from '../../buttons/Button';
import { VStack } from '../../layout';
import { Text } from '../../typography/Text';
import { Alert } from '../Alert';
import { PortalProvider } from '../PortalProvider';

export default {
  title: 'Components/Alert',
  component: Alert,
};

const onPressConsole = () => console.log('pressed');

const BasicAlertExample = () => {
  const [visible, setVisible] = useState(true);

  const toggleOn = useCallback(() => setVisible(true), []);
  const toggleOff = useCallback(() => setVisible(false), []);

  return (
    <>
      <Button onClick={toggleOn}>Show Alert</Button>
      <Alert
        body="Alert body type that can run over multiple lines, but should be kept short."
        dismissActionLabel="Cancel"
        onPreferredActionPress={onPressConsole}
        onRequestClose={toggleOff}
        pictogram="warning"
        preferredActionLabel="Primary"
        title="Alert title"
        visible={visible}
      />
    </>
  );
};

const LongTitleAlertExample = () => {
  const [visible, setVisible] = useState(true);

  const toggleOn = useCallback(() => setVisible(true), []);
  const toggleOff = useCallback(() => setVisible(false), []);

  return (
    <>
      <Button onClick={toggleOn}>Show Alert</Button>
      <Alert
        body="Alert body type that can run over multiple lines, but should be kept short."
        dismissActionLabel="Cancel"
        onPreferredActionPress={onPressConsole}
        onRequestClose={toggleOff}
        pictogram="warning"
        preferredActionLabel="Primary"
        title="Multiline title should be centered"
        visible={visible}
      />
    </>
  );
};

const AlertWithPortal = () => {
  const { open, close } = useAlert();

  const showAlert = useCallback(
    () =>
      open(
        <Alert
          visible
          body="Alert body type that can run over multiple lines, but should be kept short."
          dismissActionLabel="Cancel"
          onPreferredActionPress={onPressConsole}
          onRequestClose={close}
          pictogram="warning"
          preferredActionLabel="Save"
          preferredActionVariant="negative"
          title="Alert title"
        />,
      ),
    [open, close],
  );

  useEffect(() => {
    showAlert();
    return () => close();
  }, [close, showAlert]);

  return <Button onClick={showAlert}>Show Alert</Button>;
};

const PortalAlertExample = () => {
  return (
    <PortalProvider>
      <AlertWithPortal />
    </PortalProvider>
  );
};

const SingleActionAlertExample = () => {
  const [visible, setVisible] = useState(true);

  const toggleOn = useCallback(() => setVisible(true), []);
  const toggleOff = useCallback(() => setVisible(false), []);

  return (
    <>
      <Button onClick={toggleOn}>Show Alert</Button>
      <Alert
        body="Alert body type that can run over multiple lines, but should be kept short."
        onPreferredActionPress={onPressConsole}
        onRequestClose={toggleOff}
        pictogram="warning"
        preferredActionLabel="Primary"
        title="Alert title"
        visible={visible}
      />
    </>
  );
};

const VerticalActionsAlertExample = () => {
  const [visible, setVisible] = useState(true);

  const toggleOn = useCallback(() => setVisible(true), []);
  const toggleOff = useCallback(() => setVisible(false), []);

  return (
    <>
      <Button onClick={toggleOn}>Show Alert</Button>
      <Alert
        actionLayout={'vertical'}
        body="Alert body type that can run over multiple lines, but should be kept short."
        dismissActionLabel="Cancel"
        onPreferredActionPress={onPressConsole}
        onRequestClose={toggleOff}
        pictogram="warning"
        preferredActionLabel="Primary"
        title="Alert title"
        visible={visible}
      />
    </>
  );
};

export const All = () => {
  return (
    <ExampleScreen>
      <Example title="Basic Alert">
        <BasicAlertExample />
      </Example>

      <Example title="Long Title Alert">
        <LongTitleAlertExample />
      </Example>

      <Example title="Portal Alert">
        <PortalAlertExample />
      </Example>

      <Example title="Single Action Alert">
        <SingleActionAlertExample />
      </Example>

      <Example title="Alert with Vertical Actions">
        <VerticalActionsAlertExample />
      </Example>
    </ExampleScreen>
  );
};
