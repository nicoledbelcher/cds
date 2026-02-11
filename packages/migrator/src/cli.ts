#!/usr/bin/env node

/**
 * CDS Migrator CLI
 *
 * Interactive tool to migrate codebases between CDS major versions
 * Also supports non-interactive mode via CLI flags
 */

import inquirer from 'inquirer';
import { runMigration } from './runner.js';
import {
  loadMigrationConfig,
  buildMigrationSummary,
  getSelectedTransforms,
} from './utils/config-loader.js';
import {
  loadMigrationHistory,
  getAlreadyRunTransforms,
  buildHistorySummary,
  clearMigrationHistory,
} from './utils/migration-history.js';
import path from 'path';
import { fileURLToPath } from 'url';
import type { MigrationSelection } from './types.js';
import { parseCliArgs, buildSelectionFromArgs, hasRequiredArgs, type CliArgs } from './cli-args.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPPORTED_MIGRATIONS = [
  {
    name: 'v8 to v9',
    value: 'v8-to-v9',
    description: 'Migrate from CDS v8 to v9',
  },
] as const;

async function selectMigrationScope(migrationDir: string): Promise<MigrationSelection> {
  const config = loadMigrationConfig(migrationDir);

  const { scope } = await inquirer.prompt([
    {
      type: 'list',
      name: 'scope',
      message: 'What would you like to migrate?',
      choices: [
        { name: 'Everything (all changes)', value: 'all' },
        { name: 'By category (components, hooks, etc.)', value: 'category' },
        { name: 'By item (specific component/hook/utility)', value: 'item' },
        { name: 'By specific transform', value: 'transform' },
      ],
    },
  ]);

  if (scope === 'all') {
    return { all: true };
  }

  if (scope === 'category') {
    const categoryChoices = [
      {
        name: '🔘 All categories',
        value: '__ALL__',
        checked: false,
      },
      ...Object.entries(config.categories).map(([name, cat]) => ({
        name: `${name} - ${cat.description}`,
        value: name,
        checked: false,
      })),
    ];

    const { categories } = (await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'categories',
        message: 'Select categories to migrate:',
        choices: categoryChoices,
        validate: (input: string[]) => {
          if (input.length === 0) {
            return 'Please select at least one category';
          }
          return true;
        },
      },
    ] as any)) as { categories: string[] };

    // If "All" is selected, return all categories
    if (categories.includes('__ALL__')) {
      return { all: true };
    }

    return { categories };
  }

  if (scope === 'item') {
    // Build list of all items across categories
    const itemChoices: Array<{ name: string; value: string; checked?: boolean }> = [
      {
        name: '🔘 All items',
        value: '__ALL__',
        checked: false,
      },
    ];

    for (const [categoryName, category] of Object.entries(config.categories)) {
      for (const [itemName, item] of Object.entries(category.variables)) {
        itemChoices.push({
          name: `${categoryName}.${itemName} - ${item.description} (${item.package})`,
          value: `${categoryName}.${itemName}`,
        });
      }
    }

    const { items } = (await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'items',
        message: 'Select items to migrate:',
        choices: itemChoices,
        validate: (input: string[]) => {
          if (input.length === 0) {
            return 'Please select at least one item';
          }
          return true;
        },
      },
    ] as any)) as { items: string[] };

    // If "All" is selected, return all items
    if (items.includes('__ALL__')) {
      return { all: true };
    }

    return { items };
  }

  if (scope === 'transform') {
    // Build list of all transforms
    const transformChoices: Array<{ name: string; value: string; checked?: boolean }> = [
      {
        name: '🔘 All transforms',
        value: '__ALL__',
        checked: false,
      },
    ];

    for (const [categoryName, category] of Object.entries(config.categories)) {
      for (const [variableName, variable] of Object.entries(category.variables)) {
        for (const transform of variable.transforms) {
          transformChoices.push({
            name: `${categoryName}.${variableName}.${transform.name} - ${transform.description}`,
            value: `${categoryName}.${variableName}.${transform.name}`,
          });
        }
      }
    }

    const { transforms } = (await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'transforms',
        message: 'Select transforms to run:',
        choices: transformChoices,
        validate: (input: string[]) => {
          if (input.length === 0) {
            return 'Please select at least one transform';
          }
          return true;
        },
      },
    ] as any)) as { transforms: string[] };

    // If "All" is selected, return all transforms
    if (transforms.includes('__ALL__')) {
      return { all: true };
    }

    return { transforms };
  }

  return { all: true };
}

async function runInteractiveMode() {
  // Step 1: Select migration version
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'migration',
      message: 'Which major version migration do you need?',
      choices: SUPPORTED_MIGRATIONS.map((m) => ({
        name: `${m.name} - ${m.description}`,
        value: m.value,
      })),
    },
  ]);

  // Step 2: Ask for target path
  const pathAnswer = await inquirer.prompt([
    {
      type: 'input',
      name: 'path',
      message: 'Enter the path to your codebase (relative or absolute):',
      default: './src',
      validate: (input: string) => {
        if (!input || input.trim() === '') {
          return 'Please provide a valid path';
        }
        return true;
      },
    },
  ]);

  const targetPath = pathAnswer.path;

  // Step 3: Check and display migration history
  const history = loadMigrationHistory(targetPath);
  if (history && history.entries.length > 0) {
    const historySummary = buildHistorySummary(targetPath);
    console.log(historySummary);
  }

  // Step 4: Load config and let user select scope
  const migrationDir = path.join(__dirname, answers.migration);
  const selection = await selectMigrationScope(migrationDir);

  // Step 5: Show what will be migrated
  const config = loadMigrationConfig(migrationDir);
  const summary = buildMigrationSummary(config, selection);
  console.log(summary);

  // Step 6: Ask for dry-run mode
  const modeAnswer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'dryRun',
      message: 'Run in dry-run mode? (preview changes without modifying files)',
      default: true,
    },
  ]);

  // Check for migration history and warn about duplicate runs
  const selectedTransforms = getSelectedTransforms(config, selection);
  const transformIds = selectedTransforms.map((t) => `${t.category}.${t.variable}.${t.name}`);
  const alreadyRun = getAlreadyRunTransforms(targetPath, transformIds);

  if (alreadyRun.length > 0 && !modeAnswer.dryRun) {
    console.log('\n⚠️  Warning: Some transforms have already been run on this path:\n');
    for (const transformId of alreadyRun) {
      console.log(`  • ${transformId}`);
    }
    console.log('');

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'How would you like to proceed?',
        choices: [
          {
            name: 'Skip already-run transforms (recommended)',
            value: 'skip',
          },
          {
            name: 'Re-run all transforms (may cause issues)',
            value: 'rerun',
          },
          {
            name: 'Cancel migration',
            value: 'cancel',
          },
        ],
        default: 'skip',
      },
    ]);

    if (action === 'cancel') {
      console.log('\n❌ Migration cancelled.\n');
      return;
    }

    if (action === 'skip') {
      // Filter out already-run transforms
      if (selection.transforms) {
        selection.transforms = selection.transforms.filter((t) => !alreadyRun.includes(t));
      } else if (selection.items) {
        // For item selection, we need to filter at the item level
        // This is complex, so we'll just warn the user
        console.log('\n⚠️  Note: Skipping at the item level may leave some transforms incomplete.');
        console.log('Consider using transform-level selection for more control.\n');
      }
      // For category or all selection, we can't easily filter, so just warn
      if (selection.all || selection.categories) {
        console.log(
          '\n⚠️  Note: Cannot skip at category level. Some transforms may be skipped during execution.\n',
        );
      }
    }
  }

  console.log('\n📋 Migration Summary:');
  console.log(`  Version: ${answers.migration}`);
  console.log(`  Path: ${targetPath}`);
  console.log(`  Mode: ${modeAnswer.dryRun ? 'Dry Run' : 'Apply Changes'}\n`);

  if (!modeAnswer.dryRun) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '⚠️  This will modify your files. Continue?',
        default: false,
      },
    ]);

    if (!confirm) {
      console.log('\n❌ Migration cancelled.\n');
      return;
    }
  }

  return {
    migration: answers.migration,
    path: targetPath,
    dryRun: modeAnswer.dryRun,
    selection,
  };
}

async function runNonInteractiveMode(args: CliArgs) {
  const migration = args.version!;
  const targetPath = args.path!;
  const dryRun = args.dryRun || false;
  const selection = buildSelectionFromArgs(args);

  if (!selection) {
    console.error('Error: Must specify --all, --category, --item, or --transform');
    process.exit(1);
  }

  // Validate migration version
  const isValidMigration = SUPPORTED_MIGRATIONS.some((m) => m.value === migration);
  if (!isValidMigration) {
    console.error(`Error: Invalid migration version '${migration}'`);
    console.error(`Available versions: ${SUPPORTED_MIGRATIONS.map((m) => m.value).join(', ')}`);
    process.exit(1);
  }

  // Load config
  const migrationDir = path.join(__dirname, migration);
  const config = loadMigrationConfig(migrationDir);

  // Show migration plan
  const summary = buildMigrationSummary(config, selection);
  console.log(summary);

  // Check for duplicates
  const selectedTransforms = getSelectedTransforms(config, selection);
  const transformIds = selectedTransforms.map((t) => `${t.category}.${t.variable}.${t.name}`);
  const alreadyRun = getAlreadyRunTransforms(targetPath, transformIds);

  if (alreadyRun.length > 0 && !dryRun && !args.skipConfirmation) {
    console.log('\n⚠️  Warning: Some transforms have already been run on this path:\n');
    for (const transformId of alreadyRun) {
      console.log(`  • ${transformId}`);
    }
    console.log('\nUse --skip-confirmation to bypass this check or run with --dry-run first.\n');
    process.exit(1);
  }

  console.log('\n📋 Migration Summary:');
  console.log(`  Version: ${migration}`);
  console.log(`  Path: ${targetPath}`);
  console.log(`  Mode: ${dryRun ? 'Dry Run' : 'Apply Changes'}`);
  console.log(`  Transforms: ${selectedTransforms.length}\n`);

  return {
    migration,
    path: targetPath,
    dryRun,
    selection,
  };
}

async function main() {
  console.log('\n🚀 CDS Migrator\n');

  // Parse CLI arguments
  const args = parseCliArgs();

  // Handle clear-history command
  if (args.clearHistory) {
    if (!args.path) {
      console.error('Error: --path is required when using --clear-history');
      process.exit(1);
    }

    const history = loadMigrationHistory(args.path);
    if (!history) {
      console.log(`No migration history found at: ${args.path}`);
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `⚠️  Clear migration history for ${args.path}?`,
        default: false,
      },
    ]);

    if (confirm) {
      clearMigrationHistory(args.path);
      console.log(`✅ Migration history cleared for: ${args.path}\n`);
    } else {
      console.log('❌ Cancelled.\n');
    }
    return;
  }

  // Determine if running in interactive or non-interactive mode
  const isNonInteractive = hasRequiredArgs(args);

  let migrationOptions;

  if (isNonInteractive) {
    // Non-interactive mode with CLI flags
    migrationOptions = await runNonInteractiveMode(args);
  } else {
    // Interactive mode with prompts
    console.log('This tool will help you migrate your codebase between CDS major versions.\n');
    migrationOptions = await runInteractiveMode();
  }

  if (!migrationOptions) {
    console.error('\n❌ Migration setup failed.\n');
    process.exit(1);
  }

  try {
    await runMigration(migrationOptions);
    console.log('\n✅ Migration completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
