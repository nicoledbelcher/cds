/**
 * Configuration loader utilities
 */

import fs from 'fs';
import path from 'path';
import type { MigrationConfig, Transform, MigrationSelection } from '../types.js';

/**
 * Load migration configuration from config.json
 */
export function loadMigrationConfig(migrationDir: string): MigrationConfig {
  const configPath = path.join(migrationDir, 'config.json');

  if (!fs.existsSync(configPath)) {
    throw new Error(`Migration config not found: ${configPath}`);
  }

  const configContent = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(configContent) as MigrationConfig;
}

/**
 * Get all transforms from config based on selection
 */
export function getSelectedTransforms(
  config: MigrationConfig,
  selection: MigrationSelection,
): Array<Transform & { category: string; variable: string }> {
  const transforms: Array<Transform & { category: string; variable: string }> = [];

  // If migrate all, collect everything
  if (selection.all) {
    for (const [categoryName, category] of Object.entries(config.categories)) {
      for (const [variableName, variable] of Object.entries(category.variables)) {
        for (const transform of variable.transforms) {
          transforms.push({
            ...transform,
            category: categoryName,
            variable: variableName,
          });
        }
      }
    }
    return transforms;
  }

  // Collect by specific transforms
  if (selection.transforms && selection.transforms.length > 0) {
    for (const transformPath of selection.transforms) {
      const [categoryName, variableName, transformName] = transformPath.split('.');
      const transform = config.categories[categoryName]?.variables[variableName]?.transforms.find(
        (t) => t.name === transformName,
      );
      if (transform) {
        transforms.push({
          ...transform,
          category: categoryName,
          variable: variableName,
        });
      }
    }
    return transforms;
  }

  // Collect by specific items
  if (selection.items && selection.items.length > 0) {
    for (const itemPath of selection.items) {
      const [categoryName, itemName] = itemPath.split('.');
      const item = config.categories[categoryName]?.variables[itemName];
      if (item) {
        for (const transform of item.transforms) {
          transforms.push({
            ...transform,
            category: categoryName,
            variable: itemName,
          });
        }
      }
    }
    return transforms;
  }

  // Collect by specific categories
  if (selection.categories && selection.categories.length > 0) {
    for (const categoryName of selection.categories) {
      const category = config.categories[categoryName];
      if (category) {
        for (const [variableName, variable] of Object.entries(category.variables)) {
          for (const transform of variable.transforms) {
            transforms.push({
              ...transform,
              category: categoryName,
              variable: variableName,
            });
          }
        }
      }
    }
    return transforms;
  }

  return transforms;
}

/**
 * Build a summary of what will be migrated
 */
export function buildMigrationSummary(
  config: MigrationConfig,
  selection: MigrationSelection,
): string {
  const transforms = getSelectedTransforms(config, selection);
  const byCategory: Record<string, Array<{ variable: string; transform: string }>> = {};

  for (const transform of transforms) {
    if (!byCategory[transform.category]) {
      byCategory[transform.category] = [];
    }
    byCategory[transform.category].push({
      variable: transform.variable,
      transform: transform.name,
    });
  }

  let summary = '\nMigration Plan:\n';
  summary += '================\n\n';

  for (const [category, items] of Object.entries(byCategory)) {
    const categoryInfo = config.categories[category];
    summary += `📦 ${category}: ${categoryInfo.description}\n`;

    const byVariable: Record<string, string[]> = {};
    for (const item of items) {
      if (!byVariable[item.variable]) {
        byVariable[item.variable] = [];
      }
      byVariable[item.variable].push(item.transform);
    }

    for (const [variable, transformNames] of Object.entries(byVariable)) {
      const variableInfo = categoryInfo.variables[variable];
      summary += `  └─ ${variable} (${variableInfo.package})\n`;
      for (const transformName of transformNames) {
        const transform = variableInfo.transforms.find((t) => t.name === transformName);
        summary += `     • ${transform?.description || transformName}\n`;
      }
    }
    summary += '\n';
  }

  summary += `Total transforms: ${transforms.length}\n`;

  return summary;
}
