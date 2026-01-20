/**
 * Creates a CodeSandbox project from code and opens it in a new tab
 * Uses CodeSandbox's define API via form submission
 */

export type CodeSandboxFiles = {
  [path: string]: {
    content: string | object; // Can be string or object (for package.json)
    isBinary?: boolean;
  };
};

export type CodeSandboxDependencies = {
  [packageName: string]: string;
};

export interface CodeSandboxOptions {
  files: CodeSandboxFiles;
  dependencies?: CodeSandboxDependencies;
  template?: string; // CodeSandbox template (e.g., 'node', 'static', etc.)
}

const DEFAULT_DEPENDENCIES: CodeSandboxDependencies = {
  react: '^18',
  'react-dom': '^18',
  '@types/react': '^19.1.2',
  '@types/react-dom': '^19.1.2',
  '@types/node': '^22',
  typescript: '~5.9.2',
  '@coinbase/cds-web': 'latest',
  '@coinbase/cds-common': 'latest',
  '@coinbase/cds-icons': '^5',
  '@coinbase/cds-illustrations': '^4',
  '@coinbase/cds-web-visualization': '^3',
  'framer-motion': '^10',
  vite: '^7.1.2',
  '@vitejs/plugin-react': '^5.0.0',
};

// Omit template to let CodeSandbox auto-detect based on files (vite.config.ts will indicate Vite)
const DEFAULT_TEMPLATE: CodeSandboxOptions['template'] = undefined;

/**
 * Creates a CodeSandbox project and opens it in a new tab
 */
export function openInCodeSandbox(options: CodeSandboxOptions): void {
  const { files, dependencies = {}, template = DEFAULT_TEMPLATE } = options;

  // Merge with default dependencies
  const allDependencies = {
    ...DEFAULT_DEPENDENCIES,
    ...dependencies,
  };

  // Create package.json - CodeSandbox expects package.json content as an object
  // Use vite-app template structure
  const packageJson = {
    name: 'cds-playground',
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc -b && vite build',
      preview: 'vite preview',
    },
    dependencies: allDependencies,
    devDependencies: {
      '@types/node': '^22',
      '@types/react': '^19.1.2',
      '@types/react-dom': '^19.1.2',
      '@vitejs/plugin-react': '^5.0.0',
      typescript: '~5.9.2',
      vite: '^7.1.2',
    },
  };

  // Convert all files to CodeSandbox format
  // package.json content should be an object, other files should be strings
  const allFiles: Record<string, { content: string | object; isBinary?: boolean }> = {
    ...files,
    'package.json': {
      content: packageJson, // Object, not stringified
    },
  };

  // Create the request body for CodeSandbox's define API
  // According to CodeSandbox docs, POST should send JSON directly
  // Omit template to let CodeSandbox auto-detect based on files
  const requestBody: {
    files: Record<string, { content: string | object; isBinary?: boolean }>;
    template?: string;
  } = {
    files: allFiles,
  };
  
  // Only include template if specified (CodeSandbox will auto-detect Vite from files)
  if (template) {
    requestBody.template = template;
  }

  // Use fetch to POST JSON to CodeSandbox
  // Then redirect to the created sandbox
  fetch('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.sandbox_id) {
        // Open the sandbox in a new tab
        window.open(`https://codesandbox.io/s/${data.sandbox_id}`, '_blank');
      } else {
        throw new Error('No sandbox_id in response');
      }
    })
    .catch((error) => {
      console.error('CodeSandbox error:', error);
      // Fallback: try form submission method
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://codesandbox.io/api/v1/sandboxes/define';
      form.target = '_blank';
      form.style.display = 'none';

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'parameters';
      input.value = JSON.stringify(requestBody);

      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    });
}

/**
 * Extracts dependencies from code by looking for import statements
 * This is a simple heuristic - may not catch all cases
 */
export function extractDependencies(code: string): CodeSandboxDependencies {
  const dependencies: CodeSandboxDependencies = {};
  const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g;

  let match;
  while ((match = importRegex.exec(code)) !== null) {
    const importPath = match[1];

    // Skip relative imports
    if (importPath.startsWith('.') || importPath.startsWith('/')) {
      continue;
    }

    // Extract package name (handle scoped packages)
    const packageName = importPath.split('/')[0] + (importPath.startsWith('@') ? '/' + importPath.split('/')[1] : '');

    // Only add if it's not already in default dependencies
    if (!DEFAULT_DEPENDENCIES[packageName] && !dependencies[packageName]) {
      // Use latest version as a default (CodeSandbox will resolve)
      dependencies[packageName] = 'latest';
    }
  }

  return dependencies;
}

/**
 * Detects if code has a default export
 */
function hasDefaultExport(code: string): boolean {
  // Check for export default
  return /export\s+default\s+/.test(code);
}

/**
 * Extracts the default export name from code
 */
function getDefaultExportName(code: string): string | null {
  // Try to find: export default ComponentName
  const match = code.match(/export\s+default\s+(\w+)/);
  if (match) {
    return match[1];
  }
  // Try to find: export default function ComponentName
  const functionMatch = code.match(/export\s+default\s+function\s+(\w+)/);
  if (functionMatch) {
    return functionMatch[1];
  }
  // Try to find: const ComponentName = ...; export default ComponentName
  const constMatch = code.match(/(?:const|let|var)\s+(\w+)\s*=.*?export\s+default\s+\1/);
  if (constMatch) {
    return constMatch[1];
  }
  return null;
}

/**
 * Creates a Vite app structure for CodeSandbox based on vite-app template
 * Supports both render() calls (for backward compatibility) and default exports
 */
export function createCodeSandboxFiles(
  code: string,
  additionalFiles?: CodeSandboxFiles,
): CodeSandboxFiles {
  const hasRender = code.includes('render(');
  const hasDefault = hasDefaultExport(code);
  
  // Determine the main component name
  let appComponentName = 'App';
  let appContent = code;
  
  if (hasRender) {
    // Legacy: code has render() call, extract the component being rendered
    const renderMatch = code.match(/render\s*\(\s*<(\w+)/);
    if (renderMatch) {
      appComponentName = renderMatch[1];
    }
    // Remove render() call for App.tsx
    appContent = code.replace(/render\s*\([^)]*\)\s*;?\s*$/, '').trim();
  } else if (hasDefault) {
    // New: code has default export, use that
    const defaultName = getDefaultExportName(code);
    if (defaultName) {
      appComponentName = defaultName;
    }
    appContent = code;
  } else {
    // No render or export, assume it's a component and wrap it
    appContent = `${code}\n\nexport default App;`;
  }

  // Create src/App.tsx with the main component
  const files: CodeSandboxFiles = {
    'src/App.tsx': {
      content: appContent,
    },
    // Create src/main.tsx that imports and renders the default export
    'src/main.tsx': {
      content: `import '@coinbase/cds-icons/fonts/web/icon-font.css';
import '@coinbase/cds-web/globalStyles';
import '@coinbase/cds-web/defaultFontStyles';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ${appComponentName} from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <${appComponentName} />
  </StrictMode>,
);
`,
    },
    // Create index.html matching vite-app template
    'index.html': {
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CDS Playground</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
    },
    // Create vite.config.ts
    'vite.config.ts': {
      content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`,
    },
    // Create tsconfig.json
    'tsconfig.json': {
      content: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
`,
    },
    // Create src/vite-env.d.ts
    'src/vite-env.d.ts': {
      content: `/// <reference types="vite/client" />
`,
    },
    ...additionalFiles,
  };

  return files;
}
