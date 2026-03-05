import React, { useState } from 'react';
import { BrowserRouter as Router, Link as RRLink } from 'react-router-dom';
import { noop } from '@coinbase/cds-utils';

import { ListCell } from '../../cells';
import { useBreakpoints } from '../../hooks/useBreakpoints';
import { HStack, VStack } from '../../layout';
import { Tray } from '../../overlays';
import { SectionHeader } from '../../section-header';
import { Link } from '../Link';
import { Text } from '../Text';

const Example: React.FC<
  React.PropsWithChildren<{ title: string; description?: string | React.ReactNode }>
> = ({ children, title, description }) => {
  return (
    <VStack gap={2}>
      <Text as="h2" display="block" font="title3">
        {title}
      </Text>
      {description}
      {children}
    </VStack>
  );
};

export const Default = () => (
  <div>
    <Link href="https://www.google.com/">Default</Link>
    <br />
    <Link as="button" onClick={noop}>
      As a button
    </Link>
  </div>
);

export const VariantBody = () => (
  <Link font="body" href="https://www.google.com/">
    Body
  </Link>
);

export const NegativeColor = () => (
  <div>
    <Link color="fgNegative" font="headline" href="https://www.google.com/">
      Negative
    </Link>
  </div>
);

export const Underline = () => (
  <div>
    <Link underline href="https://www.google.com/">
      Default
    </Link>
    <br />
    <Link underline as="button" onClick={noop}>
      As a button
    </Link>
    <br />
    <Link underline font="body" href="https://www.google.com/">
      Body
    </Link>
    <br />
    <Link underline color="fgNegative" font="headline" href="https://www.google.com/">
      Negative
    </Link>
  </div>
);

export const DottedUnderline = () => {
  const { isPhone } = useBreakpoints();
  const [isTrayOpen, setIsTrayOpen] = useState(false);

  return (
    <VStack gap={4}>
      <Example title="Within ListCells">
        <VStack gap={1}>
          <SectionHeader paddingX={3} title="Key stats" />
          <HStack gap={2}>
            <ListCell
              subtitleNode={<Text font="headline">$243.23</Text>}
              titleNode={
                <Link
                  underline
                  color="fgMuted"
                  font="label2"
                  onClick={() => setIsTrayOpen(true)}
                  underlineVariant="dotted"
                >
                  Open
                </Link>
              }
            />
            <ListCell
              subtitleNode={<Text font="headline">$253.40 / $243.23</Text>}
              titleNode={
                <Link
                  underline
                  color="fgMuted"
                  font="label2"
                  onClick={() => setIsTrayOpen(true)}
                  underlineVariant="dotted"
                >
                  High/Low (today)
                </Link>
              }
            />
          </HStack>
          <HStack gap={2}>
            <ListCell
              subtitleNode={<Text font="headline">$1.4M</Text>}
              titleNode={
                <Link
                  underline
                  color="fgMuted"
                  font="label2"
                  onClick={() => setIsTrayOpen(true)}
                  underlineVariant="dotted"
                >
                  Volume (today)
                </Link>
              }
            />
            <ListCell
              subtitleNode={<Text font="headline">$234.09 - $254.87</Text>}
              titleNode={
                <Link
                  underline
                  color="fgMuted"
                  font="label2"
                  onClick={() => setIsTrayOpen(true)}
                  underlineVariant="dotted"
                >
                  52-week range
                </Link>
              }
            />
          </HStack>
          <HStack gap={2}>
            <ListCell
              subtitleNode={<Text font="headline">$24.93B</Text>}
              titleNode={
                <Link
                  underline
                  color="fgMuted"
                  font="label2"
                  onClick={() => setIsTrayOpen(true)}
                  underlineVariant="dotted"
                >
                  Market cap
                </Link>
              }
            />
          </HStack>
        </VStack>
        {isTrayOpen && (
          <Tray
            hideCloseButton={isPhone}
            onCloseComplete={() => setIsTrayOpen(false)}
            pin={isPhone ? 'bottom' : 'right'}
            showHandleBar={isPhone}
            title="Market cap"
          >
            <VStack gap={2} paddingBottom={3}>
              <Text color="fgMuted" font="body">
                The amount of money an entire company is worth to the market.
              </Text>
              <Text color="fgMuted" font="body">
                Company value, or market capitalization, refers to how much a company is worth as
                determined by the stock market, and is defined as the total market value of all
                outstanding shares.
              </Text>
              <Text color="fgMuted" font="body">
                Companies are typically divided according to market capitalization: large-cap ($10B
                or more), mid cap ($2B to $10B) and small cap ($300M to $2B)
              </Text>
            </VStack>
          </Tray>
        )}
      </Example>
      <Link
        underline
        color="fgMuted"
        font="legal"
        href="https://www.coinbase.com/"
        underlineVariant="dotted"
      >
        Legal
      </Link>
      <Link
        underline
        color="fgMuted"
        font="body"
        href="https://www.coinbase.com/"
        underlineVariant="dotted"
      >
        Body
      </Link>
      <Link
        underline
        color="fgMuted"
        font="label2"
        href="https://www.coinbase.com/"
        underlineVariant="dotted"
      >
        Label2
      </Link>
      <Link
        underline
        color="fgMuted"
        font="label1"
        href="https://www.coinbase.com/"
        underlineVariant="dotted"
      >
        Label1
      </Link>
      <Link
        underline
        color="fgMuted"
        font="headline"
        href="https://www.coinbase.com/"
        underlineVariant="dotted"
      >
        Headline
      </Link>
      <Link
        underline
        color="fgMuted"
        font="title3"
        href="https://www.coinbase.com/"
        underlineVariant="dotted"
      >
        Title3
      </Link>
      <VStack gap={2} paddingBottom={3}>
        <Text color="fgMuted" font="body">
          The amount of money an entire company is worth to the market.
        </Text>
        <Text color="fgMuted" font="body">
          Company value, or market capitalization, refers to how much a company is worth as
          determined by the stock market, and is defined as the total market value of all{' '}
          <Link
            underline
            color="fgMuted"
            href="https://www.coinbase.com/"
            underlineVariant="dotted"
          >
            outstanding shares
          </Link>
          .
        </Text>
        <Text color="fgMuted" font="body">
          Companies are typically divided according to market capitalization: large-cap ($10B or
          more), mid cap ($2B to $10B) and small cap ($300M to $2B)
        </Text>
      </VStack>
    </VStack>
  );
};

export const InAParagraph = () => (
  <div>
    <Text as="p" display="block" font="body">
      This is a paragraph, and we can include inline links{' '}
      <Link underline href="https://www.coinbase.com">
        with underlines
      </Link>{' '}
      by default. You dont have to do anything to get them!
    </Text>
    <Text as="p" display="block" font="body">
      {`This one however... It is a paragraph, but we can still set underline="false" to opt out of
      the a11y support `}
      <Link href="https://www.coinbase.com">without underlines</Link> . But why? Please dont do this
    </Text>
  </div>
);

export const InheritParentTextStyles = () => (
  <div>
    <Text font="body">
      Go here: <Link href="https://www.coinbase.com">Inherited</Link>
    </Text>
  </div>
);

export const DifferentTextStyle = () => (
  <div>
    <Text display="inline" font="body">
      Go here:{' '}
      <Link font="title3" href="https://www.coinbase.com">
        Title3
      </Link>
    </Text>
  </div>
);

export const OpenWindowInExistingTab = () => (
  <div>
    <Link font="title1" href="https://www.google.com/" target="_blank">
      Default
    </Link>
  </div>
);

export const SetsRelToNorefferer = () => (
  <div>
    <Link font="title2" href="https://www.google.com/" rel="noreferrer">
      Default
    </Link>
  </div>
);

export const SetsRelToNoopener = () => (
  <div>
    <Link font="title3" href="https://www.google.com/" rel="noopener">
      Default
    </Link>
  </div>
);

export const OnClick = () => (
  <div>
    <Link font="headline" href="#tagname" onClick={noop} rel="noopener">
      Link onClick
    </Link>
  </div>
);

export const RenderContainer = () => (
  <div>
    <Router>
      <Link as={RRLink} color="fgPrimary" font="body" onClick={noop} to="/invoices">
        Test renderContainer
      </Link>
    </Router>
  </div>
);

export const RenderContainerColor = () => (
  <div>
    <Router>
      <Link as={RRLink} color="fgNegative" font="label1" onClick={noop} to="/invoices">
        Test renderContainer
      </Link>
    </Router>
  </div>
);

export default {
  title: 'Components/Link',
  component: Link,
};
