# @coinbase/cds-migrator

Code migration tools for the Coinbase Design System.

## Installation

```bash
# Install as dev dependency (recommended)
yarn add -D @coinbase/cds-migrator

# Or use npx without installing
npx @coinbase/cds-migrator
```

## Quick Start

### Your First Migration

**1. Run the CLI**

```bash
npx @coinbase/cds-migrator
# Or with path: npx @coinbase/cds-migrator ./src
```

**2. Follow the Prompts**

```
? Enter the path to your codebase: ./src
? Which migration preset do you need? v8 to v9
```

**That's it!** Runs all transforms by default. Use `--partial` to select specific ones.

**3. Review Changes**

The migrator will:

- Run transforms and display progress
- Create `migration.log` with details
- Add TODO comments where manual work is needed

**4. Commit**

```bash
git add .
git commit -m "Migrate from CDS v8 to v9"
```

### Common Workflows

**Quick & Complete:**

```bash
# Preview
npx @coinbase/cds-migrator ./src -p v8-to-v9 --dry-run

# Review log
cat migration.log

# Apply
npx @coinbase/cds-migrator ./src -p v8-to-v9
```

**One Transform:**

```bash
npx @coinbase/cds-migrator ./src -t button-variant-to-appearance --dry-run
```

**Multiple Transforms:**

```bash
npx @coinbase/cds-migrator ./src -t button-variant -t input-size --dry-run
```

## Features

- 🎯 **Smart Prompting** - Only prompts for missing information
- 📦 **Flexible Execution** - Use presets for grouped migrations or run transforms directly
- 📝 **History Tracking** - Automatically prevents duplicate migrations
- 🌊 **Dry-Run Mode** - Preview all changes before applying
- 📊 **Comprehensive Logging** - Track successes, warnings, and manual TODOs
- 💬 **TODO Comments** - Automatically marks code that needs manual review

## How It Works

**Presets** are curated collections of related transforms (e.g., all transforms needed for v8→v9 migration). You can use a preset to run multiple transforms at once, or run individual transforms directly.

| Preset       | Description                                          | Status       |
| ------------ | ---------------------------------------------------- | ------------ |
| **v8-to-v9** | Component API updates, hook changes, utility updates | ✅ Available |

**Note:** Presets aren't just for version migrations - you can create presets for any collection of code transforms (deprecations, refactors, style updates, etc.).

## Usage

### Preset Mode

Run all transforms in a preset (default) or select specific ones:

```bash
# Run all transforms in preset (default)
npx @coinbase/cds-migrator ./src -p v8-to-v9

# Select specific transforms with multi-select
npx @coinbase/cds-migrator ./src -p v8-to-v9 --partial
```

### Direct Transform Mode

Run transforms directly without a preset:

```bash
# Single transform
npx @coinbase/cds-migrator ./src -t button-variant-to-appearance

# Multiple transforms
npx @coinbase/cds-migrator ./src -t button-variant-to-appearance -t input-size-values

# Transform in subdirectory
npx @coinbase/cds-migrator ./src -t components/button-variant
```

### Fully Interactive

Omit flags to be prompted for everything:

```bash
npx @coinbase/cds-migrator
# Prompts for: path → preset → transforms (if --partial)
```

**Note:** Path is the first positional argument. The CLI prompts only for missing information.

## Documentation

### 📘 For Users

1. **[CLI Reference](./docs/CLI_REFERENCE.md)** - Complete CLI usage guide
2. **[History Guide](./docs/HISTORY.md)** - Advanced history tracking
3. **[Preset Guides](./docs/guides/)** - Version-specific migration guides

### 🔧 For Contributors

1. **[Contributing Guide](./docs/CONTRIBUTING.md)** - Creating transforms, presets, and APIs

## What Gets Created

After running a migration:

```
your-project/
├── src/
│   ├── .cds-migration-history.json  # ← Tracks applied migrations (commit this!)
│   └── ... (your modified files)
└── migration.log                    # ← Detailed log (review then delete)
```

## Migration History

The migrator automatically tracks which transforms have been run to prevent duplicates.

### How It Works

When you run a migration (not in dry-run mode):

1. Records which transform was run and when
2. Stores in `.cds-migration-history.json` in the target directory
3. Checks history before running to prevent duplicates

**The history file should be committed to version control** so team members don't re-run the same migrations.

### What Happens with Duplicates

If you try to run already-applied transforms:

```
⚠️  Warning: Some transforms have already been run on this path:
  • button-variant-to-appearance

? How would you like to proceed?
  ❯ Skip already-run transforms (recommended)
    Re-run all transforms
    Cancel
```

**Use `--skip-confirmation`** to auto-filter duplicates without prompting.

### Clearing History

```bash
# With confirmation
npx @coinbase/cds-migrator ./src --clear-history

# Skip confirmation
npx @coinbase/cds-migrator ./src --clear-history --skip-confirmation
```

**When to clear:**

- Failed migration that needs to be re-run
- Testing/development
- After rolling back code changes

**See [docs/HISTORY.md](./docs/HISTORY.md) for advanced usage.**

## Project Structure

```
packages/migrator/
├── docs/                          # General documentation
│   ├── QUICK_START.md             # Getting started guide
│   ├── CLI_REFERENCE.md           # CLI usage reference
│   ├── PRESET.md           # Config structure guide
│   ├── WRITING_TRANSFORMS.md      # Transform development
│   ├── UTILITIES.md               # Utils API reference
│   └── HISTORY.md                 # History tracking guide
├── docs/                          # Documentation
│   ├── guides/                    # Preset-specific migration guides
│   │   └── v8-to-v9.md            # v8-to-v9 migration guide
│   ├── QUICK_START.md
│   ├── CLI_REFERENCE.md
│   └── ...
├── src/
│   ├── cli.ts                     # Interactive CLI
│   ├── runner.ts                  # Migration executor
│   ├── types.ts                   # TypeScript types
│   ├── utils/                     # Shared utilities
│   ├── bin/                       # Convenience bin commands
│   ├── presets/                   # Preset configurations
│   │   └── v8-to-v9/
│   │       └── manifest.json        # Simple list of transforms
│   └── transforms/                # Transform implementations (reusable!)
│       └── example-transform.ts
└── package.json
```

## Development

### Build & Test

```bash
# Build the package
yarn nx run migrator:build

# Type check
yarn nx run migrator:typecheck

# Lint
yarn nx run migrator:lint

# Test the CLI
cd packages/migrator
node esm/cli.js
```

### Adding New Presets

See [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md#creating-presets) for complete instructions.

Quick steps:

1. Create `src/presets/v9-to-v10/` directory
2. Add `manifest.json` with a flat list of transforms:
   ```json
   {
     "preset": "v9-to-v10",
     "description": "Migration from CDS v9 to v10",
     "transforms": [
       {
         "name": "my-transform",
         "description": "What it does (@package/name)",
         "file": "my-transform"
       }
     ]
   }
   ```
3. Create transform file in `src/transforms/my-transform.ts`
4. Add guide in `src/guides/v9-to-v10.md`
5. Update `AVAILABLE_PRESETS` in `src/cli.ts`

**Note:** Transforms in `src/transforms/` can be reused across multiple presets!

## Contributing

See [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) for the complete guide to creating transforms.

## License

See LICENSE in the root of the repository.
