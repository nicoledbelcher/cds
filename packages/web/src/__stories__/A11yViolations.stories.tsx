import { IconButton } from '../buttons';
import { VStack } from '../layout';
import { Text } from '../typography';

const AccessibilityViolations = () => {
  return (
    <VStack gap={2}>
      <VStack gap={1}>
        <Text color="fgNegative" font="headline">
          Missing accessibilityLabel
        </Text>
        <IconButton name="arrowsHorizontal" />
        <Text color="fgPositive" font="headline">
          Correct usage
        </Text>
        <IconButton accessibilityLabel="Horizontal arrows" name="arrowsHorizontal" />
      </VStack>
      <VStack gap={1}>
        <Text color="fgNegative" font="headline">
          Incorrect heading level
        </Text>
        <Text as="h1">I am an h1</Text>
        <Text as="h3">I am an h3 but should be an h2</Text>
        <Text color="fgPositive" font="headline">
          Correct usage
        </Text>
        <Text as="h1">I am an h1</Text>
        <Text as="h2">I am an h2</Text>
      </VStack>
    </VStack>
  );
};

export const Default = () => <AccessibilityViolations />;

export default {
  component: AccessibilityViolations,
  title: 'Accessibility/AccessibilityViolations',
};
