# @coinbase/cds-migrator

Code migration tools for the Coinbase Design System.

## Quick Start

```bash
# Interactive mode (recommended)
npx @coinbase/cds-migrator

# Non-interactive mode
npx @coinbase/cds-migrator -m v8-to-v9 -p ./src --all --dry-run
```

**→ See [Quick Start Guide](./docs/QUICK_START.md) for complete walkthrough.**

## Features

- 🎯 **Granular Selection** - Migrate everything or choose specific components/hooks/utilities
- 📝 **History Tracking** - Automatically prevents duplicate migrations
- 🔍 **Dry-Run Mode** - Preview all changes before applying
- 📊 **Comprehensive Logging** - Track successes, warnings, and manual TODOs
- 💬 **TODO Comments** - Automatically marks code that needs manual review
- 🌳 **Configuration-Based** - Three-level structure (categories → variables → transforms)

## Supported Migrations

| Version     | Description                                          | Status       |
| ----------- | ---------------------------------------------------- | ------------ |
| **v8 → v9** | Component API updates, hook changes, utility updates | ✅ Available |

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

? Which major version migration do you need?
  ❯ v8 to v9 - Migrate from CDS v8 to v9

? Enter the path to your codebase: ./src

? What would you like to migrate?
  ❯ Everything (all changes)
    By category (components, hooks, etc.)
    By item (specific component/hook/utility)
    By specific transform

Migration Plan:
================
📦 components: Component API changes
  └─ Button (@coinbase/cds-web)
     • Rename 'variant' prop to 'appearance'

Total transforms: 1

? Run in dry-run mode? Yes

  → Running transform: components.Button.button-variant-to-appearance
  ✓ Transform completed

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

### Adding New Migrations

See [docs/CONFIGURATION.md](./docs/CONFIGURATION.md) for complete instructions.

Quick steps:

1. Create `src/v9-to-v10/` directory
2. Add `config.json` with three-level structure
3. Create transforms in `transforms/` directory
4. Update `SUPPORTED_MIGRATIONS` in `src/cli.ts`

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
