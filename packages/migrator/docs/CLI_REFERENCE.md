# CLI Reference

Complete reference for using the CDS Migrator in both interactive and non-interactive modes.

## Installation

```bash
# Install as dev dependency (recommended)
yarn add -D @coinbase/cds-migrator

# Or use npx without installing
npx @coinbase/cds-migrator
```

## Quick Reference

### Interactive Mode

```bash
# Using npx (no installation needed)
npx @coinbase/cds-migrator

# Or if installed locally
yarn cds-migrate
```

### Convenience Commands (after installation)

Quick commands for common operations:

```bash
# Migrate everything (shortcut)
yarn cds-migrate:all -p v8-to-v9 --path ./src --dry-run

# Clear history (shortcut)
yarn cds-migrate:clear-history --path ./src
```

### Full CLI Flags

```bash
# Migrate everything
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --all

# Dry-run (preview changes)
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --all --dry-run

# Migrate specific category
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --category components

# Migrate specific items
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --item components.Button

# Migrate specific transform
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --transform components.Button.button-variant-to-appearance

# Clear history
npx @coinbase/cds-migrator --clear-history --path ./src
```

### Optional: Add Scripts to package.json

For convenience, add these to your project's package.json:

```json
{
  "scripts": {
    "migrate": "cds-migrate",
    "migrate:dry": "cds-migrate -p v8-to-v9 --path ./src --all --dry-run",
    "migrate:apply": "cds-migrate -p v8-to-v9 --path ./src --all"
  }
}
```

Then run:

```bash
yarn migrate        # Interactive
yarn migrate:dry    # Preview changes
yarn migrate:apply  # Apply changes
```

---

## Part 1: Interactive Mode

### Selection Flow

The migrator uses a **hierarchical selection** where you choose categories first, then transforms within each category:

```
Step 1: Which preset?
   → v8-to-v9

Step 2: Enter path
   → ./src

Step 3: [Shows history if exists]

Step 4: Which categories?
   ├─ 🔘 All categories → DONE (runs everything)
   └─ Select specific → Continue to Step 5

Step 5: For EACH selected category, which transforms?
   ├─ 🔘 All transforms in [category] → Runs all in that category
   └─ Select specific → Runs only those selected

Step 6: Dry-run mode?

Step 7: Execute
```

### Example Flows

**Flow 1: Migrate Everything**

```
? Which categories? → 🔘 All categories
✓ Done! Runs all 4 transforms
```

**Flow 2: All Components**

```
? Which categories? → components
? Transforms in components? → 🔘 All transforms in components
✓ Runs all component transforms (Button + Input)
```

**Flow 3: Just One Transform**

```
? Which categories? → components
? Transforms in components? → Button.button-variant-to-appearance
✓ Runs only that one transform
```

**Flow 4: Multiple Categories, All Transforms**

```
? Which categories? → components, hooks
? Transforms in components? → 🔘 All transforms in components
? Transforms in hooks? → 🔘 All transforms in hooks
✓ Runs all transforms in both categories (3 transforms)
```

**Flow 5: Cherry-Pick from Multiple Categories**

```
? Which categories? → components, hooks
? Transforms in components? → Button.button-variant-to-appearance
? Transforms in hooks? → useTheme.use-theme-return-type
✓ Runs 2 specific transforms
```

### What Gets Run

| Selection                                     | Result                             |
| --------------------------------------------- | ---------------------------------- |
| 🔘 All categories                             | All transforms from all categories |
| categories: [components] + 🔘 All transforms  | All transforms in components       |
| categories: [components] + specific           | Only selected component transforms |
| categories: [components, hooks] + all in each | All transforms in both categories  |

---

## Part 2: Non-Interactive Mode (CLI Flags)

Use CLI flags to run without prompts - perfect for CI/CD and automation.

### Required Flags

For non-interactive mode, you must provide:

- `-p, --preset <name>` - Migration preset (e.g., v8-to-v9)
- `--path <path>` - Target path (default: ./src)
- One selection: `--all`, `--category`, `--item`, or `--transform`

### Selection Flags

Each selection level runs progressively more transforms:

| Flag          | What It Runs            | Example                                      |
| ------------- | ----------------------- | -------------------------------------------- |
| `--all`       | Everything              | All categories → all items → all transforms  |
| `--category`  | All items in category   | All transforms for selected category's items |
| `--item`      | All transforms for item | All transforms for the selected item         |
| `--transform` | Specific transform only | Just that one transform                      |

#### `--all`

Migrate everything (all categories, items, and transforms).

```bash
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --all
```

#### `--category <categories...>`

Migrate specific categories (can specify multiple).

**This runs ALL items and transforms in the selected categories.**

```bash
# Single category (runs all items and transforms in components)
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --category components

# Multiple categories
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --category components hooks
```

**Example:** `--category components` will run all transforms for Button, Input, and any other components.

#### `--item <items...>`

Migrate specific items using dot notation: `category.item`

**This runs ALL transforms for the selected items.**

```bash
# Single item (runs all transforms for Button)
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --item components.Button

# Multiple items
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --item components.Button components.Input hooks.useTheme
```

**Why dot notation?** Items can have the same name in different categories, so `category.item` ensures we select the right one.

#### `--transform <transforms...>`

Migrate specific transforms using full dot notation: `category.item.transform-name`

```bash
# Single transform (most granular control)
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --transform components.Button.button-variant-to-appearance

# Multiple transforms
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src \
  --transform components.Button.button-variant-to-appearance \
  --transform components.Input.input-size-values
```

**Why full path?** Transform names might be reused across items, so `category.item.transform` is the unique identifier.

### Mode Flags

#### `-d, --dry-run`

Preview changes without modifying files.

```bash
# Dry-run (safe to test)
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --all --dry-run

# Apply changes (no flag)
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --all
```

#### `--skip-confirmation`

Skip confirmation prompts (useful for automation).

```bash
# For CI/CD
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --all --skip-confirmation
```

**⚠️ Use with caution** - bypasses all safety prompts!

### Utility Flags

#### `--clear-history`

Clear migration history for a path.

```bash
# With confirmation
npx @coinbase/cds-migrator --clear-history --path ./src

# Skip confirmation
npx @coinbase/cds-migrator --clear-history --path ./src --skip-confirmation
```

**Note:** Only requires `--path`, no preset needed.

#### `-h, --help`

Show help message with all flags.

```bash
npx @coinbase/cds-migrator --help
```

#### `-V, --version`

Show package version.

```bash
npx @coinbase/cds-migrator --version
```

### Flags Summary Table

| Flag                  | Short | Description         | Example                                 |
| --------------------- | ----- | ------------------- | --------------------------------------- |
| `--preset`            | `-p`  | Migration preset    | `-p v8-to-v9`                           |
| `--path`              |       | Target path         | `--path ./src`                          |
| `--dry-run`           | `-d`  | Preview mode        | `-d`                                    |
| `--skip-confirmation` |       | Skip prompts        | `--skip-confirmation`                   |
| `--clear-history`     |       | Clear history       | `--clear-history`                       |
| `--all`               |       | Migrate everything  | `--all`                                 |
| `--category`          |       | Specific categories | `--category components`                 |
| `--item`              |       | Specific items      | `--item components.Button`              |
| `--transform`         |       | Specific transforms | `--transform components.Button.variant` |
| `--help`              | `-h`  | Show help           | `-h`                                    |
| `--version`           | `-V`  | Show version        | `-V`                                    |

---

## Part 3: Common Workflows

### Local Development

```bash
# Interactive (recommended)
npx @coinbase/cds-migrator

# Quick dry-run
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --all --dry-run
```

### CI/CD Pipeline

```bash
#!/bin/bash
# migrate.sh

# Preview first
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --all --dry-run --skip-confirmation

# Apply if preview succeeded
if [ $? -eq 0 ]; then
  npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --all --skip-confirmation
fi
```

### GitHub Actions

```yaml
name: CDS Migration
on: workflow_dispatch

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Run migration
        run: |
          npx @coinbase/cds-migrator \
            --preset v8-to-v9 \
            --path ./src \
            --all \
            --skip-confirmation

      - name: Upload log
        uses: actions/upload-artifact@v3
        with:
          name: migration-log
          path: migration.log
```

### Incremental Migration

```bash
# Day 1: Components
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --category components

# Day 2: Hooks
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --category hooks

# Day 3: Everything else
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --all
```

History tracking ensures no duplicates across runs.

### Package.json Scripts

Add migration scripts to your project for convenience:

```json
{
  "scripts": {
    "migrate": "cds-migrate",
    "migrate:dry": "cds-migrate -p v8-to-v9 --path ./src --all --dry-run",
    "migrate:apply": "cds-migrate -p v8-to-v9 --path ./src --all --skip-confirmation",
    "migrate:components": "cds-migrate -p v8-to-v9 --path ./src --category components"
  }
}
```

Then use them:

```bash
yarn migrate          # Interactive mode
yarn migrate:dry      # Preview all changes
yarn migrate:apply    # Apply all changes
yarn migrate:components  # Migrate only components
```

---

## Part 4: Interactive vs Non-Interactive

### When to Use Interactive Mode

✅ **Use interactive when:**

- First-time migration
- Want to explore options
- Not sure what to migrate
- Manual review needed

```bash
npx @coinbase/cds-migrator
# Prompts guide you through
```

### When to Use Non-Interactive Mode

✅ **Use non-interactive when:**

- CI/CD pipelines
- Automated scripts
- You know exactly what to migrate
- Repeated operations

```bash
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --all --skip-confirmation
```

### Switching Between Modes

The tool automatically detects which mode based on provided flags:

**Triggers Interactive:**

```bash
npx @coinbase/cds-migrator                         # No flags
npx @coinbase/cds-migrator -p v8-to-v9            # Missing selection
npx @coinbase/cds-migrator --path ./src --all     # Missing preset
```

**Triggers Non-Interactive:**

```bash
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --all  # All required flags
```

---

## Part 5: Examples by Use Case

### Complete Migration

```bash
# Step 1: Preview everything
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --all --dry-run

# Step 2: Review migration.log
cat migration.log

# Step 3: Apply changes
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --all
```

### Selective Migration

```bash
# Just components category
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --category components

# Just Button item (all its transforms)
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --item components.Button

# Just one specific transform
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src \
  --transform components.Button.button-variant-to-appearance
```

### Testing During Development

```bash
# Test on sample directory
npx @coinbase/cds-migrator -p v8-to-v9 --path ./test-samples --all

# Clear and re-test
npx @coinbase/cds-migrator --clear-history --path ./test-samples --skip-confirmation
npx @coinbase/cds-migrator -p v8-to-v9 --path ./test-samples --all
```

### Automated Daily Migration

```bash
#!/bin/bash
# daily-migrate.sh

DATE=$(date +%Y-%m-%d)
LOG_DIR="./migration-logs"

mkdir -p "$LOG_DIR"

npx @coinbase/cds-migrator \
  -p v8-to-v9 \
  --path ./src \
  --all \
  --skip-confirmation \
  && mv migration.log "$LOG_DIR/migration-$DATE.log"
```

---

## Troubleshooting

### "Error: Must specify --all, --category, --item, or --transform"

You need to specify what to migrate:

```bash
# ❌ Missing selection
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src

# ✅ With selection
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --all
```

### "Warning: Some transforms have already been run"

Options:

1. Use `--skip-confirmation` (automatically skips duplicates)
2. Use `--clear-history` first to reset
3. Switch to interactive mode to choose options

```bash
# Skip duplicate warning
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --all --skip-confirmation
```

### Invalid Preset

Check available presets:

```bash
npx @coinbase/cds-migrator --help
```

Currently available: `v8-to-v9`

---

## Exit Codes

| Code | Meaning                                                        |
| ---- | -------------------------------------------------------------- |
| `0`  | Success                                                        |
| `1`  | Error (migration failed, validation failed, or user cancelled) |

**Example:**

```bash
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --all --skip-confirmation
if [ $? -eq 0 ]; then
  echo "✅ Migration succeeded"
else
  echo "❌ Migration failed"
  exit 1
fi
```

---

## See Also

- [Quick Start](./QUICK_START.md) - Your first migration
- [Configuration](./CONFIGURATION.md) - Understanding the structure
- [History](./HISTORY.md) - How tracking works
- [Writing Transforms](./WRITING_TRANSFORMS.md) - Creating codemods
- [Utilities API](./UTILITIES.md) - Helper functions
