import React, { useState } from 'react';
import { Image, ScrollView } from 'react-native';

import { Button } from '../../buttons/Button';
import { ListCell } from '../../cells/ListCell';
import { Example, ExampleScreen } from '../../examples/ExampleScreen';
import { Pictogram } from '../../illustrations/Pictogram';
import { Box, VStack } from '../../layout';
import { Text } from '../../typography/Text';
import { Tray } from '../tray/Tray';

/**
 * These examples match the web Composed Examples to compare mobile/web parity.
 * All use handleBarVariant="inside" which is the recommended pattern.
 */

export const TrayBasicWithHandleBar = () => {
  const [visible, setVisible] = useState(false);

  return (
    <ExampleScreen>
      <Example title="Basic Tray with Handle Bar">
        <Button onPress={() => setVisible(true)}>Open Tray</Button>
        {visible && (
          <Tray handleBarVariant="inside" onCloseComplete={() => setVisible(false)} title="Header">
            <Text>This is the content of the tray.</Text>
          </Tray>
        )}
      </Example>
    </ExampleScreen>
  );
};

export const TrayWithIllustration = () => {
  const [visible, setVisible] = useState(false);

  return (
    <ExampleScreen>
      <Example title="Tray with Illustration">
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
            <Text color="fgMuted" paddingBottom={2}>
              Curabitur commodo nulla vel dolor vulputate vestibulum. Nulla et nisl molestie,
              interdum lorem id, viverra.
            </Text>
          </Tray>
        )}
      </Example>
    </ExampleScreen>
  );
};

export const TrayWithListCells = () => {
  const [visible, setVisible] = useState(false);

  return (
    <ExampleScreen>
      <Example title="Tray with List Cells">
        <Button onPress={() => setVisible(true)}>Open ListCells Tray</Button>
        {visible && (
          <Tray
            disableCapturePanGestureToDismiss
            handleBarVariant="inside"
            onCloseComplete={() => setVisible(false)}
            title="Section header"
          >
            <ScrollView style={{ maxHeight: 400 }}>
              <VStack>
                {Array.from({ length: 20 }, (_, i) => (
                  <ListCell
                    key={i}
                    accessory="arrow"
                    description="Description"
                    onPress={() => {}}
                    spacingVariant="condensed"
                    title="Title"
                  />
                ))}
              </VStack>
            </ScrollView>
          </Tray>
        )}
      </Example>
    </ExampleScreen>
  );
};

export const TrayWithCustomImageHeader = () => {
  const [visible, setVisible] = useState(false);

  return (
    <ExampleScreen>
      <Example title="Tray with Custom Image Header">
        <Button onPress={() => setVisible(true)}>Open Custom Header Tray</Button>
        {visible && (
          <Tray
            handleBarVariant="inside"
            header={
              <Box height={220} width="100%">
                <Image
                  resizeMode="cover"
                  source={{
                    uri: 'https://images.ctfassets.net/o10es7wu5gm1/4BsskcYybNIDMYTeMpkFPG/216eb97727f834346649004a5d66cd3f/Coinbase_Press_Page_Product_Image.png',
                  }}
                  style={{ width: '100%', height: '100%' }}
                />
              </Box>
            }
            onCloseComplete={() => setVisible(false)}
          >
            <VStack paddingTop={2}>
              <Text font="title3" paddingBottom={0.75}>
                Header
              </Text>
              <VStack gap={2} paddingBottom={2}>
                <Text>This is the content of the tray.</Text>
              </VStack>
            </VStack>
          </Tray>
        )}
      </Example>
    </ExampleScreen>
  );
};

export default TrayBasicWithHandleBar;
