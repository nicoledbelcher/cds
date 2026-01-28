/**
 * ⚠️ INTERNAL USE ONLY - DO NOT USE IN PRODUCTION CODE ⚠️
 *
 * These utilities are meant exclusively for Storybook stories and internal testing.
 * They are not part of the public API and may change without notice.
 */

import React from 'react';

import { VStack } from '../layout/VStack';
import { Text } from '../typography/Text';

/**
 * Emulates pausing in interaction tests
 * @link https://storybook.js.org/docs/react/writing-stories/play-function
 * @internal
 */
export const pauseStory = async (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay));

/**
 * @internal
 */
export type ExampleProps = {
  children: React.ReactNode;
  title: string;
};

/**
 * Wrapper for individual examples in Storybook stories.
 * Provides consistent title styling and spacing.
 * @internal
 */
export const Example = ({ children, title }: ExampleProps) => (
  <VStack gap={2}>
    <Text as="h2" display="block" font="title3">
      {title}
    </Text>
    {children}
  </VStack>
);

/**
 * @internal
 */
export type ExampleScreenProps = {
  children: React.ReactNode;
};

/**
 * Container for multiple Example components in Storybook stories.
 * Provides consistent gap between examples without padding (Storybook handles padding).
 * @internal
 */
export const ExampleScreen = ({ children }: ExampleScreenProps) => (
  <VStack gap={2}>{children}</VStack>
);
