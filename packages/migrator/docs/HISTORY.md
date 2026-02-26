# Migration History Tracking

The CDS Migrator automatically tracks which transforms have been run on each directory to prevent accidental duplicate migrations.

## How It Works

### Automatic Tracking

When you run a migration (in non-dry-run mode), the migrator:

1. **Records the transform** - Saves which transform was run, when, and for which version
2. **Creates a history file** - Stores this in `.cds-migration-history.json` in the target directory
3. **Checks before running** - Before executing any transform, checks if it's already been run

### History File

The `.cds-migration-history.json` file is created in your target directory:

```json
{
  "targetPath": "./src",
  "entries": [
    {
      "transformId": "components.Button.button-variant-to-appearance",
      "timestamp": "2026-02-11T12:00:00.000Z",
      "version": "v8-to-v9",
      "dryRun": false
    }
  ],
  "lastUpdated": "2026-02-11T12:00:00.000Z"
}
```

**Important Notes:**

- This file should be **committed to version control**
- It helps team members avoid re-running the same migrations
- Dry-run mode does NOT create or update the history file

## User Experience

### First Run

When running a migration for the first time:

```bash
? What would you like to migrate?
  ❯ Everything (all changes)

Migration Plan:
================
📦 components: Component API changes
  └─ Button (@coinbase/cds-web)
     • Rename 'variant' prop to 'appearance'

Total transforms: 1

? Enter the path to your codebase: ./src
? Run in dry-run mode? No

  → Running transform: components.Button.button-variant-to-appearance
    Rename 'variant' prop to 'appearance'

  ✓ Transform completed: button-variant-to-appearance

✅ Migration completed successfully!
```

### Attempting to Re-run

If you try to run the same migration again:

```bash
Migration Plan:
================
📦 components: Component API changes
  └─ Button (@coinbase/cds-web)
     • Rename 'variant' prop to 'appearance'

Total transforms: 1

? Enter the path to your codebase: ./src
? Run in dry-run mode? No

⚠️  Warning: Some transforms have already been run on this path:

  • components.Button.button-variant-to-appearance

📜 Migration History
==================

v8-to-v9:
  • components.Button.button-variant-to-appearance (2/11/2026)

Last updated: 2/11/2026, 12:00:00 PM

? How would you like to proceed?
  ❯ Skip already-run transforms (recommended)
    Re-run all transforms (may cause issues)
    Cancel migration
```

### Options When Duplicate Detected

1. **Skip already-run transforms (recommended)**
   - Only runs transforms that haven't been executed before
   - Safest option to prevent issues
   - The runner will automatically skip completed transforms

2. **Re-run all transforms (may cause issues)**
   - Forces re-execution of all selected transforms
   - May cause problems if transforms aren't idempotent
   - Use with caution

3. **Cancel migration**
   - Exits without making any changes

### During Execution

When transforms are skipped:

```bash
  → Running transform: components.Input.input-size-values
    Update size prop values (sm/md/lg to small/medium/large)

  ✓ Transform completed: input-size-values

  ⊘ Skipping (already run): components.Button.button-variant-to-appearance

⊘ Skipped 1 transform(s) that were already run.

✅ Migration completed successfully!
```

## API for Programmatic Use

### Load History

```typescript
import { loadMigrationHistory } from '@coinbase/cds-migrator';

const history = loadMigrationHistory('./src');
if (history) {
  console.log(`Last updated: ${history.lastUpdated}`);
  console.log(`Total migrations: ${history.entries.length}`);
}
```

### Check if Transform Was Run

```typescript
import { hasTransformBeenRun } from '@coinbase/cds-migrator';

const wasRun = hasTransformBeenRun('./src', 'components.Button.button-variant-to-appearance');

if (wasRun) {
  console.log('This transform has already been applied');
}
```

### Get Already-Run Transforms

```typescript
import { getAlreadyRunTransforms } from '@coinbase/cds-migrator';

const transformsToRun = [
  'components.Button.button-variant-to-appearance',
  'components.Input.input-size-values',
];

const alreadyRun = getAlreadyRunTransforms('./src', transformsToRun);
console.log('Already run:', alreadyRun);
```

### View History Summary

```typescript
import { buildHistorySummary } from '@coinbase/cds-migrator';

const summary = buildHistorySummary('./src');
console.log(summary);
// Outputs a formatted summary of all migrations
```

### Clear History

**CLI (recommended):**

```bash
# Clear history for a path
npx @coinbase/cds-migrator --clear-history -p ./src

# Skip confirmation prompt
npx @coinbase/cds-migrator --clear-history -p ./src --skip-confirmation
```

**Programmatically:**

```typescript
import { clearMigrationHistory } from '@coinbase/cds-migrator';

// Use with caution - this removes all migration tracking
clearMigrationHistory('./src');
```

## Best Practices

### ✅ Do

- **Commit the history file** to version control
- **Review the history** before running migrations
- **Use dry-run mode** first to preview changes
- **Skip already-run transforms** when prompted (recommended option)

### ❌ Don't

- Don't delete `.cds-migration-history.json` without good reason
- Don't re-run transforms unless absolutely necessary
- Don't ignore warnings about duplicate runs
- Don't add `.cds-migration-history.json` to `.gitignore`

## Team Collaboration

### Scenario: Multiple Team Members

1. **Developer A** runs migration and commits the history file:

   ```bash
   git add .cds-migration-history.json
   git commit -m "Run v8-to-v9 Button migration"
   ```

2. **Developer B** pulls the changes:

   ```bash
   git pull
   ```

3. **Developer B** tries to run the same migration:
   - Migrator detects it was already run
   - Shows warning with history
   - Recommends skipping

### Scenario: Different Directories

If your codebase has multiple directories with different migration states:

```
project/
├── src/
│   └── .cds-migration-history.json  # Migrations complete
└── legacy/
    └── .cds-migration-history.json  # Partial migrations
```

Each directory tracks its own history independently.

## Troubleshooting

### "I need to re-run a transform"

If a transform failed or needs to be re-run:

1. **Option 1:** Choose "Re-run all transforms" when prompted by the migrator
2. **Option 2:** Clear history and start fresh:
   ```bash
   npx @coinbase/cds-migrator --clear-history -p ./src
   ```
3. **Option 3:** Manually edit `.cds-migration-history.json` and remove specific entries

### "History file is out of sync"

If team members have conflicting history files:

1. Review both history files
2. Merge the entries manually in JSON
3. Keep the most complete history
4. Resolve conflicts through code review

### "Transform was run but not recorded"

This can happen if:

- The migration was run in dry-run mode (by design)
- The migrator crashed before saving history
- File permissions prevented writing the history file

Solution: Manually add the entry to `.cds-migration-history.json`

## Clearing Migration History

### Quick Command

```bash
# Clear history with confirmation
npx @coinbase/cds-migrator --clear-history -p ./src

# Skip confirmation (be careful!)
npx @coinbase/cds-migrator --clear-history -p ./src --skip-confirmation
```

### When to Clear History

#### Failed Migration

If a migration failed partway through:

```bash
# Migration failed
npx @coinbase/cds-migrator -p v8-to-v9 -p ./src --all
# Error occurred, some transforms completed but others didn't

# Clear history to start fresh
npx @coinbase/cds-migrator --clear-history -p ./src

# Run migration again
npx @coinbase/cds-migrator -p v8-to-v9 -p ./src --all
```

#### Testing Migrations

During development or testing:

```bash
# Test a migration
npx @coinbase/cds-migrator -p v8-to-v9 -p ./test-dir --all

# Clear to test again
npx @coinbase/cds-migrator --clear-history -p ./test-dir --skip-confirmation

# Re-run with changes
npx @coinbase/cds-migrator -p v8-to-v9 -p ./test-dir --all
```

#### Corrupted History File

If the history file is corrupted or invalid:

```bash
# Clear the corrupted history
npx @coinbase/cds-migrator --clear-history -p ./src --skip-confirmation

# Start fresh
npx @coinbase/cds-migrator -p v8-to-v9 -p ./src --all
```

#### Reset After Rollback

If you rolled back code changes via git:

```bash
# Rolled back code
git reset --hard HEAD~1

# Clear history to match code state
npx @coinbase/cds-migrator --clear-history -p ./src --skip-confirmation
```

### What Gets Deleted

The command removes:

- `.cds-migration-history.json` in the specified path

It does NOT delete:

- Your code changes
- The `migration.log` file
- Any other files

### Bulk Clear

To clear history for multiple directories:

```bash
#!/bin/bash
# clear-all-history.sh

DIRS=("./src" "./lib" "./packages")

for dir in "${DIRS[@]}"; do
  echo "Clearing history for: $dir"
  npx @coinbase/cds-migrator --clear-history -p "$dir" --skip-confirmation
done

echo "✅ All history cleared"
```

### Alternative: Manual Deletion

You can also delete the file directly:

```bash
# Delete history file
rm ./src/.cds-migration-history.json

# Verify it's gone
ls -la ./src/.cds-migration-history.json
```

This is equivalent to `--clear-history` but skips all checks.

### Best Practices

**✅ Do:**

- Clear history after failed migrations
- Clear during testing/development
- Use `--skip-confirmation` in scripts

**❌ Don't:**

- Clear history just to re-run transforms (use "Re-run" option instead)
- Clear history without good reason in production
- Clear history if team members are mid-migration

## Configuration

### Disable History Tracking

Currently, history tracking is always enabled for non-dry-run migrations. If you need to disable it:

1. Use dry-run mode (doesn't record history)
2. Or delete the history file after each run (not recommended)

### Custom History Location

The history file is always created in the target directory. This ensures:

- Each directory can be migrated independently
- History travels with the code
- No global state to manage
