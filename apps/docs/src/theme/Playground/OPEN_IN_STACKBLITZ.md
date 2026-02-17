# Open in StackBlitz — How It Works

## Overview

Every playground example on the CDS docs site has an "Open in StackBlitz" button that exports the current code into a fully working [StackBlitz](https://stackblitz.com) project. StackBlitz runs [WebContainers](https://webcontainers.io/) — a browser-based Node.js runtime — which means subpath imports like `@coinbase/cds-web/system/ThemeProvider` resolve correctly via the `exports` field in `package.json`. This was the key reason we chose StackBlitz over CodeSandbox (whose classic browser bundler doesn't support `exports`).

**Package:** `@stackblitz/sdk@^1.11.0` (in `apps/docs/package.json`)

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Playground component (index.tsx)                   │
│                                                     │
│  ┌─ SandpackProvider ─────────────────────────────┐ │
│  │  Manages code editor state (files, active file)│ │
│  │                                                │ │
│  │  ┌─ PlaygroundHeader ────────────────────────┐ │ │
│  │  │  "Open in StackBlitz" button              │ │ │
│  │  │  → calls useOpenInCodeSandbox() hook      │ │ │
│  │  └───────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  CodePlaygroundExport.tsx                           │
│                                                     │
│  1. Reads files from Sandpack (or originalFiles)    │
│  2. Builds a complete project (see below)           │
│  3. Calls StackBlitzSDK.openProject()               │
│     → Opens a new browser tab with the project      │
└─────────────────────────────────────────────────────┘
```

Key files:
- **`CodePlaygroundExport.tsx`** — The export hook and project builder
- **`importMap.ts`** — Maps identifier names to package import paths (for auto-generating imports)

---

## Two Code Paths: Single-File vs Multi-File

The export handles two types of playground examples differently:

### Single-File (inline `jsx live` blocks)

These are the legacy code blocks written directly in MDX:

```mdx
```jsx live
function MyExample() {
  return <Button>Click Me</Button>;
}
```​
```

The code is a bare snippet — no `import` statements, no `export default`. The export must:

1. **Auto-generate imports** via `generateImports()` (uses the `importMap`)
2. **Ensure a default export** via `ensureDefaultExport()`
3. Place the result in `src/App.tsx`

### Multi-File (file-based examples)

These are directory-based examples referenced from MDX:

```mdx
<Playground example="./examples/AssetPriceChart" />
```

The remark plugin (`remarkPlaygroundExamples.ts`) reads all `.ts/.tsx` files from the directory and injects them as `filesJson`. These files already have real imports and exports, so the export:

1. **Copies all files verbatim** into `src/`
2. Does NOT run `generateImports` or `ensureDefaultExport`
3. The entry point imports from `src/Example.tsx` (by convention)

---

## How Import Generation Works (Single-File Only)

When exporting a single-file `jsx live` block, the code has no `import` statements because the playground's `ReactLiveScope` provides all identifiers globally. We need to reconstruct the imports for the standalone StackBlitz project.

### The Import Map (`importMap.ts`)

A static mapping of ~200+ identifier names to their package paths:

```ts
{
  Button:   { source: '@coinbase/cds-web/buttons' },
  VStack:   { source: '@coinbase/cds-web/layout/VStack' },
  LineChart: { source: '@coinbase/cds-web-visualization/chart' },
  Scrubber: { source: '@coinbase/cds-web-visualization/chart' },
  useState: { source: 'react' },
  // ...etc
}
```

Aliased imports are also supported:

```ts
{
  btcCandles: {
    source: '@coinbase/cds-common/internal/data/candles',
    exportedAs: 'candles',  // generates: import { candles as btcCandles } from '...'
  },
}
```

### `generateImports(code)`

1. For each identifier in the import map, checks if it appears in the code (word boundary regex `\bName\b`)
2. Skips identifiers that are **declared locally** in the code (to avoid false positives like `const prices = ...` shadowing the `prices` data import)
3. Groups by package and generates import statements

### `isDeclaredLocally(name, code)`

Detects local declarations to prevent false-positive imports:

- `const prices = ...` / `let prices` / `var prices`
- `function formatPrice(...)`
- Destructuring in declarations: `const { title } = props`
- Destructuring in function params: `({ title, description })`

Importantly, it does **NOT** false-positive on:
- JSX component usage: `<VStack>`, `<LineChart />`
- Identifiers inside object literals or function bodies

---

## How `ensureDefaultExport` Works (Single-File Only)

The generated `src/index.tsx` does `import App from './App'` (default import), so the code must have a default export. The `ensureDefaultExport()` function handles several cases:

| Input | Output |
|-------|--------|
| `export default function App() { ... }` | Unchanged (already has default export) |
| `function MonotoneAssetPrice() { ... }` | `export default function MonotoneAssetPrice() { ... }` |
| `const MyChart = memo(...)` | Original code + `\nexport default MyChart;` |
| `<Button>Click Me</Button>` (bare JSX) | Wrapped in `export default function App() { return (...) }` |

The function name matching is case-sensitive — only PascalCase names (starting with uppercase) are treated as components. A lowercase `function formatPrice()` would not match, and the code would fall through to the bare-JSX wrapper.

---

## Generated Project Structure

Every exported StackBlitz project has this structure:

```
├── index.html            # Loads Inter font from Google Fonts
├── package.json          # CDS dependencies (latest), Vite, TypeScript
├── vite.config.ts        # React plugin
├── tsconfig.json         # moduleResolution: "bundler"
└── src/
    ├── index.tsx          # Entry point (see below)
    ├── App.tsx            # (single-file) or...
    ├── Example.tsx        # (multi-file) + other files
    ├── AssetPriceChart.tsx
    └── data.ts
```

### `src/index.tsx` (generated entry point)

This follows the [CDS installation guide](https://cds.coinbase.com/getting-started/installation) exactly:

```tsx
import '@coinbase/cds-icons/fonts/web/icon-font.css';  // Icon font styles
import '@coinbase/cds-web/defaultFontStyles';           // Sets --defaultFont-sans: 'Inter'
import '@coinbase/cds-web/globalStyles';                // Global reset/base styles
import React from 'react';
import { createRoot } from 'react-dom/client';
import { VStack } from '@coinbase/cds-web/layout/VStack';
import { ThemeProvider, MediaQueryProvider } from '@coinbase/cds-web/system';
import { defaultTheme } from '@coinbase/cds-web/themes/defaultTheme';
import App from './App';  // or Example for multi-file

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <MediaQueryProvider>
      <ThemeProvider theme={defaultTheme} activeColorScheme="light">
        <VStack padding={3}>   {/* Mirrors docs preview padding */}
          <App />
        </VStack>
      </ThemeProvider>
    </MediaQueryProvider>
  </React.StrictMode>
);
```

### `package.json` dependencies

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@coinbase/cds-web": "latest",
    "@coinbase/cds-common": "latest",
    "@coinbase/cds-icons": "latest",
    "@coinbase/cds-illustrations": "latest",
    "@coinbase/cds-web-visualization": "beta",
    "framer-motion": "^10.18.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0"
  }
}
```

### `index.html`

Loads the Inter font from Google Fonts. The `defaultFontStyles` import in `index.tsx` sets the CSS variable `--defaultFont-sans: 'Inter', sans-serif`, but the actual font file still needs to be loaded externally.

---

## Original Files vs Sandpack State

The Playground's code editor uses Sandpack, which supports a "snippet mode" for single-file examples — it extracts just the JSX return portion of a component and shows that in a compact view. This **replaces the Sandpack file content** with a truncated version.

To avoid exporting snippet-truncated code, the `useOpenInCodeSandbox` hook accepts an `originalFiles` parameter — the unmodified files from before any snippet-mode replacements. These flow from:

```
Playground (sandpackFiles) → CodeSection (originalFiles) → PlaygroundHeader → useOpenInCodeSandbox hook
```

Multi-file examples also skip snippet mode entirely (forced to `'full'` display mode) because replacing the active file's content would break execution — the bridge reads directly from Sandpack for multi-file examples.

---

## Why StackBlitz Instead of CodeSandbox

We previously used the [CodeSandbox Define API](https://codesandbox.io/docs/learn/sandboxes/cli-api) to export examples. Two issues led to the switch:

1. **Devbox approach** (`/p/devbox/{id}`): Required a VM with `npm install` in a terminal. The terminal often failed or was inaccessible, causing "Cannot find module" errors.

2. **Classic sandbox approach** (`/embed/{id}`): The in-browser bundler doesn't support the `exports` field in `package.json`. Since CDS publishes files under `esm/` and uses `exports` to map subpaths (e.g., `@coinbase/cds-web/system` → `./esm/system/index.js`), all subpath imports failed.

StackBlitz WebContainers run real Node.js in the browser, which fully supports `exports`, Vite, and all standard Node.js module resolution. The `@stackblitz/sdk` `openProject()` API is simpler than the CodeSandbox Define API — no server round-trip needed, the project opens directly in a new tab.
