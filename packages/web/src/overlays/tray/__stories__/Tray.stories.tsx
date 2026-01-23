import React, { useRef, useState } from 'react';
import type { Meta } from '@storybook/react';

import { Button } from '../../../buttons/Button';
import { IconButton } from '../../../buttons/IconButton';
import { useBreakpoints } from '../../../hooks/useBreakpoints';
import { Icon } from '../../../icons/Icon';
import { Pictogram } from '../../../illustrations/Pictogram';
import { Box } from '../../../layout/Box';
import { HStack } from '../../../layout/HStack';
import { VStack } from '../../../layout/VStack';
import { PageFooter } from '../../../page/PageFooter';
import { Text } from '../../../typography/Text';
import type { TrayRefProps } from '../Tray';
import { Tray } from '../Tray';

export default {
  title: 'Components/Tray',
  component: Tray,
} as Meta;

const longContent = (
  <VStack gap={1}>
    <Text font="body">
      This example demonstrates how the tray handles a large amount of content. The tray should
      expand appropriately and enable scrolling when needed.
    </Text>
    {Array(20)
      .fill(0)
      .map((_, i) => (
        <Text key={i} font="body">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget aliquam
          ultricies, nunc nisl aliquet nunc, quis aliquam nunc nisl eu nunc.
          {i % 2 === 0 && ' Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor.'}
          {i % 3 === 0 && ' Ut in nulla enim. Phasellus molestie magna non est bibendum.'}
        </Text>
      ))}
  </VStack>
);

export const Default = () => {
  const [showBasicTray, setShowBasicTray] = useState(false);
  const [showCustomTitleTray, setShowCustomTitleTray] = useState(false);
  const [showFooterTray, setShowFooterTray] = useState(false);
  const [showPreventDismissTray, setShowPreventDismissTray] = useState(false);
  const [showCloseWithRefTray, setShowCloseWithRefTray] = useState(false);
  const [showLongContentTray, setShowLongContentTray] = useState(false);
  const [showNoTitleTray, setShowNoTitleTray] = useState(false);
  const [showPinnedTopTray, setShowPinnedTopTray] = useState(false);
  const [showPinnedRightTray, setShowPinnedRightTray] = useState(false);
  const [showPinnedLeftTray, setShowPinnedLeftTray] = useState(false);
  const [showLongContentPinnedTopTray, setShowLongContentPinnedTopTray] = useState(false);
  const [showLongContentPinnedRightTray, setShowLongContentPinnedRightTray] = useState(false);
  // Refs for controlling trays
  const preventDismissTrayRef = useRef<TrayRefProps>(null);

  return (
    <VStack gap={4} padding={1}>
      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Basic Tray with String Title</Text>
        <Button onClick={() => setShowBasicTray(true)}>Open Basic Tray</Button>
        {showBasicTray && (
          <Tray onCloseComplete={() => setShowBasicTray(false)} title="Basic Tray Example">
            <VStack gap={1}>
              <Text font="body">
                This is a basic tray with a simple string title. Clicking outside or pressing ESC
                will close it.
              </Text>
              <Text font="body">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget
                aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nunc nisl eu nunc.
              </Text>
            </VStack>
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Tray with Custom Title Component</Text>
        <Button onClick={() => setShowCustomTitleTray(true)}>Open Custom Title Tray</Button>
        {showCustomTitleTray && (
          <Tray
            onCloseComplete={() => setShowCustomTitleTray(false)}
            title={
              <HStack alignItems="center">
                <Text color="fgPrimary" font="title3">
                  Custom Title Component
                </Text>
              </HStack>
            }
          >
            <VStack gap={1}>
              <Text font="body">
                This tray demonstrates using a custom component for the title.
              </Text>
              <Text font="body">
                You can use any React component as the title, giving you flexibility in customizing
                the appearance.
              </Text>
            </VStack>
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Basic Tray with No Title</Text>
        <Button onClick={() => setShowNoTitleTray(true)}>Open Basic Tray With No Title</Button>
        {showNoTitleTray && (
          <Tray onCloseComplete={() => setShowNoTitleTray(false)}>
            <VStack gap={1}>
              <Text font="body">
                This is a basic tray without a title. Clicking outside or pressing ESC will close
                it.
              </Text>
              <Text font="body">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget
                aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nunc nisl eu nunc.
              </Text>
            </VStack>
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Tray with Footer</Text>
        <Button onClick={() => setShowFooterTray(true)}>Open Tray with Footer</Button>
        {showFooterTray && (
          <Tray
            footer={
              <HStack justifyContent="flex-end" padding={2}>
                <Button onClick={() => setShowFooterTray(false)} variant="primary">
                  Close
                </Button>
              </HStack>
            }
            onCloseComplete={() => setShowFooterTray(false)}
            title="Tray with Footer"
          >
            <VStack gap={1}>
              <Text font="body">
                This example demonstrates a tray with a sticky footer using the footer prop.
              </Text>
              <Text font="body">
                The footer prop provides a more intuitive API and automatically handles the styling
                and positioning.
              </Text>
              <Text font="body">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget
                aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nunc nisl eu nunc.
              </Text>
              <Text font="body">
                Nullam euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, quis aliquam
                nunc nisl eu nunc.
              </Text>
            </VStack>
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Tray with Prevent Dismiss</Text>
        <Button onClick={() => setShowPreventDismissTray(true)}>Open Non-Dismissible Tray</Button>
        {showPreventDismissTray && (
          <Tray
            preventDismiss
            onCloseComplete={() => setShowPreventDismissTray(false)}
            title="Non-Dismissible Tray"
          >
            {({ handleClose }) => (
              <VStack gap={1}>
                <Text font="body">
                  This tray cannot be dismissed by clicking outside or pressing ESC. You must use
                  the button below to close it.
                </Text>
                <Button onClick={handleClose}>Close Tray</Button>
              </VStack>
            )}
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Close With a Ref</Text>
        <Button onClick={() => setShowCloseWithRefTray(true)}>Open Close With Ref Tray</Button>
        {showCloseWithRefTray && (
          <Tray
            ref={preventDismissTrayRef}
            preventDismiss
            onCloseComplete={() => setShowCloseWithRefTray(false)}
            title="Close With Ref Tray"
          >
            <VStack gap={1}>
              <Text font="body">
                This tray includes a button that closes using the imperative handle on the ref.
              </Text>
              <Button onClick={() => preventDismissTrayRef.current?.close()}>Close Tray</Button>
            </VStack>
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Tray with Long Content</Text>
        <Button onClick={() => setShowLongContentTray(true)}>Open Long Content Tray</Button>
        {showLongContentTray && (
          <Tray onCloseComplete={() => setShowLongContentTray(false)} title="Long Content Example">
            {longContent}
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Pinned to Right</Text>
        <Button onClick={() => setShowPinnedRightTray(true)}>Open Pinned Right Tray</Button>
        {showPinnedRightTray && (
          <Tray
            onCloseComplete={() => setShowPinnedRightTray(false)}
            pin="right"
            title="Pinned Right Tray Example"
          >
            <VStack gap={1}>
              <Text font="body">
                This is a basic tray with a simple string title. Clicking outside or pressing ESC
                will close it.
              </Text>
              <Text font="body">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget
                aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nunc nisl eu nunc.
              </Text>
            </VStack>
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Pinned to Left</Text>
        <Button onClick={() => setShowPinnedLeftTray(true)}>Open Pinned Left Tray</Button>
        {showPinnedLeftTray && (
          <Tray
            onCloseComplete={() => setShowPinnedLeftTray(false)}
            pin="left"
            title="Pinned Left Tray Example"
          >
            <VStack gap={1}>
              <Text font="body">
                This is a basic tray with a simple string title. Clicking outside or pressing ESC
                will close it.
              </Text>
              <Text font="body">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget
                aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nunc nisl eu nunc.
              </Text>
            </VStack>
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Pinned to Top</Text>
        <Button onClick={() => setShowPinnedTopTray(true)}>Open Pinned Top Tray</Button>
        {showPinnedTopTray && (
          <Tray
            onCloseComplete={() => setShowPinnedTopTray(false)}
            pin="top"
            title="Pinned Top Tray Example"
          >
            <VStack gap={1}>
              <Text font="body">
                This is a basic tray with a simple string title. Clicking outside or pressing ESC
                will close it.
              </Text>
              <Text font="body">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget
                aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nunc nisl eu nunc.
              </Text>
            </VStack>
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Tray with Long Content Pinned to Top</Text>
        <Button onClick={() => setShowLongContentPinnedTopTray(true)}>
          Open Long Content Top Tray
        </Button>
        {showLongContentPinnedTopTray && (
          <Tray
            onCloseComplete={() => setShowLongContentPinnedTopTray(false)}
            pin="top"
            title="Long Content Top Example"
          >
            {longContent}
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Tray with Long Content Pinned to Right</Text>
        <Button onClick={() => setShowLongContentPinnedRightTray(true)}>
          Open Long Content Right Tray
        </Button>
        {showLongContentPinnedRightTray && (
          <Tray
            onCloseComplete={() => setShowLongContentPinnedRightTray(false)}
            pin="right"
            title="Long Content Right Example"
          >
            {longContent}
          </Tray>
        )}
      </VStack>
    </VStack>
  );
};

export const HandleBar = () => {
  const [showOutsideHandleBar, setShowOutsideHandleBar] = useState(false);
  const [showInsideHandleBar, setShowInsideHandleBar] = useState(false);

  return (
    <VStack gap={4} padding={1}>
      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Handle Bar (Outside - Default)</Text>
        <Button onClick={() => setShowOutsideHandleBar(true)}>Open Tray with Handle Bar</Button>
        {showOutsideHandleBar && (
          <Tray
            showHandleBar
            onCloseComplete={() => setShowOutsideHandleBar(false)}
            title="Handle Bar Outside"
          >
            <VStack gap={1}>
              <Text font="body">
                This tray has a handle bar positioned outside the container. The handle bar only
                appears when pin=&quot;bottom&quot; (the default).
              </Text>
            </VStack>
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Handle Bar (Inside)</Text>
        <Button onClick={() => setShowInsideHandleBar(true)}>
          Open Tray with Inside Handle Bar
        </Button>
        {showInsideHandleBar && (
          <Tray
            showHandleBar
            onCloseComplete={() => setShowInsideHandleBar(false)}
            title="Handle Bar Inside"
          >
            <VStack gap={1}>
              <Text font="body">
                This tray has a handle bar positioned inside the container with a semi-transparent
                appearance matching mobile behavior.
              </Text>
            </VStack>
          </Tray>
        )}
      </VStack>
    </VStack>
  );
};

export const HeaderAndFooterRenderFunctions = () => {
  const [showHeaderRender, setShowHeaderRender] = useState(false);
  const [showFooterRender, setShowFooterRender] = useState(false);
  const [showBothRender, setShowBothRender] = useState(false);

  return (
    <VStack gap={4} padding={1}>
      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Header as Render Function</Text>
        <Button onClick={() => setShowHeaderRender(true)}>Open Tray with Header Function</Button>
        {showHeaderRender && (
          <Tray
            hideHeader
            header={({ handleClose }) => (
              <HStack alignItems="center" gap={2} padding={2}>
                <IconButton transparent name="backArrow" onClick={handleClose} />
                <Text font="headline">Custom Header with Back</Text>
              </HStack>
            )}
            onCloseComplete={() => setShowHeaderRender(false)}
          >
            <VStack gap={1}>
              <Text font="body">
                This tray uses a render function for the header prop, giving access to handleClose.
              </Text>
            </VStack>
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Footer as Render Function</Text>
        <Button onClick={() => setShowFooterRender(true)}>Open Tray with Footer Function</Button>
        {showFooterRender && (
          <Tray
            footer={({ handleClose }) => (
              <HStack gap={2} justifyContent="flex-end" padding={2}>
                <Button onClick={handleClose} variant="secondary">
                  Cancel
                </Button>
                <Button onClick={handleClose}>Confirm</Button>
              </HStack>
            )}
            onCloseComplete={() => setShowFooterRender(false)}
            title="Footer Render Function"
          >
            <VStack gap={1}>
              <Text font="body">
                This tray uses a render function for the footer prop, giving access to handleClose
                for the action buttons.
              </Text>
            </VStack>
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Both Header and Footer as Render Functions</Text>
        <Button onClick={() => setShowBothRender(true)}>Open Tray with Both</Button>
        {showBothRender && (
          <Tray
            hideHeader
            footer={({ handleClose }) => (
              <HStack gap={2} padding={2}>
                <Button flexGrow={1} onClick={handleClose} variant="secondary">
                  Cancel
                </Button>
                <Button flexGrow={1} onClick={handleClose}>
                  Save
                </Button>
              </HStack>
            )}
            header={({ handleClose }) => (
              <HStack alignItems="center" justifyContent="space-between" padding={2}>
                <IconButton transparent name="backArrow" onClick={handleClose} />
                <Text font="headline">Custom Header</Text>
                <Box width={40} />
              </HStack>
            )}
            onCloseComplete={() => setShowBothRender(false)}
          >
            <VStack gap={1} paddingY={2}>
              <Text font="body">
                This tray uses render functions for both header and footer props.
              </Text>
              <Text font="body">
                The hideHeader prop is used to hide the default title/close button section.
              </Text>
            </VStack>
          </Tray>
        )}
      </VStack>
    </VStack>
  );
};

export const CustomTitleVariants = () => {
  const [showPictogramTitle, setShowPictogramTitle] = useState(false);
  const [showBackArrowTitle, setShowBackArrowTitle] = useState(false);
  const [showHideHeader, setShowHideHeader] = useState(false);

  return (
    <VStack gap={4} padding={1}>
      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Title with Pictogram</Text>
        <Button onClick={() => setShowPictogramTitle(true)}>Open Tray with Pictogram</Button>
        {showPictogramTitle && (
          <Tray
            onCloseComplete={() => setShowPictogramTitle(false)}
            title={
              <VStack gap={2}>
                <Pictogram name="addWallet" />
                <Text font="title3">Add Wallet</Text>
              </VStack>
            }
          >
            <VStack gap={1}>
              <Text font="body">This tray has a custom title with a pictogram illustration.</Text>
            </VStack>
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Title with Back Arrow</Text>
        <Button onClick={() => setShowBackArrowTitle(true)}>Open Tray with Back Arrow</Button>
        {showBackArrowTitle && (
          <Tray
            onCloseComplete={() => setShowBackArrowTitle(false)}
            pin="right"
            title={
              <VStack>
                <IconButton transparent margin={-1.5} name="backArrow" onClick={() => {}} />
                <Text font="title3" paddingTop={1.5}>
                  Details
                </Text>
              </VStack>
            }
          >
            <VStack gap={1}>
              <Text font="body">This tray has a custom title with a back arrow button.</Text>
            </VStack>
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Hide Header</Text>
        <Button onClick={() => setShowHideHeader(true)}>Open Tray with Hidden Header</Button>
        {showHideHeader && (
          <Tray
            hideHeader
            onCloseComplete={() => setShowHideHeader(false)}
            title="This title is hidden"
          >
            {({ handleClose }) => (
              <VStack gap={2} paddingY={2}>
                <Text font="title3">Custom Content Only</Text>
                <Text font="body">
                  This tray uses hideHeader to remove the default title and close button section.
                  You can provide your own header content.
                </Text>
                <Button onClick={handleClose}>Close</Button>
              </VStack>
            )}
          </Tray>
        )}
      </VStack>
    </VStack>
  );
};

/**
 * Mobile Web Responsive Patterns
 *
 * These stories demonstrate responsive tray patterns that adapt between
 * mobile web (bottom sheet) and desktop (side drawer) based on viewport.
 */
export const MobileWebResponsive = () => {
  const [showBasic, setShowBasic] = useState(false);
  const [showWithIllustration, setShowWithIllustration] = useState(false);
  const [showWithListCells, setShowWithListCells] = useState(false);
  const [showWithScrollableContent, setShowWithScrollableContent] = useState(false);
  const { isPhone } = useBreakpoints();

  // Mobile web specific styles matching Figma specs
  const mobileWebStyles = {
    container: {
      maxHeight: 650,
    },
  };

  return (
    <VStack gap={4} padding={1}>
      <Text font="title3">Mobile Web Responsive Patterns (resize viewport to see changes)</Text>
      <Text color="fgMuted" font="body">
        Current mode: {isPhone ? 'Mobile Web (bottom sheet)' : 'Desktop (side drawer)'}
      </Text>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Basic Mobile Web Pattern</Text>
        <Button onClick={() => setShowBasic(true)}>Open Basic Responsive Tray</Button>
        {showBasic && (
          <Tray
            footer={({ handleClose }) =>
              isPhone ? (
                <Box borderedTop background="bg" paddingX={3} paddingY={1.5}>
                  <Button block onClick={handleClose}>
                    Continue
                  </Button>
                </Box>
              ) : (
                <PageFooter
                  borderedTop
                  action={<Button onClick={handleClose}>Continue</Button>}
                  justifyContent="flex-end"
                />
              )
            }
            header={
              isPhone ? (
                <Box paddingBottom={0.75} paddingTop={1} paddingX={3}>
                  <Text font="title3">Select an option</Text>
                </Box>
              ) : undefined
            }
            hideHeader={isPhone}
            onCloseComplete={() => setShowBasic(false)}
            pin={isPhone ? 'bottom' : 'right'}
            showHandleBar={isPhone}
            styles={isPhone ? mobileWebStyles : undefined}
            title={!isPhone ? 'Select an option' : undefined}
          >
            <VStack gap={2} paddingBottom={2}>
              <Text color="fgMuted">
                This tray adapts between mobile web (bottom sheet with handle bar, no close button)
                and desktop (side drawer with close button).
              </Text>
              {['Option A', 'Option B', 'Option C', 'Option D'].map((option) => (
                <Box
                  key={option}
                  background="bgSecondary"
                  borderRadius={200}
                  padding={2}
                  style={{ cursor: 'pointer' }}
                >
                  <HStack alignItems="center" justifyContent="space-between">
                    <Text>{option}</Text>
                    <Icon color="fgMuted" name="caretRight" />
                  </HStack>
                </Box>
              ))}
            </VStack>
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Mobile Web with Illustration</Text>
        <Button onClick={() => setShowWithIllustration(true)}>Open Tray with Illustration</Button>
        {showWithIllustration && (
          <Tray
            footer={({ handleClose }) =>
              isPhone ? (
                <Box borderedTop background="bg" paddingX={3} paddingY={1.5}>
                  <Button block onClick={handleClose}>
                    Get started
                  </Button>
                </Box>
              ) : (
                <PageFooter
                  borderedTop
                  action={<Button onClick={handleClose}>Get started</Button>}
                  justifyContent="flex-end"
                />
              )
            }
            header={
              isPhone ? (
                <VStack alignItems="center" gap={2} paddingBottom={1} paddingTop={2}>
                  <Pictogram name="addWallet" />
                  <Text font="title3">Welcome aboard</Text>
                </VStack>
              ) : undefined
            }
            hideHeader={isPhone}
            onCloseComplete={() => setShowWithIllustration(false)}
            pin={isPhone ? 'bottom' : 'right'}
            showHandleBar={isPhone}
            styles={isPhone ? mobileWebStyles : undefined}
            title={
              !isPhone ? (
                <VStack gap={2}>
                  <Pictogram name="addWallet" />
                  <Text font="title3">Welcome aboard</Text>
                </VStack>
              ) : undefined
            }
          >
            <VStack gap={2} paddingY={2}>
              <Text color="fgMuted" textAlign={isPhone ? 'center' : 'start'}>
                You&apos;re all set up and ready to explore. Let&apos;s get you started with the
                basics.
              </Text>
            </VStack>
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Mobile Web with List Cells</Text>
        <Button onClick={() => setShowWithListCells(true)}>Open Tray with List Cells</Button>
        {showWithListCells && (
          <Tray
            footer={({ handleClose }) =>
              isPhone ? (
                <Box borderedTop background="bg" paddingX={3} paddingY={1.5}>
                  <Button block onClick={handleClose}>
                    Confirm
                  </Button>
                </Box>
              ) : (
                <PageFooter
                  borderedTop
                  action={<Button onClick={handleClose}>Confirm</Button>}
                  justifyContent="flex-end"
                />
              )
            }
            header={
              isPhone ? (
                <Box paddingBottom={0.75} paddingTop={1} paddingX={3}>
                  <Text font="title3">Choose payment method</Text>
                </Box>
              ) : undefined
            }
            hideHeader={isPhone}
            onCloseComplete={() => setShowWithListCells(false)}
            pin={isPhone ? 'bottom' : 'right'}
            showHandleBar={isPhone}
            styles={isPhone ? mobileWebStyles : undefined}
            title={!isPhone ? 'Choose payment method' : undefined}
          >
            <VStack gap={1} paddingBottom={2}>
              {[
                { title: 'Credit Card', subtitle: 'Visa ending in 4242' },
                { title: 'Bank Account', subtitle: 'Chase ending in 1234' },
                { title: 'PayPal', subtitle: 'john@example.com' },
                { title: 'Apple Pay', subtitle: 'Visa ending in 4242' },
              ].map((item, index) => (
                <Box
                  key={index}
                  background="bgSecondary"
                  borderRadius={200}
                  padding={2}
                  style={{ cursor: 'pointer' }}
                >
                  <HStack alignItems="center" justifyContent="space-between">
                    <VStack gap={0.25}>
                      <Text font="headline">{item.title}</Text>
                      <Text color="fgMuted" font="caption">
                        {item.subtitle}
                      </Text>
                    </VStack>
                    <Icon color="fgPrimary" name="checkmark" />
                  </HStack>
                </Box>
              ))}
            </VStack>
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Mobile Web with Scrollable Content</Text>
        <Button onClick={() => setShowWithScrollableContent(true)}>
          Open Tray with Scrollable Content
        </Button>
        {showWithScrollableContent && (
          <Tray
            footer={({ handleClose }) =>
              isPhone ? (
                <Box borderedTop background="bg" paddingX={3} paddingY={1.5}>
                  <Button block onClick={handleClose}>
                    I Agree
                  </Button>
                </Box>
              ) : (
                <PageFooter
                  borderedTop
                  action={<Button onClick={handleClose}>I Agree</Button>}
                  justifyContent="flex-end"
                />
              )
            }
            header={
              isPhone ? (
                <Box paddingBottom={0.75} paddingTop={1} paddingX={3}>
                  <Text font="title3">Terms and Conditions</Text>
                </Box>
              ) : undefined
            }
            hideHeader={isPhone}
            onCloseComplete={() => setShowWithScrollableContent(false)}
            pin={isPhone ? 'bottom' : 'right'}
            showHandleBar={isPhone}
            styles={isPhone ? mobileWebStyles : undefined}
            title={!isPhone ? 'Terms and Conditions' : undefined}
          >
            <VStack gap={2} paddingBottom={2}>
              {Array.from({ length: 15 }, (_, i) => (
                <Text key={i} color="fgMuted" font="body">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                  exercitation ullamco laboris.
                </Text>
              ))}
            </VStack>
          </Tray>
        )}
      </VStack>
    </VStack>
  );
};

/**
 * Desktop-only variants pinned to right (matching Figma Desktop Tray specs)
 */
export const DesktopRightPinned = () => {
  const [showStandard, setShowStandard] = useState(false);
  const [showWithIllustration, setShowWithIllustration] = useState(false);
  const [showWithFullBleedImage, setShowWithFullBleedImage] = useState(false);

  return (
    <VStack gap={4} padding={1}>
      <Text font="title3">Desktop Tray Variants (pinned right)</Text>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Standard Desktop Tray</Text>
        <Button onClick={() => setShowStandard(true)}>Open Standard Tray</Button>
        {showStandard && (
          <Tray
            footer={({ handleClose }) => (
              <PageFooter
                borderedTop
                action={<Button onClick={handleClose}>Continue</Button>}
                justifyContent="flex-end"
              />
            )}
            onCloseComplete={() => setShowStandard(false)}
            pin="right"
            title="Section header"
          >
            <VStack gap={2} paddingBottom={2}>
              <Text color="fgMuted">
                Standard desktop tray pinned to the right with section header, close button, and
                PageFooter.
              </Text>
              {Array.from({ length: 5 }, (_, i) => (
                <Box key={i} background="bgSecondary" borderRadius={200} padding={2}>
                  <Text>Item {i + 1}</Text>
                </Box>
              ))}
            </VStack>
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Desktop Tray with Pictogram</Text>
        <Button onClick={() => setShowWithIllustration(true)}>Open Illustration Tray</Button>
        {showWithIllustration && (
          <Tray
            footer={({ handleClose }) => (
              <PageFooter
                borderedTop
                action={<Button onClick={handleClose}>Get Started</Button>}
                justifyContent="flex-end"
              />
            )}
            onCloseComplete={() => setShowWithIllustration(false)}
            pin="right"
            title={
              <VStack gap={2}>
                <Pictogram name="addWallet" />
                <Text font="title3">Add Wallet</Text>
              </VStack>
            }
          >
            <VStack gap={2} paddingBottom={2}>
              <Text color="fgMuted">
                Desktop tray with pictogram illustration in the header area.
              </Text>
            </VStack>
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Desktop Tray with Full-Bleed Image</Text>
        <Button onClick={() => setShowWithFullBleedImage(true)}>Open Full-Bleed Image Tray</Button>
        {showWithFullBleedImage && (
          <Tray
            hideHeader
            footer={({ handleClose }) => (
              <PageFooter
                borderedTop
                action={<Button onClick={handleClose}>Learn More</Button>}
                justifyContent="flex-end"
              />
            )}
            header={
              <Box
                style={{
                  backgroundImage:
                    'url(https://images.ctfassets.net/o10es7wu5gm1/4BsskcYybNIDMYTeMpkFPG/216eb97727f834346649004a5d66cd3f/Coinbase_Press_Page_Product_Image.png?fm=avif&w=641&h=426&q=65)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  minHeight: 220,
                }}
              />
            }
            onCloseComplete={() => setShowWithFullBleedImage(false)}
            pin="right"
            styles={{
              header: {
                backgroundImage:
                  'url(https://images.ctfassets.net/o10es7wu5gm1/4BsskcYybNIDMYTeMpkFPG/216eb97727f834346649004a5d66cd3f/Coinbase_Press_Page_Product_Image.png?fm=avif&w=641&h=426&q=65)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                minHeight: 220,
              },
            }}
          >
            <VStack gap={2} paddingY={2}>
              <Text font="title3">Featured Content</Text>
              <Text color="fgMuted">
                Desktop tray with a full-bleed background image in the header area.
              </Text>
            </VStack>
          </Tray>
        )}
      </VStack>
    </VStack>
  );
};

/**
 * Mobile Web Footer Variants
 *
 * Testing different footer configurations for mobile web to match Figma specs.
 */
export const MobileWebFooterVariants = () => {
  const [showWithButton, setShowWithButton] = useState(false);
  const [showWithNumpad, setShowWithNumpad] = useState(false);
  const [showNoFooter, setShowNoFooter] = useState(false);

  // Mobile web specific styles
  const mobileWebStyles = {
    container: {
      maxHeight: 650,
    },
  };

  return (
    <VStack gap={4} padding={1}>
      <Text font="title3">Mobile Web Footer Variants</Text>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Footer with Button (most common)</Text>
        <Button onClick={() => setShowWithButton(true)}>Open Tray</Button>
        {showWithButton && (
          <Tray
            hideHeader
            showHandleBar
            footer={({ handleClose }) => (
              <Box borderedTop background="bg" paddingX={3} paddingY={1.5}>
                <Button block onClick={handleClose}>
                  Button
                </Button>
              </Box>
            )}
            header={
              <Box paddingBottom={0.75} paddingTop={1} paddingX={3}>
                <Text font="title3">Header</Text>
              </Box>
            }
            onCloseComplete={() => setShowWithButton(false)}
            pin="bottom"
            styles={mobileWebStyles}
          >
            <VStack gap={2} paddingBottom={2}>
              <Text color="fgMuted" font="body">
                Mobile web tray with button footer.
              </Text>
            </VStack>
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Footer with Two Buttons</Text>
        <Button onClick={() => setShowWithNumpad(true)}>Open Tray</Button>
        {showWithNumpad && (
          <Tray
            hideHeader
            showHandleBar
            footer={({ handleClose }) => (
              <Box borderedTop background="bg" paddingX={3} paddingY={1.5}>
                <HStack gap={2}>
                  <Button flexGrow={1} onClick={handleClose} variant="secondary">
                    Cancel
                  </Button>
                  <Button flexGrow={1} onClick={handleClose}>
                    Confirm
                  </Button>
                </HStack>
              </Box>
            )}
            header={
              <Box paddingBottom={0.75} paddingTop={1} paddingX={3}>
                <Text font="title3">Confirm Action</Text>
              </Box>
            }
            onCloseComplete={() => setShowWithNumpad(false)}
            pin="bottom"
            styles={mobileWebStyles}
          >
            <VStack gap={2} paddingBottom={2}>
              <Text color="fgMuted" font="body">
                Mobile web tray with two-button footer.
              </Text>
            </VStack>
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">No Footer</Text>
        <Button onClick={() => setShowNoFooter(true)}>Open Tray</Button>
        {showNoFooter && (
          <Tray
            hideHeader
            showHandleBar
            header={
              <Box paddingBottom={0.75} paddingTop={1} paddingX={3}>
                <Text font="title3">Select Option</Text>
              </Box>
            }
            onCloseComplete={() => setShowNoFooter(false)}
            pin="bottom"
            styles={mobileWebStyles}
          >
            {({ handleClose }) => (
              <VStack gap={1} paddingBottom={2}>
                {['Option 1', 'Option 2', 'Option 3'].map((option) => (
                  <Box
                    key={option}
                    background="bgSecondary"
                    borderRadius={200}
                    onClick={handleClose}
                    padding={2}
                    style={{ cursor: 'pointer' }}
                  >
                    <Text>{option}</Text>
                  </Box>
                ))}
              </VStack>
            )}
          </Tray>
        )}
      </VStack>
    </VStack>
  );
};

/**
 * Illustration Informational Pattern
 *
 * Trays with illustration/pictogram for informational purposes
 * without a footer action button. Matches Figma design node 6805-56617.
 */
export const IllustrationInformational = () => {
  const [showMobile, setShowMobile] = useState(false);
  const [showDesktop, setShowDesktop] = useState(false);
  const { isPhone } = useBreakpoints();

  const mobileWebStyles = {
    container: {
      maxHeight: 650,
    },
  };

  return (
    <VStack gap={4} padding={1}>
      <Text font="title3">Illustration Informational Pattern</Text>
      <Text color="fgMuted" font="body">
        Trays with illustration for informational purposes, no footer action.
      </Text>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Mobile Web (Bottom Sheet)</Text>
        <Button onClick={() => setShowMobile(true)}>Open Mobile Illustration Tray</Button>
        {showMobile && (
          <Tray
            hideHeader
            showHandleBar
            header={
              <VStack gap={1.5} paddingX={3}>
                <Pictogram name="addWallet" />
                <Text font="title3">Add a Wallet</Text>
              </VStack>
            }
            onCloseComplete={() => setShowMobile(false)}
            pin="bottom"
            styles={mobileWebStyles}
          >
            <VStack paddingBottom={3}>
              <Text color="fgMuted" font="body">
                Curabitur commodo nulla vel dolor vulputate vestibulum. Nulla et nisl molestie,
                interdum lorem id, viverra.
              </Text>
            </VStack>
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Desktop (Side Drawer)</Text>
        <Button onClick={() => setShowDesktop(true)}>Open Desktop Illustration Tray</Button>
        {showDesktop && (
          <Tray onCloseComplete={() => setShowDesktop(false)} pin="right">
            <VStack gap={1.5} paddingBottom={3}>
              <Pictogram name="addWallet" />
              <Text font="title3">Section header</Text>
              <Text color="fgMuted" font="body">
                Curabitur commodo nulla vel dolor vulputate vestibulum. Nulla et nisl molestie,
                interdum lorem id, viverra.
              </Text>
            </VStack>
          </Tray>
        )}
      </VStack>

      <VStack alignItems="flex-start" gap={2}>
        <Text font="headline">Responsive (adapts to viewport)</Text>
        <Text color="fgMuted" font="body">
          Current mode: {isPhone ? 'Mobile Web (bottom sheet)' : 'Desktop (side drawer)'}
        </Text>
      </VStack>
    </VStack>
  );
};
