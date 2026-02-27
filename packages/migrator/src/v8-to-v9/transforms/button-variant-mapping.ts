import type { API, FileInfo, Options } from 'jscodeshift';

import { migrateVariantProps } from './utils/variant-migration.js';

// eslint-disable-next-line no-restricted-exports -- jscodeshift requires default export
export default function transformer(file: FileInfo, api: API, options: Options) {
  return migrateVariantProps(file, api, options, {
    componentNames: ['Button', 'IconButton'],
    variantMapping: {
      tertiary: 'inverse',
      foregroundMuted: 'secondary',
    },
    transformLabel: 'button-variant-mapping',
    includesTertiarySemanticWarning: true,
  });
}
