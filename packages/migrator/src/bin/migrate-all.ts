#!/usr/bin/env node

/**
 * cds-migrate:all
 * Quick command to migrate everything with a preset
 */

import { Command } from 'commander';

import { runMigration } from '../runner.js';

const program = new Command();

program
  .name('cds-migrate:all')
  .description('Migrate everything with CDS migration preset')
  .requiredOption('-p, --preset <name>', 'Migration preset (e.g., v8-to-v9)')
  .option('--path <path>', 'Target path to migrate', './src')
  .option('-d, --dry-run', 'Run in dry-run mode', false)
  .parse();

const options = program.opts();

async function main() {
  console.log('\n🚀 CDS Migrator - Migrate All\n');
  console.log(`Preset: ${options.preset}`);
  console.log(`Path: ${options.path}`);
  console.log(`Mode: ${options.dryRun ? 'Dry Run' : 'Apply Changes'}\n`);

  await runMigration({
    preset: options.preset,
    path: options.path,
    dryRun: options.dryRun,
    selection: { all: true },
  });

  console.log('\n✅ Migration completed!\n');
}

main().catch((error) => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});
