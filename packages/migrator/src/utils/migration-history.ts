/**
 * Migration history tracking
 *
 * Keeps track of which transforms have been run on a given path
 */

import fs from 'fs';
import path from 'path';
import type { Transform } from '../types.js';

const HISTORY_FILE_NAME = '.cds-migration-history.json';

export interface MigrationHistoryEntry {
  /**
   * Transform identifier (e.g., "components.Button.button-variant-to-appearance")
   */
  transformId: string;
  /**
   * When the transform was run
   */
  timestamp: string;
  /**
   * Version migration (e.g., "v8-to-v9")
   */
  version: string;
  /**
   * Whether it was a dry run
   */
  dryRun: boolean;
}

export interface MigrationHistory {
  /**
   * Target path that was migrated
   */
  targetPath: string;
  /**
   * List of all transform runs
   */
  entries: MigrationHistoryEntry[];
  /**
   * Last update timestamp
   */
  lastUpdated: string;
}

/**
 * Get the history file path for a target directory
 */
function getHistoryFilePath(targetPath: string): string {
  // If targetPath is a file, use its directory
  const stats = fs.existsSync(targetPath) ? fs.statSync(targetPath) : null;
  const dir = stats?.isDirectory() ? targetPath : path.dirname(targetPath);

  return path.join(dir, HISTORY_FILE_NAME);
}

/**
 * Load migration history for a target path
 */
export function loadMigrationHistory(targetPath: string): MigrationHistory | null {
  const historyPath = getHistoryFilePath(targetPath);

  if (!fs.existsSync(historyPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(historyPath, 'utf-8');
    return JSON.parse(content) as MigrationHistory;
  } catch (error) {
    console.warn(`Warning: Could not load migration history from ${historyPath}`);
    return null;
  }
}

/**
 * Save migration history for a target path
 */
export function saveMigrationHistory(targetPath: string, history: MigrationHistory): void {
  const historyPath = getHistoryFilePath(targetPath);

  try {
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf-8');
  } catch (error) {
    console.warn(`Warning: Could not save migration history to ${historyPath}`);
  }
}

/**
 * Record a transform run in the history
 */
export function recordTransformRun(
  targetPath: string,
  transformId: string,
  version: string,
  dryRun: boolean,
): void {
  let history = loadMigrationHistory(targetPath);

  if (!history) {
    history = {
      targetPath,
      entries: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  // Add new entry
  history.entries.push({
    transformId,
    timestamp: new Date().toISOString(),
    version,
    dryRun,
  });

  history.lastUpdated = new Date().toISOString();

  // Don't save history for dry runs (they don't modify files)
  if (!dryRun) {
    saveMigrationHistory(targetPath, history);
  }
}

/**
 * Check if a transform has already been run (non-dry-run)
 */
export function hasTransformBeenRun(targetPath: string, transformId: string): boolean {
  const history = loadMigrationHistory(targetPath);

  if (!history) {
    return false;
  }

  // Check if this transform was run in a non-dry-run mode
  return history.entries.some((entry) => entry.transformId === transformId && !entry.dryRun);
}

/**
 * Get list of transforms that have already been run
 */
export function getAlreadyRunTransforms(targetPath: string, transformIds: string[]): string[] {
  const history = loadMigrationHistory(targetPath);

  if (!history) {
    return [];
  }

  const runTransformIds = new Set(
    history.entries.filter((entry) => !entry.dryRun).map((entry) => entry.transformId),
  );

  return transformIds.filter((id) => runTransformIds.has(id));
}

/**
 * Build a summary of migration history
 */
export function buildHistorySummary(targetPath: string): string {
  const history = loadMigrationHistory(targetPath);

  if (!history || history.entries.length === 0) {
    return 'No migration history found for this path.';
  }

  // Group entries by version
  const byVersion: Record<string, MigrationHistoryEntry[]> = {};
  for (const entry of history.entries) {
    if (!entry.dryRun) {
      // Only show non-dry-run entries
      if (!byVersion[entry.version]) {
        byVersion[entry.version] = [];
      }
      byVersion[entry.version].push(entry);
    }
  }

  let summary = '\n📜 Migration History\n';
  summary += '==================\n\n';

  for (const [version, entries] of Object.entries(byVersion)) {
    summary += `${version}:\n`;
    for (const entry of entries) {
      const date = new Date(entry.timestamp).toLocaleDateString();
      summary += `  • ${entry.transformId} (${date})\n`;
    }
    summary += '\n';
  }

  summary += `Last updated: ${new Date(history.lastUpdated).toLocaleString()}\n`;

  return summary;
}

/**
 * Clear migration history for a target path
 */
export function clearMigrationHistory(targetPath: string): void {
  const historyPath = getHistoryFilePath(targetPath);

  if (fs.existsSync(historyPath)) {
    fs.unlinkSync(historyPath);
  }
}
