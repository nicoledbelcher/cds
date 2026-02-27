import type {
  API,
  ASTPath,
  Collection,
  FileInfo,
  JSXAttribute,
  JSXOpeningElement,
  Options,
} from 'jscodeshift';

import {
  addTodoToAttribute,
  getLogger,
  hasMigrationTodo,
  insertTodoComment,
} from '../../../utils/index.js';

type VariantMigrationOptions = {
  componentNames: string[];
  variantMapping: Record<string, string>;
  transformLabel: string;
  includesTertiarySemanticWarning?: boolean;
};

type ComponentImports = {
  localToImported: Map<string, string>;
  localNames: Set<string>;
};

function toSourceValue(source: string | null | undefined): string {
  return typeof source === 'string' ? source : '';
}

function collectComponentImports(
  root: Collection<any>,
  j: API['jscodeshift'],
  componentNames: string[],
): ComponentImports {
  const targetNames = new Set(componentNames);
  const localToImported = new Map<string, string>();
  const localNames = new Set<string>();

  root
    .find(j.ImportDeclaration)
    .filter((path: any) => toSourceValue(path.value.source.value).startsWith('@coinbase/cds'))
    .forEach((path: any) => {
      path.value.specifiers?.forEach((specifier: any) => {
        if (!j.ImportSpecifier.check(specifier)) {
          return;
        }

        const importedName = specifier.imported.name;
        if (!targetNames.has(importedName)) {
          return;
        }

        const localName = specifier.local?.name ?? importedName;
        localToImported.set(localName, importedName);
        localNames.add(localName);
      });
    });

  return { localToImported, localNames };
}

function getOpeningElementName(
  j: API['jscodeshift'],
  openingElement: JSXOpeningElement,
): string | null {
  if (j.JSXIdentifier.check(openingElement.name)) {
    return openingElement.name.name;
  }

  return null;
}

function getAttributeName(j: API['jscodeshift'], attribute: any): string | null {
  if (!j.JSXAttribute.check(attribute) || !j.JSXIdentifier.check(attribute.name)) {
    return null;
  }

  return attribute.name.name;
}

function createTodoReporter(
  j: API['jscodeshift'],
  file: FileInfo,
  label: string,
  openingPath: ASTPath<JSXOpeningElement>,
  fallbackLine?: number,
) {
  const logger = getLogger();
  const openingName = getOpeningElementName(j, openingPath.value) ?? 'Component';

  const hasExistingTodo = () => {
    if (hasMigrationTodo(openingPath)) {
      return true;
    }

    const parentPath = openingPath.parent;
    if (parentPath && hasMigrationTodo(parentPath as any)) {
      return true;
    }

    return false;
  };

  return (attributePath: ASTPath<JSXAttribute> | null, message: string, details: string) => {
    if (!hasExistingTodo()) {
      if (attributePath) {
        addTodoToAttribute(j, attributePath, { message, context: details });
      } else {
        insertTodoComment(j, openingPath, { message, context: details });
      }
    }

    logger?.todo(`[${label}] ${message}`, file.path, fallbackLine, `${openingName}: ${details}`);
  };
}

function unwrapObjectExpression(j: API['jscodeshift'], value: any): any | null {
  if (!value) {
    return null;
  }

  if (j.ObjectExpression.check(value)) {
    return value;
  }

  if (
    (j.TSAsExpression.check(value) || j.TSTypeAssertion.check(value)) &&
    j.ObjectExpression.check(value.expression)
  ) {
    return value.expression;
  }

  return null;
}

function getObjectVariantProperty(j: API['jscodeshift'], objectExpression: any): any | null {
  const properties = objectExpression.properties ?? [];
  for (const property of properties) {
    const isProperty = j.Property.check(property);
    const isObjectProperty = 'ObjectProperty' in j && (j as any).ObjectProperty.check(property);
    if (!isProperty && !isObjectProperty) {
      continue;
    }

    if (j.Identifier.check(property.key) && property.key.name === 'variant') {
      return property;
    }

    if (
      (j.StringLiteral.check(property.key) || j.Literal.check(property.key)) &&
      property.key.value === 'variant'
    ) {
      return property;
    }
  }

  return null;
}

function remapStringVariantValue(
  j: API['jscodeshift'],
  value: any,
  variantMapping: Record<string, string>,
): { didChange: boolean; previous?: string; next?: string } {
  if (!value) {
    return { didChange: false };
  }

  if ((j.TSAsExpression.check(value) || j.TSTypeAssertion.check(value)) && value.expression) {
    const expressionResult = remapStringVariantValue(j, value.expression, variantMapping);
    if (expressionResult.didChange) {
      return expressionResult;
    }
  }

  if (j.StringLiteral.check(value) || j.Literal.check(value)) {
    const previous = String(value.value);
    const next = variantMapping[previous];
    if (next) {
      value.value = next;
      return { didChange: true, previous, next };
    }
    return { didChange: false };
  }

  if (j.JSXExpressionContainer.check(value)) {
    const expression = value.expression;
    if (j.StringLiteral.check(expression) || j.Literal.check(expression)) {
      const previous = String(expression.value);
      const next = variantMapping[previous];
      if (next) {
        expression.value = next;
        return { didChange: true, previous, next };
      }
    }
  }

  return { didChange: false };
}

function expressionMentionsVariant(expression: any, variant: string): boolean {
  const visited = new WeakSet<object>();
  const stack: any[] = [expression];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== 'object') {
      continue;
    }
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);

    if ('value' in current && current.value === variant) {
      return true;
    }

    for (const child of Object.values(current)) {
      if (child && typeof child === 'object') {
        stack.push(child);
      }
    }
  }

  return false;
}

export function migrateVariantProps(
  file: FileInfo,
  api: API,
  options: Options,
  migrationOptions: VariantMigrationOptions,
): string | null {
  const {
    componentNames,
    variantMapping,
    transformLabel,
    includesTertiarySemanticWarning = false,
  } = migrationOptions;
  const j = api.jscodeshift;
  const root = j(file.source);
  const logger = getLogger();

  const imports = collectComponentImports(root, j, componentNames);
  if (imports.localNames.size === 0) {
    return null;
  }

  let hasChanges = false;

  const variableDeclaratorsByName = new Map<string, any>();
  root.find(j.VariableDeclarator).forEach((path: any) => {
    if (j.Identifier.check(path.value.id)) {
      variableDeclaratorsByName.set(path.value.id.name, path.value);
    }
  });

  root
    .find(j.JSXOpeningElement)
    .filter((path: any) => {
      const localName = getOpeningElementName(j, path.value);
      return localName ? imports.localNames.has(localName) : false;
    })
    .forEach((openingPath: any) => {
      const localName = getOpeningElementName(j, openingPath.value);
      if (!localName) {
        return;
      }

      const importedName = imports.localToImported.get(localName) ?? localName;
      const fallbackLine = openingPath.value.loc?.start.line;
      const reportTodo = createTodoReporter(j, file, transformLabel, openingPath, fallbackLine);

      openingPath.value.attributes.forEach((attribute: any) => {
        if (j.JSXAttribute.check(attribute) && getAttributeName(j, attribute) === 'variant') {
          const attributePath = j(openingPath)
            .find(j.JSXAttribute, { name: { name: 'variant' } })
            .at(0)
            .paths()[0];
          if (!attributePath) {
            return;
          }

          const remapResult = remapStringVariantValue(j, attribute.value, variantMapping);
          if (remapResult.didChange) {
            hasChanges = true;
            logger?.success(
              `[${transformLabel}] Updated ${importedName} variant: ${remapResult.previous} -> ${remapResult.next}`,
              file.path,
              attribute.loc?.start.line,
            );
            return;
          }

          if (!attribute.value || j.JSXExpressionContainer.check(attribute.value)) {
            const expression = j.JSXExpressionContainer.check(attribute.value)
              ? attribute.value.expression
              : null;
            const containsTertiary = expression
              ? expressionMentionsVariant(expression, 'tertiary')
              : false;
            const tertiaryContext =
              containsTertiary && includesTertiarySemanticWarning
                ? ' Dynamic tertiary values need intent review: v9 tertiary no longer matches v8 tertiary visuals; use inverse if old v8 look is intended.'
                : '';

            reportTodo(
              attributePath,
              `${importedName} variant requires manual migration`,
              `Found dynamic or non-literal variant value.${tertiaryContext} Verify mapping to v9 variants and update manually if needed.`,
            );
            hasChanges = true;
          }
        }

        if (!j.JSXSpreadAttribute.check(attribute)) {
          return;
        }

        const spreadArgument = attribute.argument;
        let didRewriteObjectVariant = false;

        if (j.Identifier.check(spreadArgument)) {
          const declarator = variableDeclaratorsByName.get(spreadArgument.name);
          const objectExpression = unwrapObjectExpression(j, declarator?.init);
          if (objectExpression) {
            const variantProperty = getObjectVariantProperty(j, objectExpression);
            if (variantProperty) {
              const remapResult = remapStringVariantValue(j, variantProperty.value, variantMapping);
              if (remapResult.didChange) {
                didRewriteObjectVariant = true;
                hasChanges = true;
                logger?.success(
                  `[${transformLabel}] Updated spread object variant for ${importedName}: ${remapResult.previous} -> ${remapResult.next}`,
                  file.path,
                  variantProperty.loc?.start.line ?? attribute.loc?.start.line,
                );
              }
            }
          }
        }

        reportTodo(
          null,
          `${importedName} spread props need manual review`,
          `Found spread props on ${importedName}. Spread values may still contain legacy variant values. Review spread source and flatten/update variant explicitly.${didRewriteObjectVariant ? ' An obvious local object-literal variant was auto-updated, but full spread safety still requires manual verification.' : ''}`,
        );
        hasChanges = true;
      });
    });

  if (!hasChanges) {
    return null;
  }

  return root.toSource(options);
}
