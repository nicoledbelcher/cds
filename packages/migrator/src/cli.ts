#!/usr/bin/env node

/**
 * CDS Migrator CLI
 *
 * Interactive tool to migrate codebases between CDS major versions
 * Also supports non-interactive mode via CLI flags
 */

import inquirer from 'inquirer';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  buildMigrationSummary,
  getSelectedTransforms,
  loadMigrationConfig,
} from './utils/config-loader.js';
import {
  buildHistorySummary,
  clearMigrationHistory,
  getAlreadyRunTransforms,
  loadMigrationHistory,
} from './utils/migration-history.js';
import { buildSelectionFromArgs, type CliArgs, hasRequiredArgs, parseCliArgs } from './cli-args.js';
import { runMigration } from './runner.js';
import type { MigrationSelection } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AVAILABLE_PRESETS = [
  {
    name: 'v8 to v9',
    value: 'v8-to-v9',
    description: 'Migrate from CDS v8 to v9',
  },
] as const;

async function selectMigrationScope(presetDir: string): Promise<MigrationSelection> {
  const config = loadMigrationConfig(presetDir);

  // Step 1: Select category
  const categoryChoices = [
    {
      name: '🔘 All categories',
      value: '__ALL__',
    },
    ...Object.entries(config.categories).map(([name, cat]) => ({
      name: `${name} - ${cat.description}`,
      value: name,
    })),
  ];

  const { selectedCategory } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedCategory',
      message: 'Which category of transforms do you want to run?',
      choices: categoryChoices,
    },
  ]);

  // If "All categories" is selected, migrate everything
  if (selectedCategory === '__ALL__') {
    return { all: true };
  }

  // Step 2: Select transform in the selected category
  const category = config.categories[selectedCategory];
  if (!category) {
    return { all: true };
  }

  // Build list of all transforms in this category
  const transformChoices = [
    {
      name: `🔘 All transforms in ${selectedCategory}`,
      value: '__ALL__',
    },
  ];

  for (const [itemName, item] of Object.entries(category.variables)) {
    for (const transform of item.transforms) {
      transformChoices.push({
        name: `${itemName}.${transform.name} - ${transform.description}`,
        value: `${selectedCategory}.${itemName}.${transform.name}`,
      });
    }
  }

  const { selectedTransform } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedTransform',
      message: `Which transform in "${selectedCategory}" category?`,
      choices: transformChoices,
    },
  ]);

  // If "All transforms" selected, run all in this category
  if (selectedTransform === '__ALL__') {
    return { categories: [selectedCategory] };
  }

  // Return the specific transform
  return { transforms: [selectedTransform] };
}

async function runInteractiveMode() {
  // Step 1: Select migration preset
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'preset',
      message: 'Which migration preset do you need?',
      choices: AVAILABLE_PRESETS.map((m) => ({
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
  const presetDir = path.join(__dirname, answers.preset);
  const selection = await selectMigrationScope(presetDir);

  // Step 5: Show what will be migrated
  const config = loadMigrationConfig(presetDir);
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

  // Check for migration history and warn about duplicate runs (skip if dry-run)
  const selectedTransforms = getSelectedTransforms(config, selection);
  const transformIds = selectedTransforms.map((t) => `${t.category}.${t.variable}.${t.name}`);
  const alreadyRun = getAlreadyRunTransforms(targetPath, transformIds);

  // Only warn about duplicates if NOT in dry-run mode
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
  console.log(`  Preset: ${answers.preset}`);
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
    preset: answers.preset,
    path: targetPath,
    dryRun: modeAnswer.dryRun,
    selection,
  };
}

async function runNonInteractiveMode(args: CliArgs) {
  const preset = args.preset!;
  const targetPath = args.path!;
  const dryRun = args.dryRun || false;
  const selection = buildSelectionFromArgs(args);

  if (!selection) {
    console.error('Error: Must specify --all, --category, --item, or --transform');
    process.exit(1);
  }

  // Validate preset
  const isValidPreset = AVAILABLE_PRESETS.some((p) => p.value === preset);
  if (!isValidPreset) {
    console.error(`Error: Invalid preset '${preset}'`);
    console.error(`Available presets: ${AVAILABLE_PRESETS.map((p) => p.value).join(', ')}`);
    process.exit(1);
  }

  // Load config
  const presetDir = path.join(__dirname, preset);
  const config = loadMigrationConfig(presetDir);

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
  console.log(`  Preset: ${preset}`);
  console.log(`  Path: ${targetPath}`);
  console.log(`  Mode: ${dryRun ? 'Dry Run' : 'Apply Changes'}`);
  console.log(`  Transforms: ${selectedTransforms.length}\n`);

  return {
    preset: preset,
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
