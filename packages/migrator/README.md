# @coinbase/cds-migrator

Code migration tools for the Coinbase Design System.

## Quick Start

```bash
# Interactive mode (recommended)
npx @coinbase/cds-migrator

# Non-interactive mode
npx @coinbase/cds-migrator -p v8-to-v9 --path ./src --all --dry-run
```

**→ See [Quick Start Guide](./docs/QUICK_START.md) for complete walkthrough.**

## Features

- 🎯 **Hierarchical Selection** - Choose category, then drill down to specific transforms
- 📝 **History Tracking** - Automatically prevents duplicate migrations
- 🔍 **Dry-Run Mode** - Preview all changes before applying
- 📊 **Comprehensive Logging** - Track successes, warnings, and manual TODOs
- 💬 **TODO Comments** - Automatically marks code that needs manual review
- 🌳 **Configuration-Based** - Three-level structure (categories → items → transforms)
- 🚀 **Convenience Commands** - `cds-migrate`, `cds-migrate:all`, `cds-migrate:clear-history`

## Available Presets

| Preset       | Description                                          | Status       |
| ------------ | ---------------------------------------------------- | ------------ |
| **v8-to-v9** | Component API updates, hook changes, utility updates | ✅ Available |

**Note:** Presets aren't just for version migrations - you can create presets for any collection of code transforms (deprecations, refactors, style updates, etc.).

## How It Works

The migrator uses a **simple 3-step selection**:

1. **Choose a preset** (e.g., v8-to-v9)
2. **Choose a category** (or "All categories" to migrate everything)
3. **Choose a transform** in that category (or "All transforms" to run all)

This hierarchical approach makes it easy to focus on one area at a time without being overwhelmed by choices.

## Convenience Commands

After installation, you get three commands:

- `cds-migrate` - Full interactive CLI
- `cds-migrate:all -p <preset>` - Quick migrate everything
- `cds-migrate:clear-history` - Quick clear history

## Documentation

### 📘 For Users

Start here if you're using the migrator to upgrade your codebase:

1. **[Quick Start Guide](./docs/QUICK_START.md)** ⭐
   - Get up and running in 5 minutes
   - Your first migration walkthrough
   - Common workflows and troubleshooting

2. **[CLI Reference](./docs/CLI_REFERENCE.md)** ⭐
   - Interactive and non-interactive modes
   - Selection options and "All" shortcuts
   - CLI flags reference
   - CI/CD integration examples

3. **[Migration History](./docs/HISTORY.md)**
   - How duplicate prevention works
   - Understanding the history file
   - Clearing history
   - Team collaboration guidelines

### 🔧 For Contributors

Read these if you're adding new migrations or transforms:

4. **[Configuration Guide](./docs/CONFIGURATION.md)** ⭐
   - Three-level structure explained
   - Adding new migration versions
   - Adding transforms to existing migrations
   - Configuration best practices

5. **[Writing Transforms](./docs/WRITING_TRANSFORMS.md)** ⭐
   - Creating jscodeshift codemods
   - Common transformation patterns
   - Testing transforms
   - Best practices and anti-patterns

6. **[Utilities API](./docs/UTILITIES.md)**
   - Complete API reference
   - TODO insertion functions
   - Logging utilities
   - Type definitions

## Example Session

```
🚀 CDS Migrator

? Which migration preset do you need?
  ❯ v8 to v9 - Migrate from CDS v8 to v9

? Enter the path to your codebase: ./src

? Which category of transforms do you want to run?
  ❯ 🔘 All categories
    components - Component API changes
    hooks - Hook API changes
    utilities - Utility function changes

Migration Plan:
================
📦 components: Component API changes
  └─ Button (@coinbase/cds-web)
     • Rename 'variant' prop to 'appearance'
  └─ Input (@coinbase/cds-web)
     • Update size prop values

📦 hooks: Hook API changes
  └─ useTheme (@coinbase/cds-common)
     • Update destructured return values

📦 utilities: Utility function changes
  └─ formatCurrency (@coinbase/cds-utils)
     • Update formatCurrency options parameter

Total transforms: 4

? Run in dry-run mode? Yes

  → Running transform: components.Button.button-variant-to-appearance
  ✓ Transform completed

  [... 3 more transforms ...]

✅ Migration completed successfully!
📝 Migration log written to: migration.log
```

## Project Structure

```
packages/migrator/
├── docs/                   # Documentation
│   ├── QUICK_START.md      # Getting started guide
│   ├── CLI_REFERENCE.md            # Interactive & non-interactive modes
│   ├── CONFIGURATION.md    # Config structure and setup
│   ├── WRITING_TRANSFORMS.md # Transform development
│   ├── UTILITIES.md        # Utils API reference
│   └── HISTORY.md          # History tracking guide
├── src/
│   ├── cli.ts              # Interactive CLI
│   ├── runner.ts           # Migration executor
│   ├── types.ts            # TypeScript types
│   ├── utils/              # Shared utilities
│   └── v8-to-v9/           # Version-specific migrations
│       ├── config.json     # Migration configuration
│       └── transforms/     # jscodeshift codemods
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

See [docs/CONFIGURATION.md](./docs/CONFIGURATION.md) for complete instructions.

Quick steps:

1. Create `src/v9-to-v10/` directory
2. Add `config.json` with three-level structure
3. Create transforms in `transforms/` directory (as `.ts` files)
4. Update `AVAILABLE_PRESETS` in `src/cli.ts`

## Contributing

When creating transforms:

- ✅ Write idempotent transforms (safe to run multiple times)
- ✅ Use the logging utilities to track changes
- ✅ Add TODO comments for complex cases
- ✅ Test in dry-run mode first
- ✅ Update the config.json

See [docs/WRITING_TRANSFORMS.md](./docs/WRITING_TRANSFORMS.md) for detailed guide.

## License

See LICENSE in the root of the repository.
