/**
 * Migration runner
 *
 * Coordinates the execution of version-specific migrations
 */

import { execSync } from 'child_process';
import path from 'path';

import { createLogger, recordTransformRun } from './utils/index';
import type { Transform } from './types';

// In CommonJS, __dirname is automatically available
declare const __dirname: string;

type RunMigrationOptions = {
  preset?: string; // Optional - not needed for direct transform execution
  path: string;
  dryRun: boolean;
  transformsToRun: Transform[];
};

export async function runMigration(options: RunMigrationOptions): Promise<void> {
  const { preset, path: targetPath, dryRun, transformsToRun } = options;

  console.log(`\n🔄 Running migration...\n`);

  // Create logger for this migration run
  const logger = createLogger(process.cwd());
  logger.info(`Starting migration${preset ? ` (${preset})` : ''}`);
  logger.info(`Target path: ${targetPath}`);
  logger.info(`Mode: ${dryRun ? 'Dry Run' : 'Apply Changes'}`);

  if (transformsToRun.length === 0) {
    console.log('ℹ️  No transforms to run.');
    logger.warn('No transforms to run');
    return;
  }

  logger.info(`Running ${transformsToRun.length} transforms`);

  // Run each transform using jscodeshift
  // CLI has already filtered the list, so just run everything
  for (const transform of transformsToRun) {
    const transformFilePath = transform.file;

    console.log(`\n  → Running transform: ${transform.name}`);
    console.log(`    ${transform.description}`);
    logger.info(`Running transform: ${transform.name}`);

    // Add .js extension if not present (transforms are compiled from .ts to .js)
    const transformFile = transformFilePath.endsWith('.js')
      ? transformFilePath
      : `${transformFilePath}.js`;
    // Transforms are in src/transforms/, built to esm/transforms/
    const transformsDir = path.join(__dirname, 'transforms');
    const fullTransformPath = path.join(transformsDir, transformFile);
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
        `--transform=${fullTransformPath}`,
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

      // Record this transform run in history (file path is the ID)
      recordTransformRun(targetPath, transformFilePath, dryRun);
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

  // Write summary and close logger
  logger.writeSummary();
}
