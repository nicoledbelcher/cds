import React from 'react';
import type { HeroSquareDimension } from '@coinbase/cds-common';
import type { ColorScheme } from '@coinbase/cds-common/core/theme';
import {
  illustrationDimensions,
  illustrationSizes,
} from '@coinbase/cds-common/tokens/illustrations';
import heroSquareVersionMap from '@coinbase/cds-illustrations/__generated__/heroSquare/data/versionMap';

import { Example, ExampleScreen } from '../../examples/ExampleScreen';
import { useTheme } from '../../hooks/useTheme';
import { HStack, VStack } from '../../layout';
import { ThemeProvider } from '../../system/ThemeProvider';
import { defaultTheme } from '../../themes/defaultTheme';
import { Text } from '../../typography/Text';
import type { HeroSquareName } from '../index';
import { HeroSquare } from '../index';

const COLOR_SCHEMES: ColorScheme[] = ['light', 'dark'];
const ITEMS_PER_EXAMPLE = 8;
const HERO_SQUARE_SCALE = 0.24;
const heroSquareDimensionKey = illustrationDimensions.heroSquare[0];
const [heroSquareWidth, heroSquareHeight] = illustrationSizes[heroSquareDimensionKey];
const HERO_SQUARE_DIMENSION = `${heroSquareWidth}x${heroSquareHeight}` as HeroSquareDimension;
const PREVIEW_WIDTH = heroSquareWidth * HERO_SQUARE_SCALE;

const heroSquareNames = Object.keys(heroSquareVersionMap) as HeroSquareName[];
const heroSquareGroups: HeroSquareName[][] = [];

for (let i = 0; i < heroSquareNames.length; i += ITEMS_PER_EXAMPLE) {
  heroSquareGroups.push(heroSquareNames.slice(i, i + ITEMS_PER_EXAMPLE));
}

type HeroSquarePreviewProps = {
  name: HeroSquareName;
};

const HeroSquarePreview = ({ name }: HeroSquarePreviewProps) => (
  <VStack gap={0} style={{ width: PREVIEW_WIDTH * COLOR_SCHEMES.length }}>
    <Text ellipsize="tail" font="legal" numberOfLines={1}>
      {name}
    </Text>
    <HStack gap={0}>
      {COLOR_SCHEMES.map((scheme) => (
        <ThemeProvider key={`${name}-${scheme}`} activeColorScheme={scheme} theme={defaultTheme}>
          <VStack background="bg" overflow="hidden" width={PREVIEW_WIDTH}>
            <HeroSquare
              dimension={HERO_SQUARE_DIMENSION}
              name={name}
              scaleMultiplier={HERO_SQUARE_SCALE}
            />
          </VStack>
        </ThemeProvider>
      ))}
    </HStack>
  </VStack>
);

const HeroSquareStory = () => {
  const theme = useTheme();
  return (
    <ExampleScreen>
      <Example title="Hero Squares themed">
        <ThemeProvider
          activeColorScheme="light"
          theme={{
            ...defaultTheme,
            lightIllustration: {
              ...defaultTheme.lightIllustration,
              primary: `rgb(${theme.spectrum.red40})`,
              black: `rgb(${theme.spectrum.green100})`,
              white: `rgb(${theme.spectrum.yellow30})`,
              gray: `rgb(${theme.spectrum.purple10})`,
              gray2: `rgb(${theme.spectrum.purple10})`,
              gray3: `rgb(${theme.spectrum.blue10})`,
              positive: `rgb(${theme.spectrum.green30})`,
              negative: `rgb(${theme.spectrum.red60})`,
              accent1: `rgb(${theme.spectrum.orange40})`,
              accent2: `rgb(${theme.spectrum.teal15})`,
              accent3: `rgb(${theme.spectrum.green30})`,
              accent4: `rgb(${theme.spectrum.blue20})`,
              invert: `rgb(${theme.spectrum.red100})`,
              invert2: `rgb(${theme.spectrum.blue30})`,
            },
            darkIllustration: {
              ...defaultTheme.darkIllustration,
              primary: `rgb(${theme.spectrum.red40})`,
              black: `rgb(${theme.spectrum.green100})`,
              white: `rgb(${theme.spectrum.yellow30})`,
              gray: `rgb(${theme.spectrum.purple10})`,
              gray2: `rgb(${theme.spectrum.purple10})`,
              gray3: `rgb(${theme.spectrum.blue10})`,
              positive: `rgb(${theme.spectrum.green30})`,
              negative: `rgb(${theme.spectrum.red60})`,
              accent1: `rgb(${theme.spectrum.orange40})`,
              accent2: `rgb(${theme.spectrum.teal15})`,
              accent3: `rgb(${theme.spectrum.green30})`,
              accent4: `rgb(${theme.spectrum.blue20})`,
              invert: `rgb(${theme.spectrum.red100})`,
              invert2: `rgb(${theme.spectrum.blue30})`,
            },
          }}
        >
          <HStack flexWrap="wrap" gap={1}>
            {heroSquareGroups[0].map((name) => (
              <HeroSquare key={name} name={name} scaleMultiplier={HERO_SQUARE_SCALE} />
            ))}
          </HStack>
        </ThemeProvider>
      </Example>
      {heroSquareGroups.map((group, index, arr) => (
        <Example key={`hero-square-${index}`} title={`Hero Squares ${index + 1} of ${arr.length}`}>
          <HStack flexWrap="wrap" gap={1}>
            {group.map((name) => (
              <HeroSquarePreview key={name} name={name} />
            ))}
          </HStack>
        </Example>
      ))}
    </ExampleScreen>
  );
};

export default HeroSquareStory;
