import { VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography/Text';

import StylesTable from './StylesTable';

export type DataAttribute = {
  /** The name of the data attribute (e.g., "data-disabled") */
  attribute: string;
  /** Which selector(s) receive this attribute (e.g., "root", "root, label") */
  selector: string;
  /** The condition under which the attribute is set */
  condition?: string;
  /** Possible values for the attribute */
  values?: string;
};

export type Selector = {
  /** The name of the selector (e.g., "root", "label", "loader") */
  name: string;
  /** The static CSS class name (e.g., ".cds-Button") */
  staticClassName?: string;
  /** Description of what this selector targets */
  description?: string;
};

export type StylesAPIMetadata = {
  /** The static root CSS class name (e.g., "cds-Button") */
  staticClassName?: string;
  /** Available selectors for styling */
  selectors?: Selector[];
  /** Data attributes set on the component */
  dataAttributes?: DataAttribute[];
};

type ComponentStylesTableProps = {
  stylesAPI: StylesAPIMetadata;
};

function ComponentStylesTable({ stylesAPI }: ComponentStylesTableProps) {
  const { staticClassName, selectors, dataAttributes } = stylesAPI;

  const hasSelectors = selectors && selectors.length > 0;
  const hasDataAttributes = dataAttributes && dataAttributes.length > 0;

  if (!staticClassName && !hasSelectors && !hasDataAttributes) {
    return (
      <VStack alignContent="center" alignItems="center" gap={1.5} paddingBottom={4} paddingX={4}>
        <Text font="headline">No styles API available</Text>
        <Text font="body">This component does not expose a styles API.</Text>
      </VStack>
    );
  }

  return (
    <VStack gap={4} maxWidth="100%" paddingBottom={4} paddingX={{ base: 4, phone: 2 }} width="100%">
      {/* Static Class Name Section */}
      {staticClassName && (
        <VStack gap={2}>
          <VStack gap={0.5}>
            <Text as="h3" font="title3">
              Static class name
            </Text>
            <Text color="fgMuted" font="body">
              Use this class to target the root element with CSS.
            </Text>
          </VStack>
          <Text mono color="fgPrimary" font="body">
            .{staticClassName}
          </Text>
        </VStack>
      )}

      {/* Selectors Section */}
      {hasSelectors && (
        <VStack gap={2}>
          <VStack gap={0.5}>
            <Text as="h3" font="title3">
              Selectors
            </Text>
            <Text color="fgMuted" font="body">
              Target specific inner elements of the component.
            </Text>
          </VStack>
          <StylesTable
            columns={[
              { key: 'name', label: 'Selector', width: '30%' },
              { key: 'staticClassName', label: 'Static class', width: '35%' },
              { key: 'description', label: 'Description', width: '35%' },
            ]}
            data={selectors.map((selector) => ({
              name: selector.name,
              staticClassName: selector.staticClassName ? `.${selector.staticClassName}` : '–',
              description: selector.description ?? '–',
            }))}
          />
        </VStack>
      )}

      {/* Data Attributes Section */}
      {hasDataAttributes && (
        <VStack gap={2}>
          <VStack gap={0.5}>
            <Text as="h3" font="title3">
              Data attributes
            </Text>
            <Text color="fgMuted" font="body">
              Attributes set on the component based on its state or props.
            </Text>
          </VStack>
          <StylesTable
            columns={[
              { key: 'selector', label: 'Selector', width: '20%' },
              { key: 'attribute', label: 'Attribute', width: '25%' },
              { key: 'condition', label: 'Condition', width: '30%' },
              { key: 'values', label: 'Value', width: '25%' },
            ]}
            data={dataAttributes.map((attr) => ({
              selector: attr.selector,
              attribute: attr.attribute,
              condition: attr.condition ?? '–',
              values: attr.values ?? '–',
            }))}
          />
        </VStack>
      )}
    </VStack>
  );
}

export default ComponentStylesTable;
