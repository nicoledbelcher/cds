/**
 * Types for Playground multiple files support
 */

export type PlaygroundFile = {
  /** File path (e.g., "main.tsx", "./utils.ts", "./data.ts") */
  path: string;
  /** File content */
  content: string;
};

/**
 * Files can be provided as:
 * - Record<string, string> - Simple object mapping paths to content
 * - PlaygroundFile[] - Array of file objects with metadata
 */
export type PlaygroundFiles = Record<string, string> | PlaygroundFile[];

/**
 * Normalized file structure used internally
 */
export type NormalizedPlaygroundFile = {
  path: string;
  content: string;
  editable: boolean;
  /** Display name for the file (e.g., "main.tsx" or "./utils.ts") */
  displayName: string;
  /** Index in the files array */
  index: number;
};

/**
 * Normalizes files input into a consistent format
 * Ensures the main file (with render() call) is first
 */
export function normalizeFiles(files: PlaygroundFiles | undefined): NormalizedPlaygroundFile[] {
  if (!files) {
    return [];
  }

  let entries: Array<[string, string]>;

  // Handle Record<string, string>
  if (!Array.isArray(files)) {
    entries = Object.entries(files);
  } else {
    // Handle PlaygroundFile[]
    entries = files.map((file) => [file.path, file.content]);
  }

  // Find the main file (contains render() call) and put it first
  const mainFileIndex = entries.findIndex(([, content]) => content.includes('render('));
  let normalized: NormalizedPlaygroundFile[];

  if (mainFileIndex > 0) {
    // Move main file to first position
    const mainFile = entries[mainFileIndex];
    const otherFiles = entries.filter((_, index) => index !== mainFileIndex);
    entries = [mainFile, ...otherFiles];
  }

  normalized = entries.map(([path, content], index) => ({
    path,
    content,
    editable: true, // All files are editable
    displayName: path,
    index,
  }));

  return normalized;
}

/**
 * Gets the main file from normalized files (first file)
 */
export function getMainFile(files: NormalizedPlaygroundFile[]): NormalizedPlaygroundFile | null {
  return files[0] ?? null;
}
