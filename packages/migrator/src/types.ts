/**
 * Types for CDS migration tools
 */

export interface MigrationOptions {
  /**
   * Paths to files or directories to migrate
   */
  paths: string[];
  /**
   * Whether to perform a dry run without modifying files
   */
  dryRun?: boolean;
}

export interface Transform {
  /**
   * Name of the transform
   */
  name: string;
  /**
   * Description of what the transform does
   */
  description: string;
  /**
   * Path to the transform file (relative to migration directory)
   */
  file: string;
  /**
   * File extensions to process (comma-separated)
   * @default "tsx,ts,jsx,js"
   */
  extensions?: string;
}

export interface MigrationModule {
  /**
   * List of transforms to run for this migration
   */
  transforms: Transform[];
  /**
   * Description of the migration and breaking changes
   */
  description: string;
}

/**
 * Configuration for a migration variable (component, hook, utility, etc.)
 */
export interface MigrationVariable {
  /**
   * Human-readable description of the changes
   */
  description: string;
  /**
   * Package name where this variable is exported from
   */
  package: string;
  /**
   * List of transforms to apply for this variable
   */
  transforms: Transform[];
}

/**
 * Configuration for a migration category
 */
export interface MigrationCategory {
  /**
   * Human-readable description of the category
   */
  description: string;
  /**
   * Variables (components, hooks, utilities, etc.) in this category
   */
  variables: Record<string, MigrationVariable>;
}

/**
 * Main migration configuration structure
 */
export interface MigrationConfig {
  /**
   * Version identifier (e.g., "v8-to-v9")
   */
  version: string;
  /**
   * Overall description of the migration
   */
  description: string;
  /**
   * Categories of changes organized by type
   */
  categories: Record<string, MigrationCategory>;
}

/**
 * Selection for what to migrate
 */
export interface MigrationSelection {
  /**
   * If true, migrate everything
   */
  all?: boolean;
  /**
   * Specific categories to migrate
   */
  categories?: string[];
  /**
   * Specific items to migrate (format: "category.item")
   * Items are components, hooks, utilities, etc.
   */
  items?: string[];
  /**
   * Specific transforms to migrate (format: "category.item.transform")
   */
  transforms?: string[];
}
