# Writing Transforms

Guide to creating jscodeshift transforms for CDS migrations.

## Quick Start

### 1. Create Transform File

Create a file in the appropriate version's `transforms/` directory:

```typescript
// src/v8-to-v9/transforms/button-variant-to-appearance.ts
import type { API, FileInfo } from 'jscodeshift';
import { getLogger } from '../../utils';

export default function transformer(file: FileInfo, api: API) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const logger = getLogger();

  let hasChanges = false;

  // Your transformation logic here

  return hasChanges ? root.toSource() : null;
}
```

### 2. Add to config.json

```json
{
  "categories": {
    "components": {
      "variables": {
        "Button": {
          "transforms": [
            {
              "name": "button-variant-to-appearance",
              "description": "Rename 'variant' prop to 'appearance'",
              "file": "transforms/button-variant-to-appearance.ts"
            }
          ]
        }
      }
    }
  }
}
```

### 3. Test

```bash
yarn nx run migrator:build
node esm/cli.js
# Select your transform in dry-run mode
```

## Transform Template

```typescript
import type { API, FileInfo } from 'jscodeshift';
import { addTodoToAttribute, getLogger, hasMigrationTodo } from '../../utils';

export default function transformer(file: FileInfo, api: API) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const logger = getLogger();

  let hasChanges = false;

  // 1. Find and transform what you can automatically
  root.find(j.JSXAttribute, { name: { name: 'oldProp' } }).forEach((path) => {
    if (j.JSXIdentifier.check(path.value.name)) {
      path.value.name.name = 'newProp';
      hasChanges = true;

      logger?.success('Renamed oldProp to newProp', file.path, path.value.loc?.start.line);
    }
  });

  // 2. Add TODOs for complex cases
  root.find(j.JSXAttribute, { name: { name: 'complexProp' } }).forEach((path) => {
    if (!hasMigrationTodo(path.parent)) {
      addTodoToAttribute(j, path, {
        message: 'complexProp needs manual migration',
        context: 'See: https://docs.coinbase.com/cds/...',
      });

      logger?.todo('Manual migration required', file.path, path.value.loc?.start.line);

      hasChanges = true;
    }
  });

  // Return null if no changes (skip file write)
  return hasChanges ? root.toSource() : null;
}
```

## Common Patterns

### Rename JSX Component

```typescript
root
  .find(j.JSXElement)
  .filter((path) => {
    const name = path.value.openingElement.name;
    return j.JSXIdentifier.check(name) && name.name === 'OldButton';
  })
  .forEach((path) => {
    const opening = path.value.openingElement;
    const closing = path.value.closingElement;

    if (j.JSXIdentifier.check(opening.name)) {
      opening.name.name = 'Button';
    }
    if (closing && j.JSXIdentifier.check(closing.name)) {
      closing.name.name = 'Button';
    }

    logger?.success('Renamed OldButton to Button', file.path, path.value.loc?.start.line);
  });
```

### Rename JSX Prop

```typescript
root
  .find(j.JSXElement, {
    openingElement: { name: { name: 'Button' } },
  })
  .find(j.JSXAttribute, { name: { name: 'variant' } })
  .forEach((path) => {
    if (j.JSXIdentifier.check(path.value.name)) {
      path.value.name.name = 'appearance';

      logger?.success(
        'Renamed Button variant to appearance',
        file.path,
        path.value.loc?.start.line,
      );
    }
  });
```

### Update Prop Values

```typescript
root.find(j.JSXAttribute, { name: { name: 'size' } }).forEach((path) => {
  const value = path.value.value;

  // Handle string literals
  if (j.StringLiteral.check(value)) {
    const mapping = { sm: 'small', md: 'medium', lg: 'large' };
    const newValue = mapping[value.value];

    if (newValue) {
      value.value = newValue;
      logger?.success(
        `Updated size: ${value.value} → ${newValue}`,
        file.path,
        path.value.loc?.start.line,
      );
    }
  }

  // Handle JSX expressions: size={variable}
  if (j.JSXExpressionContainer.check(value)) {
    addTodoToAttribute(j, path, {
      message: 'Size values have changed (sm/md/lg → small/medium/large)',
      context: 'Update this variable to use new size values',
    });

    logger?.todo('Size prop needs manual update', file.path);
  }
});
```

### Update Imports

```typescript
root
  .find(j.ImportDeclaration, {
    source: { value: '@coinbase/cds-web' },
  })
  .forEach((path) => {
    path.value.specifiers?.forEach((specifier) => {
      if (j.ImportSpecifier.check(specifier) && specifier.imported.name === 'OldButton') {
        specifier.imported.name = 'Button';
        if (specifier.local) {
          specifier.local.name = 'Button';
        }

        logger?.success(
          'Updated import: OldButton → Button',
          file.path,
          path.value.loc?.start.line,
        );
      }
    });
  });
```

### Remove Props

```typescript
root.find(j.JSXAttribute, { name: { name: 'deprecatedProp' } }).forEach((path) => {
  // Add TODO first
  addTodoToAttribute(j, path, {
    message: 'deprecatedProp has been removed',
    context: 'This prop no longer exists. Remove or replace with alternative.',
  });

  logger?.warn('Found deprecated prop', file.path, path.value.loc?.start.line);

  // Optionally remove it
  // j(path).remove();
});
```

### Add Imports

```typescript
// Check if import already exists
const hasImport =
  root
    .find(j.ImportDeclaration, {
      source: { value: '@coinbase/cds-web' },
    })
    .filter((path) =>
      path.value.specifiers?.some(
        (s) => j.ImportSpecifier.check(s) && s.imported.name === 'Button',
      ),
    ).length > 0;

if (!hasImport) {
  // Find first import from CDS
  const firstCdsImport = root
    .find(j.ImportDeclaration, {
      source: { value: (v) => v.startsWith('@coinbase/cds') },
    })
    .at(0);

  if (firstCdsImport.length > 0) {
    // Add to existing import
    const existingImport = firstCdsImport.get();
    existingImport.value.specifiers?.push(j.importSpecifier(j.identifier('Button')));
  } else {
    // Add new import at top
    root.find(j.Program).forEach((path) => {
      path.value.body.unshift(
        j.importDeclaration(
          [j.importSpecifier(j.identifier('Button'))],
          j.stringLiteral('@coinbase/cds-web'),
        ),
      );
    });
  }

  logger?.success('Added Button import', file.path);
}
```

## Best Practices

### 1. Make Transforms Idempotent

Transforms should be safe to run multiple times:

```typescript
// ✅ Good: Check before modifying
const hasImport =
  root.find(j.ImportDeclaration, {
    source: { value: '@coinbase/cds' },
  }).length > 0;

if (hasImport) return null; // Already applied

// ❌ Bad: Always adds import
root.find(j.Program).forEach((path) => {
  path.value.body.unshift(newImport);
});
```

### 2. Always Use the Logger

```typescript
// ✅ Good: Log all operations
logger?.success('Renamed prop', file.path, line);
logger?.warn('Could not auto-migrate', file.path, line);
logger?.todo('Manual work needed', file.path, line);

// ❌ Bad: Silent transformations
path.value.name.name = 'newName'; // No logging
```

### 3. Add TODOs for Complex Cases

```typescript
// ✅ Good: Mark what needs manual work
if (!canAutoMigrate) {
  addTodoToAttribute(j, path, {
    message: 'This requires manual migration',
    context: 'See documentation: ...',
  });
  logger?.todo('Manual migration needed', file.path, line);
}

// ❌ Bad: Skip silently
if (!canAutoMigrate) {
  return null; // User won't know what to fix
}
```

### 4. Return null for Unchanged Files

```typescript
// ✅ Good: Skip write if no changes
if (!hasChanges) {
  return null;
}
return root.toSource();

// ❌ Bad: Always return (writes even if nothing changed)
return root.toSource();
```

### 5. Check for Existing TODOs

```typescript
// ✅ Good: Don't add duplicate TODOs
if (!hasMigrationTodo(path.parent)) {
  addTodoToAttribute(j, path, { message: '...' });
}

// ❌ Bad: Add TODO every time
addTodoToAttribute(j, path, { message: '...' });
```

## Testing Transforms

### Create Test Files

```bash
mkdir -p /tmp/migration-test/src
```

```tsx
// /tmp/migration-test/src/Button.tsx
import { Button } from '@coinbase/cds-web';

export function MyButton() {
  return <Button variant="primary">Click me</Button>;
}
```

### Run in Dry-Run

```bash
cd packages/migrator
node esm/cli.js
# Select: By specific transform
# Select your transform
# Path: /tmp/migration-test/src
# Dry-run: Yes
```

### Verify Output

Check:

- ✅ Correct files were modified
- ✅ Changes are accurate
- ✅ TODOs added where needed
- ✅ No unintended side effects

### Apply and Test

```bash
# Run without dry-run
node esm/cli.js
# Dry-run: No

# Test the migrated code
cd /tmp/migration-test
yarn install
yarn build
yarn test
```

## Resources

- [jscodeshift Documentation](https://github.com/facebook/jscodeshift)
- [AST Explorer](https://astexplorer.net/) - Visualize JavaScript/TypeScript AST
- [Utilities API](./UTILITIES.md) - Available helper functions
- [Configuration Guide](./CONFIGURATION.md) - Config structure
- [CLI Reference](./CLI_REFERENCE.md) - Running the migrator

## Common Issues

### "Transform not found"

Error: `ENOENT: no such file or directory`

**Solution:** Check the `file` path in config.json is correct relative to the version directory.

### "No changes detected"

The transform runs but no files are modified.

**Possible causes:**

- Transform logic doesn't match the code pattern
- Files don't contain the target pattern
- Transform is checking the wrong node type

**Debug with AST Explorer:** Paste your code and see the actual AST structure.

### "Transform runs on wrong files"

**Solution:** Specify `extensions` in config.json:

```json
{
  "name": "mobile-specific",
  "file": "transforms/mobile-specific.ts",
  "extensions": "tsx,jsx" // Only JSX files
}
```
