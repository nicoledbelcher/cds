/**
 * Utilities for transforming code to work with react-live's scope system
 */

import type { NormalizedPlaygroundFile } from '../types';
import { getRelativeImports, type ImportStatement } from './importResolver';

/**
 * Creates a scope with exports from all files
 * Following Material-UI's approach: don't combine files, add exports to scope
 * 
 * This extracts all functions, consts, etc. from files and adds them directly to scope
 * so they can be used without imports in the main file.
 */
export function createModuleMap(files: NormalizedPlaygroundFile[]): Record<string, unknown> {
  const scope: Record<string, unknown> = {};

  for (const file of files) {
    // Extract exports from this file
    const fileExports = evaluateFileExports(file.content, file.path);
    
    // Add all function names and consts directly to scope
    // This way the main file can use them without imports
    const functionNames = fileExports.__functionNames as string[] || [];
    
    // Store the cleaned code for this file
    // We'll evaluate it as part of the combined scope
    scope[`__file_${file.path.replace(/[^a-zA-Z0-9]/g, '_')}`] = fileExports.__code;
    
    // Also store function names for reference
    functionNames.forEach((name) => {
      scope[`__${name}_from_${file.path.replace(/[^a-zA-Z0-9]/g, '_')}`] = name;
    });
  }

  return scope;
}

/**
 * Transforms code to replace relative imports with scope access
 * This is a simplified version - in a full implementation, we'd need to:
 * 1. Parse the imported file to extract exports
 * 2. Create proper module exports
 * 3. Replace imports with scope access
 * 
 * For now, we'll use a simpler approach where we:
 * - Remove relative imports (they'll be available in scope)
 * - Keep the rest of the code intact
 */
export function transformCodeForExecution(
  code: string,
  files: NormalizedPlaygroundFile[],
  currentFile: NormalizedPlaygroundFile,
  scope: Record<string, unknown>,
): string {
  // Get all relative imports
  const relativeImports = getRelativeImports(code, files, currentFile.path);
  
  if (relativeImports.length === 0) {
    return code; // No relative imports to transform
  }

  let transformedCode = code;
  let offset = 0;

  // Process imports in reverse order to maintain correct positions
  const sortedImports = [...relativeImports].sort((a, b) => b.import.start - a.import.start);

  for (const { import: importStmt, file: importedFile } of sortedImports) {
    // Create module identifier
    const moduleId = importedFile.path.replace(/^\.\//, '').replace(/\.(ts|tsx|js|jsx)$/, '');
    
    // For now, we'll comment out the import and add a note
    // In a full implementation, we'd replace it with scope access
    const comment = `// Import from ${importedFile.path} - available in scope as ${moduleId}`;
    
    // Replace the import statement with a comment
    const before = transformedCode.substring(0, importStmt.start + offset);
    const after = transformedCode.substring(importStmt.end + offset);
    transformedCode = before + comment + '\n' + after;
    
    // Update offset for next replacement
    offset += comment.length + 1 - importStmt.fullStatement.length;
  }

  return transformedCode;
}

/**
 * Creates a combined scope that includes:
 * - The original scope (ReactLiveScope)
 * - File modules
 */
export function createCombinedScope(
  originalScope: Record<string, unknown>,
  files: NormalizedPlaygroundFile[],
): Record<string, unknown> {
  const moduleMap = createModuleMap(files);
  
  return {
    ...originalScope,
    ...moduleMap,
  };
}

/**
 * Extracts exports from a file's content and evaluates them
 * This creates actual export values that can be added to scope
 */
export function extractExports(code: string): Record<string, unknown> {
  const exports: Record<string, unknown> = {};

  // Extract and evaluate function declarations (exported or not)
  // We'll extract all functions/consts and make them available
  const functionRegex = /(?:export\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{[^}]*\}/gs;
  let match;
  while ((match = functionRegex.exec(code)) !== null) {
    const funcName = match[1];
    try {
      // Try to evaluate the function (this is a simplified approach)
      // In a full implementation, we'd use AST parsing and proper evaluation
      const funcCode = match[0].replace(/^export\s+/, '');
      // For now, we'll store the function code and evaluate it later
      exports[funcName] = funcCode;
    } catch (e) {
      console.warn(`Could not extract function ${funcName}:`, e);
    }
  }

  // Extract const/let declarations
  const constRegex = /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=[^;]+;/g;
  while ((match = constRegex.exec(code)) !== null) {
    const constName = match[1];
    try {
      const constCode = match[0].replace(/^export\s+/, '');
      exports[constName] = constCode;
    } catch (e) {
      console.warn(`Could not extract const ${constName}:`, e);
    }
  }

  return exports;
}

/**
 * Evaluates file content to extract actual export values
 * This is a simplified version - evaluates the file in a safe context
 */
export function evaluateFileExports(
  fileContent: string,
  filePath: string,
): Record<string, unknown> {
  const exports: Record<string, unknown> = {};

  // Remove imports and exports, keep the actual declarations
  let cleaned = fileContent;
  
  // Remove import statements
  cleaned = cleaned.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
  
  // Remove export keywords but keep declarations
  cleaned = cleaned.replace(/^export\s+/gm, '');
  
  // Remove TypeScript type definitions
  cleaned = cleaned.replace(/^type\s+\w+[^=]*=\s*\{[^}]*\};?\s*$/gm, '');
  cleaned = cleaned.replace(/^type\s+\w+\s*=\s*[^;]+;?\s*$/gm, '');

  // Try to extract function names and make them available
  // This is a workaround - we'll add the cleaned code to scope
  // and the functions will be available by name
  const functionNames: string[] = [];
  const functionRegex = /function\s+(\w+)\s*\(/g;
  let match;
  while ((match = functionRegex.exec(cleaned)) !== null) {
    functionNames.push(match[1]);
  }

  // Store the cleaned code - it will be evaluated in the scope
  exports.__code = cleaned;
  exports.__functionNames = functionNames;

  return exports;
}
