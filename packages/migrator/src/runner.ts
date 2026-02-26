/**
 * Migration runner
 *
 * Coordinates the execution of version-specific migrations
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  createLogger,
  getSelectedTransforms,
  hasTransformBeenRun,
  loadMigrationConfig,
  recordTransformRun,
} from './utils/index.js';
import type { MigrationSelection } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type RunMigrationOptions = {
  preset: string;
  path: string;
  dryRun: boolean;
  selection?: MigrationSelection;
};

export async function runMigration(options: RunMigrationOptions): Promise<void> {
  const { preset, path: targetPath, dryRun, selection = { all: true } } = options;

  console.log(`\n🔄 Running ${preset} migration...\n`);

  // Create logger for this migration run
  const logger = createLogger(process.cwd());
  logger.info(`Starting ${preset} migration`);
  logger.info(`Target path: ${targetPath}`);
  logger.info(`Mode: ${dryRun ? 'Dry Run' : 'Apply Changes'}`);

  // Load config and get selected transforms
  const presetDir = path.join(__dirname, preset);
  const config = loadMigrationConfig(presetDir);
  const transforms = getSelectedTransforms(config, selection);

  if (transforms.length === 0) {
    console.log('ℹ️  No transforms selected for this migration.');
    logger.warn('No transforms selected');
    return;
  }

  logger.info(`Selected ${transforms.length} transforms to run`);

  // Run each transform using jscodeshift
  let skippedCount = 0;

  for (const transform of transforms) {
    const transformId = `${transform.category}.${transform.variable}.${transform.name}`;

    // Check if this transform has already been run
    if (!dryRun && hasTransformBeenRun(targetPath, transformId)) {
      console.log(`\n  ⊘ Skipping (already run): ${transformId}`);
      logger.info(`Skipped transform (already run): ${transformId}`);
      skippedCount++;
      continue;
    }

    console.log(`\n  → Running transform: ${transformId}`);
    console.log(`    ${transform.description}`);
    logger.info(
      `Running transform: ${transform.name} (${transform.category}.${transform.variable})`,
    );

    // Add .js extension if not present (transforms are compiled from .ts to .js)
    const transformFile = transform.file.endsWith('.js') ? transform.file : `${transform.file}.js`;
    const transformPath = path.join(presetDir, transformFile);
    const extensions = transform.extensions || 'tsx,ts,jsx,js';

    try {
      const jscodeshiftCmd = [
        'npx',
        'jscodeshift',
        dryRun ? '--dry' : '',
        '--parser=tsx',
        `--extensions=${extensions}`,
        '--ignore-pattern="**/node_modules/**"',
        '--ignore-pattern="**/.next/**"',
        '--ignore-pattern="**/dist/**"',
        '--ignore-pattern="**/build/**"',
        `--transform=${transformPath}`,
        targetPath,
      ]
        .filter(Boolean)
        .join(' ');

      console.log(`    Command: ${jscodeshiftCmd}\n`);

      execSync(jscodeshiftCmd, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });

      console.log(`\n  ✓ Transform completed: ${transform.name}`);
      logger.success(`Transform completed: ${transform.name}`);

      // Record this transform run in history (only for non-dry-runs)
      recordTransformRun(targetPath, transformId, preset, dryRun);
    } catch (error) {
      console.error(`\n  ✗ Transform failed: ${transform.name}`);
      logger.error(
        `Transform failed: ${transform.name}`,
        undefined,
        undefined,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  if (skippedCount > 0) {
    console.log(`\n⊘ Skipped ${skippedCount} transform(s) that were already run.\n`);
    logger.info(`Skipped ${skippedCount} transforms that were already run`);
  }

  // Write summary and close logger
  logger.writeSummary();
}
