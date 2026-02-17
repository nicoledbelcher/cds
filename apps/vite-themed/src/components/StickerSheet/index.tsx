import { memo } from 'react';
import type { ThemeVars } from '@coinbase/cds-common/core/theme';
import { assets } from '@coinbase/cds-common/internal/data/assets';
import { Accordion } from '@coinbase/cds-web/accordion/Accordion';
import { AccordionItem } from '@coinbase/cds-web/accordion/AccordionItem';
import { Banner } from '@coinbase/cds-web/banner/Banner';
import { Button } from '@coinbase/cds-web/buttons/Button';
import { IconButton } from '@coinbase/cds-web/buttons/IconButton';
import {
  FloatingAssetCard,
  type FloatingAssetCardProps,
} from '@coinbase/cds-web/cards/FloatingAssetCard';
import { NudgeCard } from '@coinbase/cds-web/cards/NudgeCard';
import { InputChip } from '@coinbase/cds-web/chips/InputChip';
import type { ThemeConfig } from '@coinbase/cds-web/core/theme';
import { useTheme } from '@coinbase/cds-web/hooks/useTheme';
import { Icon } from '@coinbase/cds-web/icons/Icon';
import { Pictogram } from '@coinbase/cds-web/illustrations/Pictogram';
import { Box } from '@coinbase/cds-web/layout/Box';
import { HStack } from '@coinbase/cds-web/layout/HStack';
import { VStack } from '@coinbase/cds-web/layout/VStack';
import { Spinner } from '@coinbase/cds-web/loaders/Spinner';
import { Avatar } from '@coinbase/cds-web/media/Avatar';
import { RemoteImage } from '@coinbase/cds-web/media/RemoteImage';
import { Tooltip } from '@coinbase/cds-web/overlays';
import { ThemeProvider } from '@coinbase/cds-web/system/ThemeProvider';
import { Tag } from '@coinbase/cds-web/tag/Tag';
import { Link } from '@coinbase/cds-web/typography/Link';
import { Text } from '@coinbase/cds-web/typography/Text';

import {
  avatarSizes,
  bannerVariants,
  borderRadii,
  borderWidths,
  buttonVariants,
  iconSizes,
  space,
  spectrumHues,
  spectrumHueSteps,
  tagColorSchemes,
} from '../../themeVars';

import { ControlsExample } from './examples/Controls';
import { DatePickerExample } from './examples/DatePicker';
import { LineChartBasicExample } from './examples/LineChart';
import { PaginationExample } from './examples/Pagination';
import { RollingNumberExample } from './examples/RollingNumber';
import { SearchExample } from './examples/Search';
import { SegmentedTabsExample } from './examples/SegmentedTabs';
import { SelectExample } from './examples/Select';
import { SelectChipExample } from './examples/SelectChip';
import { StepperHorizontalBasicExample } from './examples/StepperHorizontal';
import { StepperVerticalCustomExample } from './examples/StepperVertical';
import { TextInputExample } from './examples/TextInput';
import { BodyText } from './BodyText';
import { Container } from './Container';

const SHOW_DEBUG_BG_COLORS = false;

const floatingAssetCards: FloatingAssetCardProps[] = [
  {
    title: '#7560',
    description: (
      <Text as="p" color="fgPositive" font="label2" numberOfLines={2}>
        &#x2197;14.42%
      </Text>
    ),
    subtitle: 'Bored Ape',
    onClick: () => {},
    media: (
      <RemoteImage
        height={'100%'}
        source="/nft_boredape2.png"
        style={{ objectFit: 'cover', cursor: 'pointer' }}
        width="100%"
      />
    ),
  },
  {
    title: '#2015',
    description: (
      <Text as="p" color="fgNegative" font="label2" numberOfLines={2}>
        &#x2198;6.37%
      </Text>
    ),
    subtitle: 'Pudgy Penguins',
    onClick: () => {},
    media: (
      <RemoteImage
        height={'100%'}
        source="/nft_penguin.png"
        style={{ objectFit: 'cover', cursor: 'pointer' }}
        width="100%"
      />
    ),
  },
];

const rootStyle = {
  position: 'relative',
  top: 20,
  maxWidth: 1200,
  padding: 32,
  gap: 16,
  margin: '0 auto',
  borderRadius: 12,
  display: 'flex',
  alignItems: 'center',
} as const;

const leftColumnWidth = 420 as const;
const rightColumnWidth = 600 as const;

export type StickerSheetProps = {
  themeConfig: ThemeConfig;
  showComponents?: boolean;
};

export const StickerSheet = memo(({ themeConfig, showComponents }: StickerSheetProps) => {
  const appTheme = useTheme();
  const isDarkMode = appTheme.activeColorScheme === 'dark';

  const textColor = isDarkMode ? '#7a7a7a' : '#9a9a9a';
  const borderColor = isDarkMode ? '#2f2f2f' : '#e1e1e1';
  const borderedStyle = { border: `1px solid ${borderColor}` };

  const colorNames = Object.keys(themeConfig?.lightColor ?? themeConfig?.darkColor ?? {});
  const spectrumEntries = Object.entries(
    themeConfig?.lightSpectrum ?? themeConfig?.darkSpectrum ?? {},
  );

  const fgColors = colorNames
    .filter((colorName) => colorName.startsWith('fg'))
    .sort() as ThemeVars.Color[];
  const bgColors = colorNames
    .filter((colorName) => colorName.startsWith('bg'))
    .sort() as ThemeVars.Color[];
  const accentColors = colorNames
    .filter((colorName) => colorName.startsWith('accent'))
    .sort() as ThemeVars.Color[];

  return (
    <ThemeProvider activeColorScheme={appTheme.activeColorScheme} theme={themeConfig}>
      <VStack background="bgAlternate" style={rootStyle}>
        {showComponents && (
          <HStack style={{ gap: 16 }}>
            <VStack
              style={{
                gap: 16,
                background: SHOW_DEBUG_BG_COLORS ? 'red' : undefined,
              }}
              width={leftColumnWidth}
            >
              <Container style={{ marginLeft: -8, padding: 12 }}>
                <LineChartBasicExample />
              </Container>

              <Container>
                <ControlsExample />
              </Container>

              <HStack style={{ gap: 16 }}>
                <Container width={280}>
                  <SegmentedTabsExample />
                </Container>

                <Container width={124}>
                  <Spinner size={2} />
                  <Spinner color="bgPrimary" size={4} />
                </Container>
              </HStack>

              <HStack style={{ gap: 16 }}>
                <Container width={160}>
                  <RollingNumberExample />
                </Container>

                <Container width={244}>
                  <HStack style={{ gap: 8 }}>
                    <SelectChipExample />
                    <InputChip
                      onClick={() => console.log('Remove ETH')}
                      start={<RemoteImage height={16} source={assets.eth.imageUrl} width={16} />}
                      value="ETH"
                    />
                  </HStack>
                </Container>
              </HStack>

              <Container>
                <PaginationExample />
              </Container>

              <Container>
                <SelectExample />
              </Container>

              <Container>
                <SearchExample />
              </Container>

              <Container>
                <Accordion>
                  <AccordionItem
                    itemKey="1"
                    media={<Pictogram name="addToWatchlist" />}
                    subtitle="This is an example subtitle"
                    title="Accordion item"
                  >
                    <Text font="body">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    </Text>
                  </AccordionItem>
                  <AccordionItem
                    itemKey="2"
                    media={<Pictogram name="calendar" />}
                    subtitle="This is an example subtitle"
                    title="Accordion item"
                  >
                    <Text font="body">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    </Text>
                  </AccordionItem>
                </Accordion>
              </Container>

              <Container>
                <NudgeCard
                  action="Start earning"
                  description="You’ve got unstaked crypto. Stake it now to earn more."
                  onActionPress={() => {}}
                  onDismissPress={() => {}}
                  pictogram="key"
                  title="Earn more crypto"
                />
              </Container>

              <Container>
                <HStack style={{ gap: 24 }}>
                  {floatingAssetCards.map((card, index) => (
                    <Tooltip key={index} content={`View details for ${card.subtitle}`}>
                      <FloatingAssetCard {...card} />
                    </Tooltip>
                  ))}
                </HStack>
              </Container>
            </VStack>

            <VStack
              style={{
                gap: 16,
                background: SHOW_DEBUG_BG_COLORS ? 'blue' : undefined,
              }}
              width={rightColumnWidth}
            >
              <Container>
                <VStack style={{ gap: 16 }}>
                  <Tag intent="informational">primary</Tag>
                  <Tag intent="promotional">primary</Tag>
                </VStack>
                {tagColorSchemes.map((colorScheme) => (
                  <VStack key={colorScheme} style={{ gap: 16 }}>
                    <Tag colorScheme={colorScheme} intent="informational">
                      {colorScheme}
                    </Tag>
                    <Tag colorScheme={colorScheme} intent="promotional">
                      {colorScheme}
                    </Tag>
                  </VStack>
                ))}
              </Container>

              <Container>
                <Icon name="search" size="l" />
                <Icon name="search" size="m" />
                <Icon name="search" size="s" />
                <Icon name="search" size="xs" />
                <Icon name="add" size="l" />
                <Icon name="add" size="m" />
                <Icon name="add" size="s" />
                <Icon name="add" size="xs" />
                <Icon name="account" size="l" />
                <Icon name="account" size="m" />
                <Icon name="account" size="s" />
                <Icon name="account" size="xs" />
              </Container>

              <HStack style={{ gap: 16 }}>
                <Container width={240}>
                  <VStack style={{ gap: 8 }}>
                    {buttonVariants.map((variant) => (
                      <HStack key={variant} alignItems="center" style={{ gap: 8 }}>
                        <Button variant={variant} width={160}>
                          Button
                        </Button>
                        <IconButton compact={false} name="add" variant={variant} />
                      </HStack>
                    ))}
                    <HStack alignItems="center" style={{ gap: 8 }}>
                      <Button loading width={160}>
                        Button
                      </Button>
                      <IconButton loading compact={false} name="add" />
                    </HStack>
                  </VStack>
                </Container>

                <VStack style={{ gap: 16 }}>
                  <Container width={344}>
                    <Avatar colorScheme="red" name="Avatar" shape="circle" size="m" />
                    <Avatar colorScheme="orange" name="Avatar" shape="circle" size="l" />
                    <Avatar colorScheme="yellow" name="Avatar" shape="circle" size="xl" />
                    <Avatar colorScheme="green" name="Avatar" shape="square" size="m" />
                    <Avatar colorScheme="blue" name="Avatar" shape="square" size="l" />
                    <Avatar colorScheme="purple" name="Avatar" shape="square" size="xl" />
                  </Container>

                  <Container width={344}>
                    <StepperVerticalCustomExample />
                  </Container>

                  <Container>
                    <TextInputExample />
                  </Container>
                </VStack>
              </HStack>

              <HStack style={{ gap: 16 }}>
                <Container alignSelf="stretch" width={240}>
                  <VStack style={{ gap: 8 }}>
                    {buttonVariants.map((variant) => (
                      <HStack key={variant} alignItems="center" style={{ gap: 8 }}>
                        <Button compact variant={variant} width={160}>
                          Button
                        </Button>
                        <IconButton compact name="add" variant={variant} />
                      </HStack>
                    ))}
                    <HStack alignItems="center" style={{ gap: 8 }}>
                      <Button compact loading width={160}>
                        Button
                      </Button>
                      <IconButton compact loading name="add" />
                    </HStack>
                  </VStack>
                </Container>

                <Container width={344}>
                  <DatePickerExample />
                </Container>
              </HStack>

              <Container>
                <StepperHorizontalBasicExample />
              </Container>

              <Container>
                {bannerVariants.map((variant, index) => (
                  <Banner
                    key={variant}
                    startIconActive
                    id={`banner-${index}`}
                    label="Message last updated today at 3:24pm"
                    primaryAction={<Link href="#">Primary</Link>}
                    secondaryAction={<Link href="#">Secondary</Link>}
                    startIcon="info"
                    styleVariant="global"
                    title="Global banner"
                    variant={variant}
                  >
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  </Banner>
                ))}
              </Container>
            </VStack>
          </HStack>
        )}

        <VStack
          style={{
            gap: 16,
            background: SHOW_DEBUG_BG_COLORS ? 'orange' : undefined,
          }}
          width={1040}
        >
          <Container title="Spectrum" width={1040}>
            <VStack flexWrap="wrap" style={{ gap: 8 }}>
              <HStack>
                <Box width={94} />
                {spectrumHueSteps.map((spectrumHueStep) => (
                  <Box key={spectrumHueStep} height={20} justifyContent="center" width={45}>
                    <BodyText>{spectrumHueStep}</BodyText>
                  </Box>
                ))}
              </HStack>
              {spectrumHues.map((spectrumHue) => {
                const hueColors = spectrumEntries.filter(([colorName]) =>
                  colorName.startsWith(spectrumHue),
                );
                return (
                  <HStack key={spectrumHue} alignItems="center">
                    <BodyText style={{ padding: 12 }} textAlign="end" width={94}>
                      {spectrumHue}
                    </BodyText>
                    {hueColors.map(([colorName, colorValue]) => (
                      <Box
                        key={colorName}
                        height={45}
                        style={{
                          backgroundColor: `rgb(${colorValue})`,
                        }}
                        width={45}
                      />
                    ))}
                  </HStack>
                );
              })}
            </VStack>
          </Container>

          <Container title="Foreground Colors">
            <HStack flexWrap="wrap" style={{ gap: 8 }}>
              {fgColors.map((colorName) => (
                <VStack key={colorName}>
                  <BodyText style={{ paddingBottom: 4 }} width={140}>
                    {colorName}
                  </BodyText>
                  <Box background={colorName} height={45} style={borderedStyle} width={45} />
                </VStack>
              ))}
            </HStack>
          </Container>

          <Container title="Background Colors">
            <HStack flexWrap="wrap" style={{ gap: 8 }}>
              {bgColors.map((colorName) => (
                <VStack key={colorName}>
                  <BodyText style={{ paddingBottom: 4 }} width={140}>
                    {colorName}
                  </BodyText>
                  <Box background={colorName} height={45} style={borderedStyle} width={45} />
                </VStack>
              ))}
            </HStack>
          </Container>

          <Container title="Accent Colors">
            <HStack flexWrap="wrap" style={{ gap: 8 }}>
              {accentColors.map((colorName) => (
                <VStack key={colorName}>
                  <BodyText style={{ paddingBottom: 4 }} width={140}>
                    {colorName}
                  </BodyText>
                  <Box background={colorName} height={45} style={borderedStyle} width={45} />
                </VStack>
              ))}
            </HStack>
          </Container>

          <HStack style={{ gap: 16 }}>
            <Container title="Space" width={672}>
              <HStack alignItems="baseline" style={{ gap: 8 }}>
                {space.map((space) => (
                  <VStack key={space} alignItems="center">
                    <Box
                      key={space}
                      background="bgLineHeavy"
                      style={{
                        width: 12,
                        height: `var(--space-${space.toString().replace(/\./g, '_')})`,
                      }}
                    />
                    <BodyText style={{ padding: 8 }}>{space}</BodyText>
                    <BodyText style={{ color: textColor }}>{themeConfig.space[space]}</BodyText>
                  </VStack>
                ))}
              </HStack>
            </Container>

            <Container title="Icon Sizes" width={352}>
              <HStack style={{ gap: 24 }}>
                {iconSizes.map((iconSize) => (
                  <VStack key={iconSize} alignItems="center" alignSelf="baseline">
                    <HStack style={{ gap: 8 }}>
                      <Icon name="search" size={iconSize} />
                      <Icon active name="search" size={iconSize} />
                    </HStack>
                    <BodyText style={{ paddingTop: 8 }}>{iconSize}</BodyText>
                    <BodyText style={{ color: textColor }}>
                      {themeConfig.iconSize[iconSize]}
                    </BodyText>
                  </VStack>
                ))}
              </HStack>
            </Container>
          </HStack>
        </VStack>

        <HStack style={{ gap: 16 }}>
          <VStack
            style={{
              gap: 16,
              background: SHOW_DEBUG_BG_COLORS ? 'purple' : undefined,
            }}
            width={leftColumnWidth}
          >
            <Container title="Fonts">
              <VStack style={{ gap: 16 }}>
                <Text font="display1">Display 1</Text>
                <Text font="display2">Display 2</Text>
                <Text font="display3">Display 3</Text>
                <Text font="title1">Title 1</Text>
                <Text font="title2">Title 2</Text>
                <Text font="title3">Title 3</Text>
                <Text font="title4">Title 4</Text>
                <Text font="headline">Headline</Text>
                <Text font="body">Body</Text>
                <Text font="label1">Label 1</Text>
                <Text font="label2">Label 2</Text>
                <Text font="caption">Caption</Text>
                <Text font="legal">Legal</Text>
              </VStack>
            </Container>

            <Container title="Text Colors">
              <VStack style={{ gap: 8 }}>
                {fgColors.map((color) => (
                  <HStack
                    key={color}
                    alignItems="center"
                    background={color === 'fgInverse' ? 'bgInverse' : undefined}
                    style={{ gap: 8, padding: 8, borderRadius: 12 }}
                  >
                    <Icon color={color} name="search" size="s" />
                    <Text color={color} font="title4">
                      Lorem ipsum dolor sit amet
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Container>
          </VStack>
          <VStack
            style={{
              gap: 16,
              background: SHOW_DEBUG_BG_COLORS ? 'green' : undefined,
            }}
            width={rightColumnWidth}
          >
            <Container title="Avatar Sizes">
              <HStack alignItems="baseline" style={{ gap: 24 }}>
                {avatarSizes.map((avatarSize) => (
                  <VStack key={avatarSize} alignItems="center" alignSelf="baseline">
                    <Avatar name="Avatar" size={avatarSize} />
                    <BodyText style={{ padding: 8 }}>{avatarSize}</BodyText>
                    <BodyText style={{ color: textColor }}>
                      {themeConfig.avatarSize[avatarSize]}
                    </BodyText>
                  </VStack>
                ))}
              </HStack>
            </Container>

            <HStack style={{ gap: 16 }}>
              <Container title="Border Radius" width={324}>
                <VStack style={{ gap: 12, padding: 12 }}>
                  {borderRadii.map((borderRadius) => (
                    <HStack key={borderRadius} alignItems="center" style={{ gap: 8 }}>
                      <VStack>
                        <BodyText textAlign="end" width={60}>
                          {borderRadius}
                        </BodyText>
                        <BodyText style={{ color: textColor }} textAlign="end">
                          {themeConfig.borderRadius[borderRadius]}
                        </BodyText>
                      </VStack>
                      <Box
                        bordered
                        borderColor="bgLineHeavy"
                        borderRadius={borderRadius}
                        height={60}
                        width={60}
                      />
                      <Box
                        bordered
                        borderColor="bgLineHeavy"
                        borderRadius={borderRadius}
                        height={60}
                        width={120}
                      />
                    </HStack>
                  ))}
                </VStack>
              </Container>

              <VStack style={{ gap: 16 }}>
                <Container title="Border Width" width={260}>
                  <VStack style={{ gap: 12, padding: 12 }}>
                    {borderWidths.map((borderWidth) => (
                      <HStack key={borderWidth} alignItems="center" style={{ gap: 8 }}>
                        <VStack>
                          <BodyText textAlign="end" width={30}>
                            {borderWidth}
                          </BodyText>
                          <BodyText style={{ color: textColor }} textAlign="end">
                            {themeConfig.borderWidth[borderWidth]}
                          </BodyText>
                        </VStack>
                        <Box
                          borderColor="bgLineHeavy"
                          borderWidth={borderWidth}
                          height={60}
                          width={120}
                        />
                      </HStack>
                    ))}
                  </VStack>
                </Container>

                <Container title="Elevation" width={260}>
                  <VStack style={{ gap: 40, padding: 12 }}>
                    <Box
                      alignItems="center"
                      elevation={1}
                      height={120}
                      justifyContent="center"
                      width={120}
                    >
                      <BodyText>Elevation 1</BodyText>
                    </Box>
                    <Box
                      alignItems="center"
                      elevation={2}
                      height={120}
                      justifyContent="center"
                      width={120}
                    >
                      <BodyText>Elevation 2</BodyText>
                    </Box>
                  </VStack>
                </Container>
              </VStack>
            </HStack>
          </VStack>
        </HStack>
      </VStack>
    </ThemeProvider>
  );
});
