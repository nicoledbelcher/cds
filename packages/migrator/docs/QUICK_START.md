# Quick Start Guide

Get started with CDS Migrator in 5 minutes.

## Installation

```bash
# Option 1: Run directly with npx (recommended)
npx @coinbase/cds-migrator

# Option 2: Install as dev dependency
yarn add -D @coinbase/cds-migrator
```

## Your First Migration

### 1. Run the CLI

```bash
cd your-project
npx @coinbase/cds-migrator
```

### 2. Follow the Prompts

**Choose migration version:**

```
? Which migration preset do you need?
  ❯ v8 to v9 - Migrate from CDS v8 to v9
```

**Choose scope:**

```
? What would you like to migrate?
  ❯ Everything (all changes)
    By category (components, hooks, etc.)
    By item (specific component/hook/utility)
    By specific transform
```

**Choose path and mode:**

```
? Enter the path to your codebase: ./src
? Run in dry-run mode? (Y/n) Y
```

### 3. Review Changes

The migrator will:

- Show a migration plan
- Run transforms and display progress
- Create a `migration.log` file with details
- Add TODO comments where manual work is needed

### 4. Apply Changes

Once you're satisfied with the dry-run:

1. Run the migrator again
2. Choose **No** for dry-run mode
3. Review and commit changes

## Migration Modes

### Dry-Run Mode (Recommended First)

Preview changes without modifying files:

- ✅ Safe to run anytime
- ✅ See what would change
- ✅ Review migration.log
- ✅ No history recorded

```bash
? Run in dry-run mode? Yes
```

### Apply Mode

Apply changes to your files:

- ⚠️ Modifies your files
- ⚠️ Records migration history
- ⚠️ Can't easily undo (use git!)
- ✅ Prevents duplicate runs

```bash
? Run in dry-run mode? No
⚠️  This will modify your files. Continue? (y/N)
```

## What Gets Created

After running a migration:

```
your-project/
├── src/
│   ├── .cds-migration-history.json  # ← Tracks applied migrations
│   └── ... (your modified files)
└── migration.log                    # ← Detailed log of changes
```

**Important:**

- ✅ Commit `.cds-migration-history.json` to git
- ❌ Don't commit `migration.log` (review then delete)

## Selection Strategies

The migrator offers **four ways to select** what to migrate, with each level offering an "All" option.

### 1. Everything - Fastest Path

**Best for:** Initial migration, small codebase, want it done quickly

```
? What would you like to migrate?
  ❯ Everything (all changes)
```

**What happens:** Runs all transforms immediately - no further selections needed.

### 2. By Category

**Best for:** Focus on specific types of changes, or see categories before migrating all

```
? What would you like to migrate?
  ❯ By category (components, hooks, etc.)

? Select categories to migrate:
  ◯ 🔘 All categories          ← Migrates everything
  ◯ components - Component API changes
  ◯ hooks - Hook API changes
  ◯ utilities - Utility function changes
```

Select "🔘 All categories" to migrate everything, or pick specific ones for phased migration.

### 3. By Item

**Best for:** Migrate specific components/hooks, or see full list before migrating all

```
? What would you like to migrate?
  ❯ By item (specific component/hook/utility)

? Select items to migrate:
  ◯ 🔘 All items               ← Migrates everything
  ◯ components.Button - Button component changes (@coinbase/cds-web)
  ◯ components.Input - Input component changes (@coinbase/cds-web)
  ◯ hooks.useTheme - useTheme hook changes (@coinbase/cds-common)
  ◯ utilities.formatCurrency - formatCurrency changes (@coinbase/cds-utils)
```

Select "🔘 All items" to migrate everything, or pick specific items to test one at a time.

### 4. By Transform

**Best for:** Maximum control, or review each change before migrating all

```
? What would you like to migrate?
  ❯ By specific transform

? Select transforms to run:
  ◯ 🔘 All transforms          ← Migrates everything
  ◯ components.Button.button-variant-to-appearance - Rename 'variant' prop
  ◯ components.Input.input-size-values - Update size values
  ◯ hooks.useTheme.use-theme-return-type - Update return type
  ◯ utilities.formatCurrency.format-currency-options - Update options
```

Select "🔘 All transforms" to migrate everything after reviewing details, or pick specific ones for surgical changes.

## Understanding the Output

### Console Output

```
🔄 Running v8-to-v9 migration...

  → Running transform: components.Button.button-variant-to-appearance
    Rename 'variant' prop to 'appearance'

    Command: npx jscodeshift --dry --parser=tsx ...

    Processing 25 files...
    Transforming src/Button.tsx...
    Transforming src/App.tsx...

  ✓ Transform completed: button-variant-to-appearance

✅ Migration completed successfully!
📝 Migration log written to: migration.log
```

### Migration Log (`migration.log`)

```
CDS Migration Log
Generated: 2026-02-11T12:00:00.000Z
========================================

[2026-02-11T12:00:01.000Z] INFO: Starting v8-to-v9 migration
[2026-02-11T12:00:02.000Z] SUCCESS [src/Button.tsx:15]: Renamed prop
[2026-02-11T12:00:03.000Z] TODO [src/Complex.tsx:45]: Manual migration required
  This component needs manual review

========================================
Migration Summary
========================================

Total Entries: 3
- INFO: 1
- SUCCESS: 1
- TODO: 1

Manual Migration Required (1 items):
  - src/Complex.tsx: Manual migration required
```

### TODO Comments in Code

When automatic migration isn't possible:

```tsx
// Before migration
<Button complexProp={{ old: 'api' }} />

// After migration
// TODO(cds-migration): complexProp API has changed significantly
// Please review the new API at https://docs.coinbase.com/cds/...
<Button complexProp={{ old: 'api' }} />
```

## Next Steps

After your first migration:

1. **Review the changes** - Check modified files
2. **Review migration.log** - Look for TODO items
3. **Test your app** - Ensure everything works
4. **Fix TODOs** - Address manual migration items
5. **Commit** - Save changes and migration history

```bash
git add .
git commit -m "Migrate from CDS v8 to v9"
```

## Decision Guide

### Quick Decision Tree

```
Do you want to migrate everything?
│
├─ YES, and I want it done fast
│  └─> Choose: "Everything (all changes)"
│
├─ YES, but I want to see categories first
│  └─> Choose: "By category" → "🔘 All categories"
│
├─ YES, but I want to see all items first
│  └─> Choose: "By item" → "🔘 All items"
│
├─ YES, but I want to review each transform
│  └─> Choose: "By transform" → "🔘 All transforms"
│
└─ NO, I want to be selective
   ├─> By category → Select specific ones
   ├─> By item → Select specific ones
   └─> By transform → Select specific ones
```

## Common Workflows

### Quick & Complete Migration

```bash
npx @coinbase/cds-migrator
# Select: Everything → Dry-run: Yes → Review → Apply
```

### Explore Before Committing

```bash
npx @coinbase/cds-migrator
# Select: By item → See full list → Check "🔘 All items" → Apply
```

### Incremental Migration

For large codebases, migrate in stages:

```bash
# Day 1: Migrate Button components
npx @coinbase/cds-migrator
# Choose: By item → components.Button

# Day 2: Migrate Input components
npx @coinbase/cds-migrator
# Choose: By item → components.Input

# Day 3: Migrate remaining items
npx @coinbase/cds-migrator
# Choose: By item → 🔘 All items (skips already-done Button/Input)
```

The history tracking ensures no duplicates across runs.

### Team Migration

**Developer A:**

```bash
npx @coinbase/cds-migrator
# Migrates components
git add . && git commit -m "Migrate components"
git push
```

**Developer B:**

```bash
git pull
npx @coinbase/cds-migrator
# Migrates hooks (history prevents re-doing components)
```

## Troubleshooting

### "Transform already run" warning

This is normal! The migrator detected you've already applied this transform.

**Options:**

- Skip (recommended) - Only run new transforms
- Re-run - Apply again (may cause issues)
- Cancel - Exit without changes

### Migration log shows errors

Check `migration.log` for details:

- **ERROR** entries - Transform failed
- **TODO** entries - Need manual fixes
- **WARN** entries - Review recommended

### Need to re-run a transform

Three options:

1. Choose "Re-run all transforms" when prompted
2. Clear history: `npx @coinbase/cds-migrator --clear-history -p ./src`
3. Manually edit `.cds-migration-history.json`

## Get Help

- **Configuration questions** → See [CONFIGURATION.md](./CONFIGURATION.md)
- **Writing transforms** → See [WRITING_TRANSFORMS.md](./WRITING_TRANSFORMS.md)
- **Using utilities** → See [UTILITIES.md](./UTILITIES.md)
- **History tracking** → See [HISTORY.md](./HISTORY.md)
- **CLI flags and selection** → See [CLI_REFERENCE.md](./CLI_REFERENCE.md)
