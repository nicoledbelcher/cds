# Migration Configuration Guide

How to structure and configure migrations using the three-level hierarchy.

## Overview

Each major preset (e.g., v8-to-v9) has a `config.json` file that defines:

1. **Categories** - High-level groupings (components, hooks, utilities)
2. **Variables** - Specific exports (Button, useTheme, formatCurrency)
3. **Transforms** - Individual codemods to run

This structure allows users to migrate everything at once or pick exactly what they need.

## Configuration Structure

```
Categories (components, hooks, utilities)
  └─ Variables (Button, Input, useTheme, etc.)
      └─ Transforms (specific codemods)
```

### Complete Example

```json
{
  "version": "v8-to-v9",
  "description": "Migration from CDS v8 to v9",
  "categories": {
    "components": {
      "description": "Component API changes",
      "variables": {
        "Button": {
          "description": "Button component prop changes",
          "package": "@coinbase/cds-web",
          "transforms": [
            {
              "name": "button-variant-to-appearance",
              "description": "Rename 'variant' prop to 'appearance'",
              "file": "transforms/button-variant-to-appearance.ts"
            },
            {
              "name": "button-remove-deprecated-sizes",
              "description": "Remove deprecated size values",
              "file": "transforms/button-remove-deprecated-sizes.ts"
            }
          ]
        },
        "Input": {
          "description": "Input component prop changes",
          "package": "@coinbase/cds-web",
          "transforms": [
            {
              "name": "input-size-values",
              "description": "Update size prop values",
              "file": "transforms/input-size-values.ts"
            }
          ]
        }
      }
    },
    "hooks": {
      "description": "Hook API changes",
      "variables": {
        "useTheme": {
          "description": "useTheme hook signature changes",
          "package": "@coinbase/cds-common",
          "transforms": [
            {
              "name": "use-theme-return-type",
              "description": "Update destructured return values",
              "file": "transforms/use-theme-return-type.ts"
            }
          ]
        }
      }
    }
  }
}
```

## Level Definitions

### Level 1: Categories

Organize changes by type:

| Category     | Description              | Examples                       |
| ------------ | ------------------------ | ------------------------------ |
| `components` | React component changes  | Button, Input, Modal           |
| `hooks`      | Hook API changes         | useTheme, useMediaQuery        |
| `utilities`  | Utility function changes | formatCurrency, parseDate      |
| `types`      | TypeScript type changes  | Props interfaces, type aliases |
| `constants`  | Constant value changes   | Theme tokens, breakpoints      |
| `styles`     | Style/CSS changes        | Class names, CSS variables     |

**Category Schema:**

```typescript
{
  description: string;  // Human-readable explanation
  variables: {          // Map of exported symbols
    [name: string]: MigrationVariable;
  }
}
```

### Level 2: Variables

Specific exports from CDS packages:

**Variable Schema:**

```typescript
{
  description: string;  // What changed about this export
  package: string;      // Which package exports it
  transforms: Transform[]; // Array of codemods
}
```

**Examples:**

- `Button` from `@coinbase/cds-web`
- `useTheme` from `@coinbase/cds-common`
- `formatCurrency` from `@coinbase/cds-utils`

**Naming conventions:**

- Use the actual export name (PascalCase for components/types, camelCase for functions/hooks)
- Match what users import: `import { Button } from '@coinbase/cds-web'`

### Level 3: Transforms

Individual jscodeshift codemods:

**Transform Schema:**

```typescript
{
  name: string;        // Unique identifier (kebab-case)
  description: string; // What this transform does
  file: string;        // Path relative to version directory
  extensions?: string; // Optional: "tsx,ts,jsx,js" (default)
}
```

**Naming conventions:**

- Use kebab-case: `button-variant-to-appearance`
- Be descriptive: `{component}-{what-it-does}`
- Examples: `input-size-values`, `use-theme-return-type`

## Adding a New Migration Version

### 1. Create Directory Structure

```bash
mkdir -p packages/migrator/src/v9-to-v10/transforms
```

### 2. Create config.json

```json
{
  "version": "v9-to-v10",
  "description": "Migration from CDS v9 to v10",
  "categories": {
    "components": {
      "description": "Component API changes",
      "variables": {}
    }
  }
}
```

### 3. Create index.ts

```typescript
/**
 * v9 to v10 Migration
 */

export const description = `
CDS v9 to v10 Migration
======================

Breaking changes in v10:
- [List breaking changes here]

Please review the changes carefully before committing.
`;
```

### 4. Update CLI

In `src/cli.ts`, add to `SUPPORTED_MIGRATIONS`:

```typescript
const SUPPORTED_MIGRATIONS = [
  {
    name: 'v8 to v9',
    value: 'v8-to-v9',
    description: 'Migrate from CDS v8 to v9',
  },
  {
    name: 'v9 to v10', // Add this
    value: 'v9-to-v10',
    description: 'Migrate from CDS v9 to v10',
  },
] as const;
```

## Adding Transforms to Existing Migration

### 1. Create the Transform File

```typescript
// src/v8-to-v9/transforms/button-variant-to-appearance.ts
import type { API, FileInfo } from 'jscodeshift';
import { getLogger } from '../../utils';

export default function transformer(file: FileInfo, api: API) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const logger = getLogger();

  let hasChanges = false;

  // Transform logic here
  root
    .find(j.JSXAttribute, { name: { name: 'variant' } })
    .filter((path) => {
      const jsxElement = path.parent.value;
      return (
        j.JSXIdentifier.check(jsxElement.openingElement.name) &&
        jsxElement.openingElement.name.name === 'Button'
      );
    })
    .forEach((path) => {
      if (j.JSXIdentifier.check(path.value.name)) {
        path.value.name.name = 'appearance';
        hasChanges = true;
        logger?.success('Renamed variant to appearance', file.path, path.value.loc?.start.line);
      }
    });

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
          "description": "Button component prop changes",
          "package": "@coinbase/cds-web",
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
# Build
yarn nx run migrator:build

# Test in dry-run
cd packages/migrator
node esm/cli.js
# Select: By specific transform → components.Button.button-variant-to-appearance
```

## Configuration Best Practices

### 1. Granular Transforms

One transform should do one thing:

✅ **Good:**

```json
{
  "transforms": [
    {
      "name": "button-variant-to-appearance",
      "description": "Rename 'variant' prop to 'appearance'"
    },
    {
      "name": "button-remove-deprecated-sizes",
      "description": "Remove deprecated size values"
    }
  ]
}
```

❌ **Bad:**

```json
{
  "transforms": [
    {
      "name": "button-all-changes",
      "description": "Update all Button props"
    }
  ]
}
```

**Why:** Granular transforms give users more control and make debugging easier.

### 2. Clear Descriptions

Descriptions should explain what changes, not implementation details:

✅ **Good:**

```json
"description": "Rename 'variant' prop to 'appearance'"
```

❌ **Bad:**

```json
"description": "Run jscodeshift transform to update JSX attributes"
```

### 3. Logical Grouping

Group related transforms under the same variable:

✅ **Good:**

```json
"Button": {
  "transforms": [
    { "name": "button-variant-to-appearance" },
    { "name": "button-size-values" },
    { "name": "button-remove-deprecated-props" }
  ]
}
```

❌ **Bad:**

```json
"Button": {
  "transforms": [{ "name": "button-variant-to-appearance" }]
},
"ButtonSize": {
  "transforms": [{ "name": "button-size-values" }]
}
```

### 4. Package Attribution

Always specify which package exports the variable:

```json
{
  "Button": {
    "package": "@coinbase/cds-web",  // ← Required!
    "transforms": [...]
  }
}
```

This helps users understand where imports come from.

### 5. Meaningful Categories

Use categories that match how developers think:

✅ **Good Categories:**

- `components` - React components
- `hooks` - React hooks
- `utilities` - Helper functions
- `types` - TypeScript types

❌ **Avoid:**

- `breaking-changes` - Too vague
- `misc` - Not organized
- `v9-updates` - Redundant with version

## Migration Execution Flow

Understanding how the config is used:

```
1. User selects migration version (v8-to-v9)
   ↓
2. Load config.json from src/v8-to-v9/
   ↓
3. User chooses scope (all, category, variable, or transform)
   ↓
4. Build list of transforms based on selection
   ↓
5. Show migration plan
   ↓
6. Execute transforms in order
   ↓
7. Record in migration history
```

## Example Migration Plans

### Selecting "Everything"

```
Migration Plan:
================

📦 components: Component API changes
  └─ Button (@coinbase/cds-web)
     • Rename 'variant' prop to 'appearance'
     • Remove deprecated size values
  └─ Input (@coinbase/cds-web)
     • Update size prop values

📦 hooks: Hook API changes
  └─ useTheme (@coinbase/cds-common)
     • Update destructured return values

Total transforms: 4
```

### Selecting "By Variable"

```
? Select items to migrate:
  ◉ components.Button
  ◯ components.Input
  ◉ hooks.useTheme

Migration Plan:
================

📦 components: Component API changes
  └─ Button (@coinbase/cds-web)
     • Rename 'variant' prop to 'appearance'
     • Remove deprecated size values

📦 hooks: Hook API changes
  └─ useTheme (@coinbase/cds-common)
     • Update destructured return values

Total transforms: 3
```

## Advanced Configuration

### Custom File Extensions

For transforms that should only run on specific file types:

```json
{
  "name": "style-object-to-stylesheet",
  "description": "Convert inline styles to StyleSheet",
  "file": "transforms/style-object-to-stylesheet.ts",
  "extensions": "tsx,jsx" // Only run on TSX/JSX files
}
```

### Transform Ordering

Transforms run in the order they appear in the config:

```json
{
  "transforms": [
    {
      "name": "remove-old-imports",
      "description": "Remove old imports"
    },
    {
      "name": "add-new-imports",
      "description": "Add new imports"
    }
  ]
}
```

**Important:** The order matters if transforms depend on each other!

## Schema Reference

### MigrationConfig

```typescript
interface MigrationConfig {
  version: string; // "v8-to-v9"
  description: string; // Overall description
  categories: Record<string, MigrationCategory>; // Category map
}
```

### MigrationCategory

```typescript
interface MigrationCategory {
  description: string; // Category description
  variables: Record<string, MigrationVariable>; // Variable map
}
```

### MigrationVariable

```typescript
interface MigrationVariable {
  description: string; // What changed
  package: string; // Source package
  transforms: Transform[]; // List of transforms
}
```

### Transform

```typescript
interface Transform {
  name: string; // Unique ID (kebab-case)
  description: string; // Human-readable explanation
  file: string; // Path relative to version dir
  extensions?: string; // Optional: file extensions
}
```

## Validation

The config loader will validate:

✅ config.json exists
✅ Valid JSON format
✅ All referenced transform files exist
✅ No duplicate transform names within a variable

## Tips for Large Migrations

### Split by Package

Organize by which CDS package is affected:

```json
{
  "categories": {
    "cds-web": {
      "description": "@coinbase/cds-web changes",
      "variables": {
        /* web components */
      }
    },
    "cds-mobile": {
      "description": "@coinbase/cds-mobile changes",
      "variables": {
        /* mobile components */
      }
    },
    "cds-common": {
      "description": "@coinbase/cds-common changes",
      "variables": {
        /* hooks, utilities */
      }
    }
  }
}
```

### Use Descriptive Transform Names

Make it easy to understand what each transform does:

✅ Good:

- `button-variant-to-appearance`
- `input-remove-error-text-prop`
- `modal-overlay-click-behavior`

❌ Avoid:

- `transform1`
- `fix-button`
- `update`

### Document Breaking Changes

Use the description field effectively:

```json
{
  "description": "Migration from CDS v8 to v9\n\nBreaking changes:\n- Button 'variant' prop renamed to 'appearance'\n- Input 'errorText' prop removed\n- useTheme returns new structure"
}
```

## See Also

- [Writing Transforms](./WRITING_TRANSFORMS.md) - Create the transform files
- [Utilities](./UTILITIES.md) - Use shared utilities in transforms
- [Quick Start](./QUICK_START.md) - Run your first migration
