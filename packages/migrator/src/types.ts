/**
 * Types for CDS migration tools
 */

export type Transform = {
  /**
   * Name of the transform
   */
  name: string;
  /**
   * Description of what the transform does
   */
  description: string;
  /**
   * Path to the transform file (relative to transforms directory)
   */
  file: string;
  /**
   * File extensions to process (comma-separated)
   * @default "tsx,ts,jsx,js"
   */
  extensions?: string;
};

/**
 * Preset manifest structure
 */
export type PresetManifest = {
  /**
   * Preset identifier (e.g., "v8-to-v9")
   */
  preset: string;
  /**
   * Overall description of the migration
   */
  description: string;
  /**
   * List of transforms in this preset
   */
  transforms: Transform[];
};

/**
 * Selection for what to migrate
 */
export type MigrationSelection = {
  /**
   * If true, migrate everything
   */
  all?: boolean;
  /**
   * Specific transforms to migrate (by name)
   */
  transforms?: string[];
};
