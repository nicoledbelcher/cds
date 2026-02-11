/**
 * CLI argument parsing
 */

import { Command } from 'commander';
import type { MigrationSelection } from './types.js';

export interface CliArgs {
  version?: string;
  path?: string;
  dryRun?: boolean;
  skipConfirmation?: boolean;
  clearHistory?: boolean;
  all?: boolean;
  category?: string[];
  item?: string[];
  transform?: string[];
}

export function parseCliArgs(): CliArgs {
  const program = new Command();

  program
    .name('cds-migrate')
    .description('CDS code migration tool')
    .version('1.0.0')
    .option('-m, --migration <version>', 'Migration version (e.g., v8-to-v9)')
    .option('-p, --path <path>', 'Target path to migrate', './src')
    .option('-d, --dry-run', 'Run in dry-run mode (preview changes)', false)
    .option('--skip-confirmation', 'Skip confirmation prompts', false)
    .option('--clear-history', 'Clear migration history for the specified path', false)
    .option('--all', 'Migrate everything')
    .option('--category <categories...>', 'Migrate specific categories')
    .option('--item <items...>', 'Migrate specific items (components/hooks/utilities)')
    .option('--transform <transforms...>', 'Migrate specific transforms');

  program.parse();

  const options = program.opts();

  return {
    version: options.migration,
    path: options.path,
    dryRun: options.dryRun,
    skipConfirmation: options.skipConfirmation,
    clearHistory: options.clearHistory,
    all: options.all,
    category: options.category,
    item: options.item,
    transform: options.transform,
  };
}

export function buildSelectionFromArgs(args: CliArgs): MigrationSelection | null {
  if (args.all) {
    return { all: true };
  }

  if (args.transform && args.transform.length > 0) {
    return { transforms: args.transform };
  }

  if (args.item && args.item.length > 0) {
    return { items: args.item };
  }

  if (args.category && args.category.length > 0) {
    return { categories: args.category };
  }

  return null;
}

export function hasRequiredArgs(args: CliArgs): boolean {
  // Version and path are required for non-interactive mode
  // Plus at least one selection method
  return !!(
    args.version &&
    args.path &&
    (args.all || args.category || args.item || args.transform)
  );
}
