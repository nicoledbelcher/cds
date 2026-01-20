/**
 * Utilities for creating react-runner scope with file modules
 * Following Material-UI's approach: scope-based import resolution
 */

import { importCode } from 'react-runner';
import React, { useState, useEffect, useCallback, useMemo, useRef, useContext, useReducer } from 'react';
import * as ReactModule from 'react';
import type { NormalizedPlaygroundFile } from '../types';

/**
 * Creates a react-runner scope with file modules in scope.import
 * This allows the main file to import from other files using relative imports
 */
export function createReactRunnerScope(
  baseScope: Record<string, unknown>,
  files: NormalizedPlaygroundFile[],
): {
  [key: string]: unknown;
  import: {
    [modulePath: string]: unknown;
  };
} {
  const importMap: Record<string, unknown> = {};

  // Create package imports FIRST - these need to be available when evaluating files
  // This allows react-runner to resolve imports like 'react', '@coinbase/cds-web/layout', etc.
  // react-runner expects scope.import['module-name'] to be the actual module object
  const packageImports: Record<string, unknown> = {
    // React - use the namespace import so all exports are available
    'react': ReactModule,
    
    // CDS Web packages - extract from baseScope
    '@coinbase/cds-web/layout': {
      Box: baseScope.Box,
      Divider: baseScope.Divider,
      Fallback: baseScope.Fallback,
      Grid: baseScope.Grid,
      GridColumn: baseScope.GridColumn,
      Group: baseScope.Group,
      HStack: baseScope.HStack,
      Spacer: baseScope.Spacer,
      VStack: baseScope.VStack,
    },
    
    '@coinbase/cds-web/buttons': {
      // Extract button exports - check what's actually in baseScope
      Button: baseScope.Button || baseScope.PrimaryButton,
      PrimaryButton: baseScope.PrimaryButton,
      SecondaryButton: baseScope.SecondaryButton,
      IconButton: baseScope.IconButton,
    },
    
    '@coinbase/cds-web/typography': {
      Text: baseScope.Text,
      Heading: baseScope.Heading,
    },
    
    // Visualization packages - CDSVisualizations is spread into baseScope
    '@coinbase/cds-web/visualizations': baseScope,
    
    // Chart components - CDSChartComponents is spread into baseScope
    '@coinbase/cds-web-visualization/chart': baseScope,
    
    // Sparkline components - CDSSparklineComponents is spread into baseScope
    '@coinbase/cds-web-visualization/sparkline': baseScope,
    
    // Common data exports
    '@coinbase/cds-common/internal/visualizations/SparklineInteractiveData': {
      sparklineInteractiveData: baseScope.sparklineInteractiveData,
      sparklineInteractiveHoverData: baseScope.sparklineInteractiveHoverData,
    },
    
    // Framer Motion - motion is spread into baseScope as 'm'
    'framer-motion': {
      default: baseScope.m,
      motion: baseScope.m,
      m: baseScope.m,
      // Include common framer-motion exports that might be in baseScope
      ...(baseScope.m && typeof baseScope.m === 'object' ? baseScope.m : {}),
    },
    
    // Map the main packages to baseScope (contains all CDS components)
    '@coinbase/cds-web': baseScope,
    '@coinbase/cds-common': baseScope,
  };

  // Ensure React and React hooks are in base scope (required for react-runner)
  // Also include package imports in scope.import so they're available when evaluating files
  const scopeWithReact = {
    React,
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
    useContext,
    useReducer,
    ...baseScope,
    import: {
      ...packageImports,
      ...((baseScope as { import?: Record<string, unknown> }).import || {}),
    },
  };

  // Process all files: evaluate them sequentially to build up scope
  // This makes functions/consts available directly (no imports needed)
  const directExports: Record<string, unknown> = {};
  
  // Helper function to extract function/const declarations from code
  function extractDeclarations(code: string): string[] {
    const declarations: string[] = [];
    
    // Extract function declarations (with or without export)
    const functionRegex = /(?:export\s+)?function\s+(\w+)/g;
    let match;
    while ((match = functionRegex.exec(code)) !== null) {
      declarations.push(match[1]);
    }
    
    // Extract const/let/var declarations (with or without export)
    const constRegex = /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=/g;
    while ((match = constRegex.exec(code)) !== null) {
      declarations.push(match[1]);
    }
    
    return declarations;
  }
  
  // Evaluate all files sequentially in a shared scope
  // Add export statements to non-exported functions so they're available
  // IMPORTANT: scopeWithReact already has packageImports in scope.import, so imports will resolve
  // Skip the main file (first file) - it's handled by useRunner directly, not importCode
  // We only process other files to build importMap for the main file's imports
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Skip the main file (first file) - it will be evaluated by useRunner, not importCode
    // The main file needs the importMap to resolve its imports, so we process other files first
    if (i === 0) {
      continue;
    }
    
    try {
      // Build scope incrementally (includes React + baseScope + package imports + previous files' functions)
      const currentScope = { 
        ...scopeWithReact, 
        ...directExports,
        // Ensure import is available in scope for importCode
        // Override scopeWithReact.import to include file modules
        import: {
          ...packageImports,
          ...importMap, // Previous files' modules
        },
      };
      
      // Extract declarations from the file
      const declarations = extractDeclarations(file.content);
      
      // Add export statements for non-exported declarations
      let fileCode = file.content;
      declarations.forEach((name) => {
        // Check if this declaration is already exported
        const isExported = new RegExp(`export\\s+(?:function|const|let|var)\\s+${name}\\b`).test(fileCode) ||
                          new RegExp(`export\\s+{\\s*${name}\\s*}`).test(fileCode);
        
        if (!isExported) {
          // Add export statement
          // Replace: function name -> export function name
          fileCode = fileCode.replace(
            new RegExp(`(^|\\n)(function\\s+${name}\\b)`, 'gm'),
            '$1export $2'
          );
          // Replace: const/let/var name -> export const/let/var name
          fileCode = fileCode.replace(
            new RegExp(`(^|\\n)((?:const|let|var)\\s+${name}\\s*=)`, 'gm'),
            '$1export $2'
          );
        }
      });
      
      // Use importCode to evaluate the file and get its exports
      // The scope.import in currentScope will allow imports to resolve
      const virtualModule = importCode(fileCode, currentScope);
      
      // Extract all exports from the module and add to direct exports
      // This makes them available in scope for subsequent files and main file
      if (virtualModule && typeof virtualModule === 'object') {
        Object.keys(virtualModule).forEach((key) => {
          const value = (virtualModule as Record<string, unknown>)[key];
          if (value !== undefined && value !== null && !key.startsWith('__')) {
            directExports[key] = value;
          }
        });
      }
      
      // Create module identifiers for import map
      const pathWithoutExt = file.path.replace(/\.(ts|tsx|js|jsx)$/, '');
      const moduleId = pathWithoutExt.replace(/^\.\//, '');
      const moduleIdWithDot = pathWithoutExt.startsWith('./') ? pathWithoutExt : `./${pathWithoutExt}`;
      
      // Add to import map - use scope WITHOUT directExports to avoid redeclaration errors
      // The importMap is for resolving imports, not for direct access, so we don't need directExports
      const importScope = {
        ...scopeWithReact,
        // Don't include directExports here - it would cause "already declared" errors
        // since we just added this file's exports to directExports above
        import: {
          ...packageImports,
          ...importMap, // Previous files' modules only
        },
      };
      const importModule = importCode(file.content, importScope);
      importMap[moduleId] = importModule;
      if (moduleId !== moduleIdWithDot) {
        importMap[moduleIdWithDot] = importModule;
      }
      importMap[file.path] = importModule;
    } catch (error) {
      // Only log errors in development, and only for non-main files
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Playground] Could not process file ${file.path}:`, error);
      }
    }
  }

  // Final scope combines everything
  // Note: scopeWithReact already has packageImports in scope.import, so we merge file modules
  const finalScope = {
    ...scopeWithReact,
    ...directExports, // Add exports directly to scope for direct access
    import: {
      ...packageImports, // Common package imports (react, @coinbase/cds-web/layout, etc.)
      ...((baseScope as { import?: Record<string, unknown> }).import || {}),
      ...importMap, // File modules (other files, not main file)
    },
  };
  
  return finalScope;
}

/**
 * Gets the main file content (first file or file with render())
 */
export function getMainFileContent(files: NormalizedPlaygroundFile[]): string {
  if (files.length === 0) {
    return '';
  }
  
  // Find file with render() call, otherwise use first file
  const fileWithRender = files.find((file) => file.content.includes('render('));
  return fileWithRender?.content ?? files[0].content;
}
