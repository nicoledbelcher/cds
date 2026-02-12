import { useCallback } from 'react';
import { useSandpack } from '@codesandbox/sandpack-react';
import LZString from 'lz-string';

import { generateImports } from '../importMap';

/**
 * Helper for opening the current playground code in a CodeSandbox Devbox.
 *
 * Uses the CodeSandbox Define API to create a sandbox, then opens it as a
 * Devbox (VM-based sandbox with real Node.js, which supports package.json
 * exports/subpath imports like '@coinbase/cds-web/system/ThemeProvider').
 *
 * Reference: https://codesandbox.io/docs/learn/sandboxes/cli-api
 */

const CODESANDBOX_DEFINE_URL = 'https://codesandbox.io/api/v1/sandboxes/define';

/**
 * Detect if code is a bare JSX expression (not wrapped in a function/component).
 * If so, wrap it in an export default function with a return statement.
 */
const wrapCodeIfNeeded = (code: string): string => {
  const trimmed = code.trim();

  // Already has a function declaration or component definition -- leave as-is
  if (/^(function\s|const\s|let\s|var\s|export\s|class\s|import\s)/.test(trimmed)) {
    return code;
  }

  // Bare JSX or expression -- wrap in an App component
  return `export default function App() {\n  return (\n    ${trimmed}\n  );\n}`;
};

/** Build the sandbox files payload for the CodeSandbox Define API. */
const buildSandboxFiles = (
  sandpackFiles: Record<string, { code: string }>,
  visibleFiles: string[],
  isMultiFile: boolean,
) => {
  const files: Record<string, { content: string }> = {};

  if (isMultiFile) {
    for (const filePath of visibleFiles) {
      const code = sandpackFiles[filePath]?.code ?? '';
      const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      files[`src/${cleanPath}`] = { content: code };
    }
    files['src/index.tsx'] = {
      content: `import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@coinbase/cds-web/system/ThemeProvider';
import { defaultTheme } from '@coinbase/cds-web/themes/defaultTheme';
import Example from './Example';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={defaultTheme}>
      <Example />
    </ThemeProvider>
  </React.StrictMode>
);
`,
    };
  } else {
    const activeFile =
      Object.keys(sandpackFiles).find((f) => f.includes('App')) ?? Object.keys(sandpackFiles)[0];
    const rawCode = sandpackFiles[activeFile]?.code ?? '';
    const imports = generateImports(rawCode);
    const wrappedCode = wrapCodeIfNeeded(rawCode);
    files['src/App.tsx'] = { content: `${imports ? imports + '\n\n' : ''}${wrappedCode}` };
    files['src/index.tsx'] = {
      content: `import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@coinbase/cds-web/system/ThemeProvider';
import { defaultTheme } from '@coinbase/cds-web/themes/defaultTheme';
import App from './App';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={defaultTheme}>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
`,
    };
  }

  files['package.json'] = {
    content: JSON.stringify(
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
    ),
  };

  files['vite.config.ts'] = {
    content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`,
  };

  files['tsconfig.json'] = {
    content: JSON.stringify(
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
    ),
  };

  files['index.html'] = {
    content: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>CDS Example</title></head>
<body><div id="root"></div><script type="module" src="/src/index.tsx"></script></body>
</html>`,
  };

  files['.codesandbox/tasks.json'] = {
    content: JSON.stringify(
      {
        setupTasks: [{ name: 'Install Dependencies', command: 'npm install' }],
        tasks: {
          dev: {
            name: 'Development Server',
            command: 'npm run dev',
            runAtStart: true,
            preview: { port: 5173 },
          },
        },
      },
      null,
      2,
    ),
  };

  return files;
};

const getCompressedParameters = (files: Record<string, { content: string }>): string => {
  return LZString.compressToBase64(JSON.stringify({ files }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Hook that returns an onClick handler for opening the current playground
 * code in a CodeSandbox Devbox. Must be called inside a SandpackProvider.
 */
export const useOpenInCodeSandbox = (isMultiFile: boolean): (() => void) => {
  const { sandpack } = useSandpack();

  return useCallback(() => {
    const files = buildSandboxFiles(sandpack.files, sandpack.visibleFiles, isMultiFile);
    const parameters = getCompressedParameters(files);

    fetch(`${CODESANDBOX_DEFINE_URL}?json=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files }),
    })
      .then((res) => res.json())
      .then((data: { sandbox_id?: string }) => {
        if (data.sandbox_id) {
          window.open(
            `https://codesandbox.io/p/devbox/${data.sandbox_id}`,
            '_blank',
            'noopener,noreferrer',
          );
        }
      })
      .catch(() => {
        // Fallback: POST form redirect
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = CODESANDBOX_DEFINE_URL;
        form.target = '_blank';
        const input = document.createElement('input');
        input.name = 'parameters';
        input.type = 'hidden';
        input.value = parameters;
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
      });
  }, [sandpack, isMultiFile]);
};
