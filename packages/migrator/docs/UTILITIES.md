# Utilities API Reference

Shared utility functions available in all CDS migration transforms.

## Overview

The utils directory provides:

- **TODO insertion** - Mark code that needs manual migration
- **Logging** - Track all migration activities to a file
- **Config loading** - Load and process migration configurations
- **History tracking** - Prevent duplicate migrations

## Quick Reference

```typescript
// Import in your transform
import {
  // TODO utilities
  addTodoToAttribute,
  addTodoToImport,
  hasMigrationTodo,

  // Logging
  getLogger,

  // Config (used by CLI/runner, rarely needed in transforms)
  loadMigrationConfig,
  getSelectedTransforms,

  // History (used by CLI/runner, rarely needed in transforms)
  hasTransformBeenRun,
} from '../../utils';
```

## TODO Utilities

### addTodoToAttribute()

Add a TODO comment to a JSX attribute when automatic migration isn't possible.

**Signature:**

```typescript
function addTodoToAttribute(
  j: API['jscodeshift'],
  attributePath: any,
  options: InsertTodoOptions,
): void;
```

**Options:**

```typescript
interface InsertTodoOptions {
  message: string; // Main TODO message
  context?: string; // Additional context/instructions
  position?: 'before' | 'after'; // Where to place comment
}
```

**Example:**

```typescript
root.find(j.JSXAttribute, { name: { name: 'deprecatedProp' } }).forEach((path) => {
  addTodoToAttribute(j, path, {
    message: 'deprecatedProp has been removed',
    context: 'Use newProp instead. See: https://...',
  });
});
```

**Output:**

```tsx
// TODO(cds-migration): deprecatedProp has been removed
// Use newProp instead. See: https://...
<Button deprecatedProp="value" />
```

### addTodoToImport()

Add a TODO comment to an import statement.

**Example:**

```typescript
root
  .find(j.ImportDeclaration)
  .filter((path) => /* condition */)
  .forEach((path) => {
    addTodoToImport(j, path, {
      message: 'This import needs updating',
      context: 'The API has changed significantly',
    });
  });
```

**Output:**

```typescript
// TODO(cds-migration): This import needs updating
// The API has changed significantly
import { OldComponent } from '@coinbase/cds-web';
```

### hasMigrationTodo()

Check if a node already has a migration TODO to prevent duplicates.

**Example:**

```typescript
root.find(j.JSXAttribute, { name: { name: 'prop' } }).forEach((path) => {
  if (!hasMigrationTodo(path.parent)) {
    addTodoToAttribute(j, path, { message: '...' });
  }
});
```

### insertTodoComment()

Lower-level function to insert TODO near any AST node.

**Example:**

```typescript
root.find(j.VariableDeclaration).forEach((path) => {
  insertTodoComment(j, path, {
    message: 'This variable needs updating',
    position: 'before',
  });
});
```

### createTodoBlock()

Create a standalone TODO comment block as a string.

**Example:**

```typescript
const todoBlock = createTodoBlock({
  message: 'Manual migration required',
  context: 'Complex API changes need review',
});
// Returns: "// TODO(cds-migration): Manual migration required\n// Complex API changes need review\n"
```

## Logging

### getLogger()

Get the current logger instance (created automatically by the runner).

**Example:**

```typescript
export default function transformer(file: FileInfo, api: API) {
  const logger = getLogger();

  // Use throughout your transform
  logger?.success('Operation completed', file.path, 10);
}
```

### Log Levels

#### logger.info()

General informational messages:

```typescript
logger?.info('Starting transformation', file.path);
```

#### logger.success()

Successful transformations:

```typescript
logger?.success('Renamed prop', file.path, lineNumber);
```

#### logger.warn()

Warnings about potential issues:

```typescript
logger?.warn(
  'Could not auto-migrate complex case',
  file.path,
  lineNumber,
  'This pattern is too complex for automatic migration',
);
```

#### logger.error()

Transform errors:

```typescript
logger?.error('Transform failed', file.path, lineNumber, error.message);
```

#### logger.todo()

Mark items that need manual migration:

```typescript
logger?.todo(
  'Manual migration required',
  file.path,
  lineNumber,
  'This component uses deprecated APIs that need manual review',
);
```

### Log Output Format

```
[2026-02-11T12:00:00.000Z] INFO: Starting migration
[2026-02-11T12:00:01.000Z] SUCCESS [src/App.tsx:15]: Renamed prop
[2026-02-11T12:00:02.000Z] WARN [src/Button.tsx:23]: Could not auto-migrate
[2026-02-11T12:00:03.000Z] TODO [src/Complex.tsx:45]: Manual migration required
  Additional context here
[2026-02-11T12:00:04.000Z] ERROR [src/Error.tsx:10]: Transform failed
  Error details
```

## Complete Transform Example

```typescript
import type { API, FileInfo } from 'jscodeshift';
import { addTodoToAttribute, getLogger, hasMigrationTodo } from '../../utils';

export default function transformer(file: FileInfo, api: API) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const logger = getLogger();

  let hasChanges = false;

  // 1. Simple rename - fully automatic
  root
    .find(j.JSXAttribute, { name: { name: 'variant' } })
    .filter((path) => {
      const element = path.parent.value.openingElement;
      return j.JSXIdentifier.check(element.name) && element.name.name === 'Button';
    })
    .forEach((path) => {
      if (j.JSXIdentifier.check(path.value.name)) {
        path.value.name.name = 'appearance';
        hasChanges = true;

        logger?.success('Renamed variant to appearance', file.path, path.value.loc?.start.line);
      }
    });

  // 2. Complex case - needs TODO
  root.find(j.JSXAttribute, { name: { name: 'complexProp' } }).forEach((path) => {
    if (!hasMigrationTodo(path.parent)) {
      addTodoToAttribute(j, path, {
        message: 'complexProp API has changed',
        context: 'Review new API at https://docs.coinbase.com/cds/v9/button#complex-prop',
      });

      logger?.todo(
        'Complex prop needs manual migration',
        file.path,
        path.value.loc?.start.line,
        'The complexProp API has breaking changes that require manual review',
      );

      hasChanges = true;
    }
  });

  // 3. Warning for edge case
  root
    .find(j.JSXExpressionContainer)
    .filter((path) => {
      const parent = path.parent.value;
      return (
        j.JSXAttribute.check(parent) &&
        j.JSXIdentifier.check(parent.name) &&
        parent.name.name === 'size'
      );
    })
    .forEach((path) => {
      logger?.warn(
        'Size prop uses expression - verify value mapping',
        file.path,
        path.value.loc?.start.line,
        'Size values changed from sm/md/lg to small/medium/large',
      );
    });

  return hasChanges ? root.toSource() : null;
}
```

## Constants

### TODO_PREFIX

The prefix used for all migration TODO comments.

**Value:** `"TODO(cds-migration)"`

**Usage:**

```typescript
import { TODO_PREFIX } from '../../utils';

// Check if comment already exists
if (comment.value.includes(TODO_PREFIX)) {
  // Skip this node
}
```

### LOG_FILE_NAME

Default filename for migration logs.

**Value:** `"migration.log"`

## Config Loading

These functions are primarily used by the CLI and runner, but are available if needed.

### loadMigrationConfig()

Load config.json for a migration version.

```typescript
const config = loadMigrationConfig('./src/v8-to-v9');
console.log(config.categories);
```

### getSelectedTransforms()

Get list of transforms based on user selection.

```typescript
const transforms = getSelectedTransforms(config, {
  categories: ['components'],
});
```

### buildMigrationSummary()

Generate a formatted summary of what will be migrated.

```typescript
const summary = buildMigrationSummary(config, selection);
console.log(summary);
```

## History Tracking

These functions are used by the runner to prevent duplicate migrations.

### hasTransformBeenRun()

Check if a specific transform has already been applied.

```typescript
const wasRun = hasTransformBeenRun('./src', 'components.Button.button-variant-to-appearance');
```

### getAlreadyRunTransforms()

Get list of transforms that have been run from a given set.

```typescript
const transformIds = [
  'components.Button.button-variant-to-appearance',
  'components.Input.input-size-values',
];

const alreadyRun = getAlreadyRunTransforms('./src', transformIds);
// Returns: ['components.Button.button-variant-to-appearance']
```

### recordTransformRun()

Record that a transform was executed (called automatically by runner).

```typescript
recordTransformRun(
  './src',
  'components.Button.button-variant-to-appearance',
  'v8-to-v9',
  false, // dryRun
);
```

### loadMigrationHistory()

Load the complete history for a path.

```typescript
const history = loadMigrationHistory('./src');
if (history) {
  console.log(`Applied ${history.entries.length} transforms`);
}
```

### buildHistorySummary()

Generate a formatted history report.

```typescript
const summary = buildHistorySummary('./src');
console.log(summary);
```

## Type Definitions

### InsertTodoOptions

```typescript
interface InsertTodoOptions {
  message: string; // Main TODO message
  context?: string; // Additional instructions
  position?: 'before' | 'after'; // Placement (default: 'before')
}
```

### MigrationHistory

```typescript
interface MigrationHistory {
  targetPath: string; // Path that was migrated
  entries: MigrationHistoryEntry[]; // List of transform runs
  lastUpdated: string; // ISO timestamp
}
```

### MigrationHistoryEntry

```typescript
interface MigrationHistoryEntry {
  transformId: string; // e.g., "components.Button.button-variant"
  timestamp: string; // ISO timestamp
  version: string; // e.g., "v8-to-v9"
  dryRun: boolean; // Whether it was a dry run
}
```

## Best Practices

### 1. Always Use getLogger()

```typescript
// ✅ Good
const logger = getLogger();
logger?.success('Operation completed', file.path);

// ❌ Bad
console.log('Operation completed'); // Won't be in log file
```

### 2. Check Before Adding TODOs

```typescript
// ✅ Good
if (!hasMigrationTodo(path.parent)) {
  addTodoToAttribute(j, path, { message: '...' });
}

// ❌ Bad
addTodoToAttribute(j, path, { message: '...' }); // May duplicate
```

### 3. Log All Significant Operations

```typescript
// ✅ Good - Comprehensive logging
logger?.success('Renamed prop', file.path, line);
logger?.warn('Skipped complex case', file.path, line);
logger?.todo('Manual work needed', file.path, line);

// ❌ Bad - Silent operations
path.value.name.name = 'newName'; // No logging
```

### 4. Provide Context in TODOs

```typescript
// ✅ Good - Actionable TODO
addTodoToAttribute(j, path, {
  message: 'complexProp API has changed',
  context: 'See migration guide: https://docs.coinbase.com/cds/v9/button',
});

// ❌ Bad - Vague TODO
addTodoToAttribute(j, path, {
  message: 'Update this',
});
```

### 5. Return null for Unchanged Files

```typescript
// ✅ Good
if (!hasChanges) return null;
return root.toSource();

// ❌ Bad
return root.toSource(); // Writes even if nothing changed
```

## See Also

- [Writing Transforms](./WRITING_TRANSFORMS.md) - Transform development guide
- [Configuration](./CONFIGURATION.md) - Config structure
- [CLI Reference](./CLI_REFERENCE.md) - Running the migrator
- [Quick Start](./QUICK_START.md) - Getting started
