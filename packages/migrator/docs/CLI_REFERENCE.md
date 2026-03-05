# CLI Reference

Complete reference for the CDS Migrator CLI.

## Installation

```bash
# Install as dev dependency (recommended)
yarn add -D @coinbase/cds-migrator

# Or use npx without installing
npx @coinbase/cds-migrator
```

## How It Works

The CLI prompts only for missing information:

- Provide all args → runs immediately
- Provide some args → prompts for the rest
- Provide no args → prompts for everything

## Quick Reference

```bash
# Run entire preset (default)
npx @coinbase/cds-migrator ./src -p v8-to-v9

# Select specific transforms
npx @coinbase/cds-migrator ./src -p v8-to-v9 --partial

# Run transforms directly (no preset!)
npx @coinbase/cds-migrator ./src -t button-variant-to-appearance

# Multiple transforms
npx @coinbase/cds-migrator ./src -t button-variant -t input-size

# Dry-run mode
npx @coinbase/cds-migrator ./src -p v8-to-v9 --dry-run

# Clear history
npx @coinbase/cds-migrator ./src --clear-history
```

Use `npx` for one-off usage without installing, or `yarn cds-migrate` if you've installed the package.

---

#### `-t, --transform <transforms...>`

Run transforms directly - no preset needed:

```bash
# Single transform
npx @coinbase/cds-migrator ./src -t button-variant-to-appearance

# Multiple transforms
npx @coinbase/cds-migrator ./src -t button-variant -t input-size
```

**Transforms are standalone files** in `src/transforms/` that run independently.

### Mode Flags

#### `-d, --dry-run`

Preview changes without modifying files.

```bash
# Dry-run (safe to test)
npx @coinbase/cds-migrator ./src -p v8-to-v9 --dry-run

# Apply changes (no flag)
npx @coinbase/cds-migrator ./src -p v8-to-v9
```

#### `--skip-confirmation`

Automatically filter out already-run transforms without prompting.

```bash
# For automation
npx @coinbase/cds-migrator ./src -p v8-to-v9 --skip-confirmation
```

**Use for:** CI/CD pipelines, scripts, repeated operations.

### Utility Flags

#### `--clear-history`

Clear migration history for a path.

```bash
# With confirmation
npx @coinbase/cds-migrator --clear-history ./src

# Skip confirmation
npx @coinbase/cds-migrator --clear-history ./src --skip-confirmation
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

---

## Common Workflows

### Local Development

```bash
# Fully interactive
npx @coinbase/cds-migrator

# Quick dry-run of entire preset
npx @coinbase/cds-migrator ./src -p v8-to-v9 --dry-run

# Single transform
npx @coinbase/cds-migrator ./src -t button-variant --dry-run
```

### CI/CD Pipeline

```bash
#!/bin/bash
# migrate.sh

# Preview first
npx @coinbase/cds-migrator ./src -p v8-to-v9 --dry-run --skip-confirmation

# Apply if preview succeeded
if [ $? -eq 0 ]; then
  npx @coinbase/cds-migrator ./src -p v8-to-v9 --skip-confirmation
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
            ./src \
            -p v8-to-v9 \
            --skip-confirmation

      - name: Upload log
        uses: actions/upload-artifact@v3
        with:
          name: migration-log
          path: migration.log
```

### Incremental Migration

```bash
# Day 1: Specific transform
npx @coinbase/cds-migrator ./src -t button-variant

# Day 2: Everything else (auto-skips Day 1)
npx @coinbase/cds-migrator ./src -p v8-to-v9
```

### Package.json Scripts

Add migration scripts to your project for convenience:

```json
{
  "scripts": {
    "migrate": "cds-migrate",
    "migrate:dry": "cds-migrate ./src -p v8-to-v9 --dry-run",
    "migrate:apply": "cds-migrate ./src -p v8-to-v9 --skip-confirmation"
  }
}
```

Then use them:

```bash
yarn migrate          # Fully interactive
yarn migrate:dry      # Preview all changes
yarn migrate:apply    # Apply all changes
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
npx @coinbase/cds-migrator ./src -p v8-to-v9 --skip-confirmation
```

### Switching Between Modes

The tool automatically detects which mode based on provided flags:

**Triggers Interactive:**

```bash
npx @coinbase/cds-migrator                         # No flags
npx @coinbase/cds-migrator -p v8-to-v9            # Missing selection
npx @coinbase/cds-migrator ./src     # Missing preset
```

**Triggers Non-Interactive:**

```bash
npx @coinbase/cds-migrator ./src -p v8-to-v9  # All required flags
```

---

## Examples by Use Case

### Complete Migration

```bash
# Step 1: Preview everything
npx @coinbase/cds-migrator ./src -p v8-to-v9 --dry-run

# Step 2: Review migration.log
cat migration.log

# Step 3: Apply changes
npx @coinbase/cds-migrator ./src -p v8-to-v9
```

### Selective Migration

```bash
# Multi-select from preset
npx @coinbase/cds-migrator ./src -p v8-to-v9 --partial

# Or run transforms directly
npx @coinbase/cds-migrator ./src -t button-variant -t input-size
```

### Testing During Development

```bash
# Test on sample directory
npx @coinbase/cds-migrator ./test-samples -p v8-to-v9

# Clear and re-test
npx @coinbase/cds-migrator --clear-history --path ./test-samples --skip-confirmation
npx @coinbase/cds-migrator ./test-samples -p v8-to-v9
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
  ./src \
  \
  --skip-confirmation \
  && mv migration.log "$LOG_DIR/migration-$DATE.log"
```

---

## Troubleshooting

### Common Questions

You need to specify what to migrate:

```bash
# ❌ Missing selection
npx @coinbase/cds-migrator ./src -p v8-to-v9

# ✅ With selection
npx @coinbase/cds-migrator ./src -p v8-to-v9
```

### "Warning: Some transforms have already been run"

Options:

1. Use `--skip-confirmation` (automatically skips duplicates)
2. Use `--clear-history` first to reset
3. Switch to interactive mode to choose options

```bash
# Skip duplicate warning
npx @coinbase/cds-migrator ./src -p v8-to-v9 --skip-confirmation
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
npx @coinbase/cds-migrator ./src -p v8-to-v9 --skip-confirmation
if [ $? -eq 0 ]; then
  echo "✅ Migration succeeded"
else
  echo "❌ Migration failed"
  exit 1
fi
```

---

## See Also

- [Contributing Guide](./CONTRIBUTING.md) - Creating transforms and presets
- [History Guide](./HISTORY.md) - Advanced history tracking
