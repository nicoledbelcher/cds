# CLI Reference

Complete guide for using the CDS Migrator in both interactive and non-interactive modes.

## Quick Reference

### Interactive Mode

```bash
npx @coinbase/cds-migrator
# Follow prompts to select what to migrate
```

### Non-Interactive Mode (CLI Flags)

```bash
# Migrate everything
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --all

# Migrate specific category
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --category components

# Migrate specific items
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --item components.Button

# Clear history
npx @coinbase/cds-migrator --clear-history -p ./src
```

---

## Part 1: Interactive Mode

### Selection Hierarchy

The migrator offers four levels of selection granularity:

```
1. Everything          → Migrate all categories, items, and transforms
   ↓
2. By Category        → Select one or more categories (or all)
   ↓
3. By Item            → Select specific components/hooks/utilities (or all)
   ↓
4. By Transform       → Select individual transforms (or all)
```

### Selection Flow

```
? Which version migration? → v8 to v9
? Enter path → ./src
[Shows history if exists]
? What would you like to migrate?
  ❯ Everything (all changes)
    By category (components, hooks, etc.)
    By item (specific component/hook/utility)
    By specific transform
```

### 1. Everything

Fastest path - migrate all changes at once.

**When to use:**

- First-time migration
- Small codebase
- Want everything done quickly

```
? What would you like to migrate?
  ❯ Everything (all changes)

✓ Runs all transforms immediately
```

### 2. By Category

Select categories of changes with "All" option.

**When to use:**

- Focus on one type (components, hooks, utilities)
- Phased migration strategy

```
? Select categories to migrate:
  ◯ 🔘 All categories          ← Migrates everything
  ◯ components - Component API changes
  ◯ hooks - Hook API changes
  ◯ utilities - Utility function changes
```

### 3. By Item

Select specific components/hooks/utilities with "All" option.

**When to use:**

- Test one component at a time
- Different PRs for different components

```
? Select items to migrate:
  ◯ 🔘 All items               ← Migrates everything
  ◯ components.Button - Button changes (@coinbase/cds-web)
  ◯ components.Input - Input changes (@coinbase/cds-web)
  ◯ hooks.useTheme - useTheme changes (@coinbase/cds-common)
```

### 4. By Transform

Select individual transforms with "All" option.

**When to use:**

- Maximum control
- Debugging issues
- Review each change carefully

```
? Select transforms to run:
  ◯ 🔘 All transforms          ← Migrates everything
  ◯ components.Button.button-variant-to-appearance - Rename 'variant' prop
  ◯ components.Input.input-size-values - Update size values
  ◯ hooks.useTheme.use-theme-return-type - Update return type
```

### Multiple Paths to "Migrate Everything"

All of these produce the same result:

| Path                             | When to Use                      |
| -------------------------------- | -------------------------------- |
| Everything (all changes)         | Fastest - just go!               |
| By category → 🔘 All categories  | Want to see categories first     |
| By item → 🔘 All items           | Want to see all items first      |
| By transform → 🔘 All transforms | Want to review each change first |

**Choose based on how much you want to explore before committing!**

### Decision Tree

```
Do you want to migrate everything?
│
├─ YES, fast → "Everything (all changes)"
├─ YES, see categories first → "By category" → "🔘 All categories"
├─ YES, see items first → "By item" → "🔘 All items"
├─ YES, review changes first → "By transform" → "🔘 All transforms"
│
└─ NO, be selective
   ├─ By category → Select specific ones
   ├─ By item → Select specific ones
   └─ By transform → Select specific ones
```

---

## Part 2: Non-Interactive Mode (CLI Flags)

Use CLI flags to run without prompts - perfect for CI/CD and automation.

### Required Flags

For non-interactive mode, you must provide:

- `-m, --migration <version>` - Migration version (e.g., v8-to-v9)
- `-p, --path <path>` - Target path (default: ./src)
- One selection: `--all`, `--category`, `--item`, or `--transform`

### Selection Flags

#### `--all`

Migrate everything.

```bash
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --all
```

#### `--category <categories...>`

Migrate specific categories (can specify multiple).

```bash
# Single category
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --category components

# Multiple categories
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --category components hooks
```

#### `--item <items...>`

Migrate specific items (format: `category.item`).

```bash
# Single item
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --item components.Button

# Multiple items
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --item components.Button components.Input hooks.useTheme
```

#### `--transform <transforms...>`

Migrate specific transforms (format: `category.item.transform-name`).

```bash
# Single transform
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --transform components.Button.button-variant-to-appearance

# Multiple transforms
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src \
  --transform components.Button.button-variant-to-appearance \
  --transform components.Input.input-size-values
```

### Mode Flags

#### `-d, --dry-run`

Preview changes without modifying files.

```bash
# Dry-run (safe to test)
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --all --dry-run

# Apply changes (no flag)
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --all
```

#### `--skip-confirmation`

Skip confirmation prompts (useful for automation).

```bash
# For CI/CD
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --all --skip-confirmation
```

**⚠️ Use with caution** - bypasses all safety prompts!

### Utility Flags

#### `--clear-history`

Clear migration history for a path.

```bash
# With confirmation
npx @coinbase/cds-migrator --clear-history -p ./src

# Skip confirmation
npx @coinbase/cds-migrator --clear-history -p ./src --skip-confirmation
```

**Note:** Only requires `--path`, no migration version needed.

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

| Flag                  | Short | Description         | Example                                        |
| --------------------- | ----- | ------------------- | ---------------------------------------------- |
| `--migration`         | `-m`  | Migration version   | `-m v8-to-v9`                                  |
| `--path`              | `-p`  | Target path         | `-p ./src`                                     |
| `--dry-run`           | `-d`  | Preview mode        | `-d`                                           |
| `--skip-confirmation` |       | Skip prompts        | `--skip-confirmation`                          |
| `--clear-history`     |       | Clear history       | `--clear-history`                              |
| `--all`               |       | Migrate everything  | `--all`                                        |
| `--category`          |       | Specific categories | `--category components`                        |
| `--item`              |       | Specific items      | `--item components.Button`                     |
| `--transform`         |       | Specific transforms | `--transform components.Button.button-variant` |
| `--help`              | `-h`  | Show help           | `-h`                                           |
| `--version`           | `-V`  | Show version        | `-V`                                           |

---

## Part 3: Common Workflows

### Local Development

```bash
# Interactive (recommended)
npx @coinbase/cds-migrator

# Quick dry-run
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --all --dry-run
```

### CI/CD Pipeline

```bash
#!/bin/bash
# migrate.sh

# Preview first
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --all --dry-run --skip-confirmation

# Apply if preview succeeded
if [ $? -eq 0 ]; then
  npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --all --skip-confirmation
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
            --migration v8-to-v9 \
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
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --category components

# Day 2: Hooks
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --category hooks

# Day 3: Everything else
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --all
```

History tracking ensures no duplicates across runs.

### Package.json Scripts

```json
{
  "scripts": {
    "migrate:dry": "cds-migrate -m v8-to-v9 -p ./src --all --dry-run",
    "migrate:apply": "cds-migrate -m v8-to-v9 -p ./src --all --skip-confirmation",
    "migrate:components": "cds-migrate -m v8-to-v9 -p ./src --category components",
    "migrate:reset": "cds-migrate --clear-history -p ./src --skip-confirmation"
  }
}
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
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --all --skip-confirmation
```

### Switching Between Modes

The tool automatically detects which mode based on provided flags:

**Triggers Interactive:**

```bash
npx @coinbase/cds-migrator                    # No flags
npx @coinbase/cds-migrator -m v8-to-v9       # Missing selection
npx @coinbase/cds-migrator -p ./src --all    # Missing version
```

**Triggers Non-Interactive:**

```bash
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --all  # All required flags
```

---

## Part 5: Examples by Use Case

### Complete Migration

```bash
# Step 1: Preview everything
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --all --dry-run

# Step 2: Review migration.log
cat migration.log

# Step 3: Apply changes
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --all
```

### Selective Migration

```bash
# Just Button component
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --item components.Button

# Just one transform
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src \
  --transform components.Button.button-variant-to-appearance
```

### Testing During Development

```bash
# Test on sample directory
npx @coinbase/cds-migrator -m v8-to-v9 -p ./test-samples --all

# Clear and re-test
npx @coinbase/cds-migrator --clear-history -p ./test-samples --skip-confirmation
npx @coinbase/cds-migrator -m v8-to-v9 -p ./test-samples --all
```

### Automated Daily Migration

```bash
#!/bin/bash
# daily-migrate.sh

DATE=$(date +%Y-%m-%d)
LOG_DIR="./migration-logs"

mkdir -p "$LOG_DIR"

npx @coinbase/cds-migrator \
  -m v8-to-v9 \
  -p ./src \
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
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src

# ✅ With selection
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --all
```

### "Warning: Some transforms have already been run"

Options:

1. Use `--skip-confirmation` (automatically skips duplicates)
2. Use `--clear-history` first to reset
3. Switch to interactive mode to choose options

```bash
# Skip duplicate warning
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --all --skip-confirmation
```

### Invalid Migration Version

Check available versions:

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
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --all --skip-confirmation
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
