/**
 * Utilities for resolving imports in playground code
 */

import type { NormalizedPlaygroundFile } from '../types';

export type ImportStatement = {
  /** The import path (e.g., "./utils", "../data") */
  path: string;
  /** The full import statement text */
  fullStatement: string;
  /** Start position in code */
  start: number;
  /** End position in code */
  end: number;
  /** Whether it's a relative import */
  isRelative: boolean;
  /** Default import name (if any) */
  defaultImport?: string;
  /** Named imports (if any) */
  namedImports?: string[];
  /** Namespace import (if any) */
  namespaceImport?: string;
};

/**
 * Parses import statements from code
 * Supports:
 * - import Default from './path'
 * - import { Named } from './path'
 * - import * as Namespace from './path'
 * - import Default, { Named } from './path'
 * - import './path' (side-effect imports)
 */
export function parseImports(code: string): ImportStatement[] {
  const imports: ImportStatement[] = [];
  
  // Match import statements
  // This regex handles:
  // - import Default from 'path'
  // - import { Named } from 'path'
  // - import * as Namespace from 'path'
  // - import Default, { Named } from 'path'
  // - import 'path' (side-effect)
  // Structure: import [imports] from 'path' or import 'path'
  const importRegex =
    /import\s+(?:(?:\*\s+as\s+(\w+)|(\w+)|(\{[^}]*\})|(\w+)\s*,\s*(\{[^}]*\}))\s+from\s+)?['"]([^'"]+)['"]/g;

  let match;
  while ((match = importRegex.exec(code)) !== null) {
    const fullStatement = match[0];
    const namespaceImport = match[1];
    const defaultImport = match[2] || match[4];
    const namedImportsStr = match[3] || match[5];
    const importPath = match[6];

    // Parse named imports
    let namedImports: string[] | undefined;
    if (namedImportsStr) {
      namedImports = namedImportsStr
        .replace(/[{}]/g, '')
        .split(',')
        .map((imp) => {
          // Handle "name as alias"
          const parts = imp.trim().split(/\s+as\s+/);
          return parts[parts.length - 1].trim();
        })
        .filter(Boolean);
    }

    const isRelative = importPath.startsWith('./') || importPath.startsWith('../');

    imports.push({
      path: importPath,
      fullStatement,
      start: match.index,
      end: match.index + fullStatement.length,
      isRelative,
      defaultImport,
      namedImports,
      namespaceImport,
    });
  }

  return imports;
}

/**
 * Resolves a relative import path to a file path
 * @param importPath - The import path (e.g., "./utils", "../data")
 * @param currentFile - The current file path (e.g., "main.tsx")
 * @returns The resolved file path or null if not found
 */
export function resolveRelativeImport(
  importPath: string,
  currentFile: string,
): string | null {
  if (!importPath.startsWith('./') && !importPath.startsWith('../')) {
    return null; // Not a relative import
  }

  // Remove file extension from current file for resolution
  const currentDir = currentFile.includes('/')
    ? currentFile.substring(0, currentFile.lastIndexOf('/'))
    : '';

  // Simple path resolution
  const parts = importPath.split('/');
  const resolvedParts: string[] = [];

  if (currentDir) {
    resolvedParts.push(...currentDir.split('/'));
  }

  for (const part of parts) {
    if (part === '.') {
      // Current directory - do nothing
      continue;
    } else if (part === '..') {
      // Parent directory
      resolvedParts.pop();
    } else {
      // Regular path segment
      resolvedParts.push(part);
    }
  }

  return resolvedParts.join('/');
}

/**
 * Finds a file in the files array that matches the import path
 * Tries multiple variations (with/without extensions, with/without leading ./)
 */
export function findFileByImportPath(
  importPath: string,
  files: NormalizedPlaygroundFile[],
  currentFile: string,
): NormalizedPlaygroundFile | null {
  // Try exact match first
  let found = files.find((file) => file.path === importPath);
  if (found) return found;

  // Try resolving relative path
  const resolvedPath = resolveRelativeImport(importPath, currentFile);
  if (resolvedPath) {
    found = files.find((file) => file.path === resolvedPath);
    if (found) return found;
  }

  // Try with common extensions
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  for (const ext of extensions) {
    const pathWithExt = importPath + ext;
    found = files.find((file) => file.path === pathWithExt);
    if (found) return found;

    if (resolvedPath) {
      const resolvedWithExt = resolvedPath + ext;
      found = files.find((file) => file.path === resolvedWithExt);
      if (found) return found;
    }
  }

  // Try without leading ./
  if (importPath.startsWith('./')) {
    const withoutDot = importPath.substring(2);
    found = files.find((file) => file.path === withoutDot || file.path.endsWith('/' + withoutDot));
    if (found) return found;
  }

  return null;
}

/**
 * Gets all relative imports from a file
 */
export function getRelativeImports(
  code: string,
  files: NormalizedPlaygroundFile[],
  currentFile: string,
): Array<{ import: ImportStatement; file: NormalizedPlaygroundFile }> {
  const imports = parseImports(code);
  const relativeImports: Array<{ import: ImportStatement; file: NormalizedPlaygroundFile }> = [];

  for (const importStmt of imports) {
    if (!importStmt.isRelative) continue;

    const file = findFileByImportPath(importStmt.path, files, currentFile);
    if (file) {
      relativeImports.push({ import: importStmt, file });
    }
  }

  return relativeImports;
}
