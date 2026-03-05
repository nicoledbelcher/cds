# v8 to v9 Migration Guide

Guide for migrating from CDS v8 to v9.

## Overview

This preset contains transforms to help you migrate your codebase from CDS v8 to v9. The migration addresses breaking changes in component APIs, hooks, and utility functions.

## What's Included

### Components Category

**Button**

- `button-variant-to-appearance` - Renames the `variant` prop to `appearance`

**Input**

- `input-size-values` - Updates size prop values from `sm/md/lg` to `small/medium/large`

### Hooks Category

**useTheme**

- `use-theme-return-type` - Updates destructured return values from useTheme hook

### Utilities Category

**formatCurrency**

- `format-currency-options` - Updates the options parameter structure for formatCurrency

## Breaking Changes

### Button Component

**Before (v8):**

```tsx
<Button variant="primary" size="md">
  Click me
</Button>
```

**After (v9):**

```tsx
<Button appearance="primary" size="medium">
  Click me
</Button>
```

### Input Component

**Before (v8):**

```tsx
<Input size="sm" />
```

**After (v9):**

```tsx
<Input size="small" />
```

### useTheme Hook

**Before (v8):**

```tsx
const { currentTheme } = useTheme();
```

**After (v9):**

```tsx
const { theme } = useTheme();
```

### formatCurrency Utility

**Before (v8):**

```tsx
formatCurrency(100, 'USD', { showSymbol: true });
```

**After (v9):**

```tsx
formatCurrency(100, { currency: 'USD', symbol: true });
```

## Running the Migration

### Recommended Approach

1. **Start with dry-run** to preview changes:

   ```bash
   npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --all --dry-run
   ```

2. **Review the migration.log** to see what will change

3. **Run by category** if you want to be incremental:

   ```bash
   # Components first
   npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --category components

   # Then hooks
   npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --category hooks
   ```

4. **Apply all changes**:
   ```bash
   npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --all
   ```

## Manual Steps Required

Some patterns are too complex to migrate automatically. Look for `TODO(cds-migration)` comments in your code after running the migrator.

### Common Manual Updates

1. **Dynamic prop values** - If you're using variables for prop values, update them manually
2. **Spread props** - Props passed via spread operators need manual review
3. **Type definitions** - Update your TypeScript types to match new prop names

## Testing Your Migration

After running the migrator:

1. **Run TypeScript** - Check for type errors

   ```bash
   yarn typecheck
   ```

2. **Run tests** - Ensure functionality is preserved

   ```bash
   yarn test
   ```

3. **Run your app** - Visual testing

   ```bash
   yarn start
   ```

4. **Fix TODOs** - Search for `TODO(cds-migration)` and address them

## Rollback

If you need to rollback:

```bash
# If you haven't committed yet
git reset --hard

# Clear the migration history
npx @coinbase/cds-migrator --clear-history --path ./src
```

## Getting Help

- **General questions** - See [main documentation](../../docs/)
- **Transform details** - Check the transform source in `src/transforms/`
- **Issues** - Open an issue in the CDS repository

## Version Details

- **Source Version:** CDS v8.x
- **Target Version:** CDS v9.x
- **Preset Name:** `v8-to-v9`
- **Last Updated:** 2026-02-11
