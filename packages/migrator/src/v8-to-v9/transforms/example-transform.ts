/**
 * Example Transform
 *
 * This is a template/example transform showing how to write codemods for CDS migrations.
 * You can use this as a starting point for creating actual migration transforms.
 */

import type { API, FileInfo, Options } from 'jscodeshift';
import { addTodoToAttribute, getLogger, hasMigrationTodo } from '../../utils/index.js';

export default function transformer(file: FileInfo, api: API, options: Options) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const logger = getLogger();

  let hasChanges = false;

  // Example 1: Rename a component
  root
    .find(j.JSXElement)
    .filter((path) => {
      const openingElement = path.value.openingElement;
      return j.JSXIdentifier.check(openingElement.name) && openingElement.name.name === 'OldButton';
    })
    .forEach((path) => {
      // Rename component
      const openingElement = path.value.openingElement;
      const closingElement = path.value.closingElement;

      if (j.JSXIdentifier.check(openingElement.name)) {
        openingElement.name.name = 'Button';
        hasChanges = true;

        logger?.success('Renamed OldButton to Button', file.path, path.value.loc?.start.line);
      }

      if (closingElement && j.JSXIdentifier.check(closingElement.name)) {
        closingElement.name.name = 'Button';
      }
    });

  // Example 2: Add TODO for complex migrations
  root.find(j.JSXAttribute, { name: { name: 'deprecatedProp' } }).forEach((path) => {
    if (!hasMigrationTodo(path.parent)) {
      addTodoToAttribute(j, path, {
        message: "The 'deprecatedProp' has been removed in v9",
        context:
          'Please migrate to the new API. See: https://docs.coinbase.com/cds/migration-guide',
      });

      logger?.todo(
        'Manual migration required for deprecatedProp',
        file.path,
        path.value.loc?.start.line,
        'This prop has breaking changes that need manual review',
      );

      hasChanges = true;
    }
  });

  // Example 3: Update import statements
  root
    .find(j.ImportDeclaration)
    .filter((path) => path.value.source.value === '@coinbase/cds-web')
    .forEach((path) => {
      path.value.specifiers?.forEach((specifier) => {
        if (j.ImportSpecifier.check(specifier) && specifier.imported.name === 'OldButton') {
          specifier.imported.name = 'Button';
          if (specifier.local) {
            specifier.local.name = 'Button';
          }
          hasChanges = true;

          logger?.success(
            'Updated import: OldButton → Button',
            file.path,
            path.value.loc?.start.line,
          );
        }
      });
    });

  // Return null if no changes to skip writing the file
  if (!hasChanges) {
    return null;
  }

  return root.toSource();
}
