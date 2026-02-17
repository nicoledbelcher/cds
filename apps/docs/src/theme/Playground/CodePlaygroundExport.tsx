import { useCallback } from 'react';
import { useSandpack } from '@codesandbox/sandpack-react';
import StackBlitzSDK from '@stackblitz/sdk';

import { generateImports } from '../importMap';

/**
 * Helper for opening the current playground code in StackBlitz.
 *
 * StackBlitz uses WebContainers — a browser-based Node.js runtime that
 * fully supports the `exports` field in package.json. This means subpath
 * imports like '@coinbase/cds-web/system/ThemeProvider' resolve correctly
 * without any rewriting, unlike classic CodeSandbox browser sandboxes.
 *
 * Reference: https://developer.stackblitz.com/guides/integration/create-with-sdk
 */

/**
 * Ensure the code has an `export default` so the generated index.tsx can
 * import it. Handles three cases:
 *
 * 1. Already has `export default` → leave as-is
 * 2. Has a named function/const/class but no default export → add one
 * 3. Bare JSX expression → wrap in `export default function App()`
 */
export const ensureDefaultExport = (code: string): string => {
  const trimmed = code.trim();

  // Already has a default export — nothing to do
  if (/\bexport\s+default\b/.test(trimmed)) {
    return code;
  }

  // Named function declaration: `function Foo(` → `export default function Foo(`
  const funcMatch = trimmed.match(/^function\s+([A-Z]\w*)\s*\(/);
  if (funcMatch) {
    return code.replace(/^(\s*)function\s+/, '$1export default function ');
  }

  // Named const/let/var component: `const Foo = ...` → append `export default Foo;`
  const constMatch = trimmed.match(/^(?:const|let|var)\s+([A-Z]\w*)\b/);
  if (constMatch) {
    return `${code}\n\nexport default ${constMatch[1]};`;
  }

  // Has other declarations (import, class, etc.) — leave as-is
  if (/^(export\s|class\s|import\s)/.test(trimmed)) {
    return code;
  }

  // Bare JSX or expression — wrap in an App component
  return `export default function App() {\n  return (\n    ${trimmed}\n  );\n}`;
};

/** Build the StackBlitz project files from the current Sandpack state. */
const buildProjectFiles = (
  sandpackFiles: Record<string, { code: string }>,
  visibleFiles: string[],
  isMultiFile: boolean,
): Record<string, string> => {
  const files: Record<string, string> = {};

  if (isMultiFile) {
    for (const filePath of visibleFiles) {
      const code = sandpackFiles[filePath]?.code ?? '';
      const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      files[`src/${cleanPath}`] = code;
    }
    files['src/index.tsx'] = `import '@coinbase/cds-icons/fonts/web/icon-font.css';
import '@coinbase/cds-web/defaultFontStyles';
import '@coinbase/cds-web/globalStyles';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { VStack } from '@coinbase/cds-web/layout/VStack';
import { ThemeProvider, MediaQueryProvider } from '@coinbase/cds-web/system';
import { defaultTheme } from '@coinbase/cds-web/themes/defaultTheme';
import Example from './Example';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <MediaQueryProvider>
      <ThemeProvider theme={defaultTheme} activeColorScheme="light">
        <VStack padding={3}>
          <Example />
        </VStack>
      </ThemeProvider>
    </MediaQueryProvider>
  </React.StrictMode>
);
`;
  } else {
    const activeFile =
      Object.keys(sandpackFiles).find((f) => f.includes('App')) ?? Object.keys(sandpackFiles)[0];
    const rawCode = sandpackFiles[activeFile]?.code ?? '';
    // Only generate imports for legacy jsx-live blocks that don't have real imports.
    // File-based examples already have their own import statements.
    const hasExistingImports = /^\s*import\s/m.test(rawCode);
    const imports = hasExistingImports ? '' : generateImports(rawCode);
    const wrappedCode = ensureDefaultExport(rawCode);
    files['src/App.tsx'] = `${imports ? imports + '\n\n' : ''}${wrappedCode}`;
    files['src/index.tsx'] = `import '@coinbase/cds-icons/fonts/web/icon-font.css';
import '@coinbase/cds-web/defaultFontStyles';
import '@coinbase/cds-web/globalStyles';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { VStack } from '@coinbase/cds-web/layout/VStack';
import { ThemeProvider, MediaQueryProvider } from '@coinbase/cds-web/system';
import { defaultTheme } from '@coinbase/cds-web/themes/defaultTheme';
import App from './App';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <MediaQueryProvider>
      <ThemeProvider theme={defaultTheme} activeColorScheme="light">
        <VStack padding={3}>
          <App />
        </VStack>
      </ThemeProvider>
    </MediaQueryProvider>
  </React.StrictMode>
);
`;
  }

  files['package.json'] = JSON.stringify(
    {
      name: 'cds-example',
      private: true,
      scripts: { dev: 'vite', build: 'vite build' },
      dependencies: {
        react: '^18.0.0',
        'react-dom': '^18.0.0',
        '@coinbase/cds-web': 'latest',
        '@coinbase/cds-common': 'latest',
        '@coinbase/cds-icons': 'latest',
        '@coinbase/cds-illustrations': 'latest',
        '@coinbase/cds-web-visualization': 'beta',
        'framer-motion': '^10.18.0',
      },
      devDependencies: {
        typescript: '^5.0.0',
        '@types/react': '^18.0.0',
        '@types/react-dom': '^18.0.0',
        vite: '^5.0.0',
        '@vitejs/plugin-react': '^4.0.0',
      },
    },
    null,
    2,
  );

  files['vite.config.ts'] = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`;

  files['tsconfig.json'] = JSON.stringify(
    {
      compilerOptions: {
        target: 'es2020',
        lib: ['dom', 'dom.iterable', 'es2020'],
        jsx: 'react-jsx',
        module: 'esnext',
        moduleResolution: 'bundler',
        strict: true,
        esModuleInterop: true,
      },
      include: ['src'],
    },
    null,
    2,
  );

  files['index.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CDS Example</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/index.tsx"></script>
</body>
</html>`;

  return files;
};

/**
 * Hook that returns an onClick handler for opening the current playground
 * code in StackBlitz. Must be called inside a SandpackProvider.
 *
 * @param isMultiFile - Whether the playground has multiple files.
 * @param originalFiles - The original unmodified files (before snippet mode
 *   may have replaced file content in Sandpack). If provided, these are used
 *   for the export so the full code is always sent to StackBlitz.
 */
export const useOpenInCodeSandbox = (
  isMultiFile: boolean,
  originalFiles?: Record<string, string>,
): (() => void) => {
  const { sandpack } = useSandpack();

  return useCallback(() => {
    // Use original files when available so snippet-mode replacements
    // don't end up in the exported project.
    const filesToExport: Record<string, { code: string }> = originalFiles
      ? Object.fromEntries(Object.entries(originalFiles).map(([k, v]) => [k, { code: v }]))
      : sandpack.files;
    const visibleFilesToExport = originalFiles
      ? Object.keys(originalFiles).map((k) => (k.startsWith('/') ? k : `/${k}`))
      : sandpack.visibleFiles;

    const files = buildProjectFiles(filesToExport, visibleFilesToExport, isMultiFile);

    StackBlitzSDK.openProject(
      {
        title: 'CDS Example',
        description: 'Coinbase Design System example',
        template: 'node',
        files,
      },
      {
        newWindow: true,
        openFile: isMultiFile ? 'src/Example.tsx' : 'src/App.tsx',
      },
    );
  }, [sandpack, isMultiFile, originalFiles]);
};
