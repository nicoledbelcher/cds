#!/usr/bin/env node

/**
 * cds-migrate:clear-history
 * Quick command to clear migration history
 */

import { Command } from 'commander';
import inquirer from 'inquirer';

import { clearMigrationHistory, loadMigrationHistory } from '../utils/index.js';

const program = new Command();

program
  .name('cds-migrate:clear-history')
  .description('Clear CDS migration history')
  .option('--path <path>', 'Target path', './src')
  .option('--skip-confirmation', 'Skip confirmation prompt', false)
  .parse();

const options = program.opts();

async function main() {
  const history = loadMigrationHistory(options.path);

  if (!history) {
    console.log(`No migration history found at: ${options.path}`);
    return;
  }

  if (!options.skipConfirmation) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `⚠️  Clear migration history for ${options.path}?`,
        default: false,
      },
    ]);

    if (!confirm) {
      console.log('❌ Cancelled.\n');
      return;
    }
  }

  clearMigrationHistory(options.path);
  console.log(`✅ Migration history cleared for: ${options.path}\n`);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
