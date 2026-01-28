import React, { useState } from 'react';
import { Image } from 'react-native';

import { Button } from '../../buttons/Button';
import { ListCell } from '../../cells/ListCell';
import { Example, ExampleScreen } from '../../examples/ExampleScreen';
import { useTheme } from '../../hooks/useTheme';
import { Pictogram } from '../../illustrations/Pictogram';
import { Box, VStack } from '../../layout';
import { StickyFooter } from '../../sticky-footer/StickyFooter';
import { Text } from '../../typography/Text';
import { Tray, TrayStickyFooter } from '../tray/Tray';

/**
 * These examples match the web Composed Examples to compare mobile/web parity.
 * All use handleBarVariant="inside" which is the recommended pattern.
 */

const TrayBasicWithHandleBar = () => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Button onPress={() => setVisible(true)}>Open Tray</Button>
      {visible && (
        <Tray handleBarVariant="inside" onCloseComplete={() => setVisible(false)} title="Header">
          <Text>This is the content of the tray.</Text>
        </Tray>
      )}
    </>
  );
};

const TrayWithIllustration = () => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Button onPress={() => setVisible(true)}>Open Illustration Tray</Button>
      {visible && (
        <Tray
          handleBarVariant="inside"
          onCloseComplete={() => setVisible(false)}
          title={
            <VStack gap={1.5}>
              <Pictogram name="addWallet" />
              <Text font="title3">Welcome aboard</Text>
            </VStack>
          }
        >
          <Text color="fgMuted">
            Curabitur commodo nulla vel dolor vulputate vestibulum. Nulla et nisl molestie, interdum
            lorem id, viverra.
          </Text>
        </Tray>
      )}
    </>
  );
};

const TrayWithListCells = () => {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Button onPress={() => setVisible(true)}>Open ListCells Tray</Button>
      {visible && (
        <Tray
          handleBarVariant="inside"
          onCloseComplete={() => setVisible(false)}
          styles={{ header: { paddingBottom: theme.space[1] } }}
          title="Section header"
        >
          {Array.from({ length: 20 }, (_, i) => (
            <ListCell
              key={i}
              accessory="arrow"
              description="Description"
              innerSpacing={{
                marginX: -4,
                paddingX: 4,
                paddingY: 1,
              }}
              onPress={() => {}}
              spacingVariant="condensed"
              title="Title"
            />
          ))}
        </Tray>
      )}
    </>
  );
};

const TrayWithCustomImageHeader = () => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Button onPress={() => setVisible(true)}>Open Custom Header Tray</Button>
      {visible && (
        <Tray
          footer={({ handleClose }) => (
            <StickyFooter paddingBottom={0}>
              <Button onPress={handleClose}>Close</Button>
            </StickyFooter>
          )}
          handleBarVariant="inside"
          header={
            <Image
              resizeMode="cover"
              source={{
                uri: 'https://images.ctfassets.net/o10es7wu5gm1/4BsskcYybNIDMYTeMpkFPG/216eb97727f834346649004a5d66cd3f/Coinbase_Press_Page_Product_Image.png',
              }}
              style={{ width: '100%', height: 220 }}
            />
          }
          onCloseComplete={() => setVisible(false)}
        >
          <Text font="title3" paddingBottom={0.75} paddingTop={2}>
            Header
          </Text>
          <VStack gap={2}>
            <Text>This is the content of the tray.</Text>
          </VStack>
        </Tray>
      )}
    </>
  );
};

const TrayWithStickyFooter = () => {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Button onPress={() => setVisible(true)}>Open ListCells Tray</Button>
      {visible && (
        <Tray
          footer={({ handleClose }) => (
            <StickyFooter paddingBottom={0}>
              <Button onPress={handleClose}>Close</Button>
            </StickyFooter>
          )}
          handleBarVariant="inside"
          onCloseComplete={() => setVisible(false)}
          styles={{ header: { paddingBottom: theme.space[1] } }}
          title="Section header"
        >
          {Array.from({ length: 20 }, (_, i) => (
            <ListCell
              key={i}
              accessory="arrow"
              description="Description"
              innerSpacing={{
                marginX: -4,
                paddingX: 4,
                paddingY: 1,
              }}
              onPress={() => {}}
              spacingVariant="condensed"
              title="Title"
            />
          ))}
        </Tray>
      )}
    </>
  );
};

export const TrayResponsiveExamplesScreen = () => {
  return (
    <ExampleScreen>
      <Example title="Basic Tray with Handle Bar">
        <TrayBasicWithHandleBar />
      </Example>
      <Example title="Tray with Illustration">
        <TrayWithIllustration />
      </Example>
      <Example title="Tray with List Cells">
        <TrayWithListCells />
      </Example>
      <Example title="Tray with Custom Image Header">
        <TrayWithCustomImageHeader />
      </Example>
      <Example title="Tray with Sticky Footer">
        <TrayWithStickyFooter />
      </Example>
    </ExampleScreen>
  );
};

export default TrayResponsiveExamplesScreen;
