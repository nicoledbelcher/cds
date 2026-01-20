# Answers to Material-UI Playground Questions

Based on the Material-UI documentation codebase analysis, here are answers to your questions about multiple files support and the playground system.

## 1. Library Choice: react-runner vs react-live

**Why react-runner?**

Material-UI chose `react-runner` over `react-live` for several reasons:

- **Better TypeScript Support**: `react-runner` uses Babel Standalone which has robust TypeScript transpilation support, allowing TSX code to be executed directly in the browser
- **Scope-Based Architecture**: `react-runner` uses a scope-based system that's more flexible for handling imports and multiple modules
- **No File Combination Required**: Unlike approaches that combine files, `react-runner` works with a single main file and a pre-populated scope, avoiding parsing issues with combined code

**Key Limitations of react-live:**
- `react-live` is designed for single-file execution and struggles with multi-file scenarios
- It requires code transformation/combination which leads to parsing errors (like the ones you're experiencing)
- Less flexible scope management

## 2. Multiple Files Architecture

**Important: Material-UI does NOT combine files into a single string.**

Instead, they use a **scope-based approach**:

1. **Build-Time Processing**: At build time (via webpack loader), they:
   - Detect all relative imports in the main demo file
   - Recursively load all imported files
   - Store them separately for display purposes (tabs)

2. **Runtime Execution**: At runtime:
   - Only the **main file** is passed to `react-runner`
   - External packages (like `@mui/material/Button`, `react`) are pre-loaded into the `scope.import` object
   - For relative imports: Material-UI primarily uses pre-bundled components for demos with relative imports (which avoids the need for scope resolution of relative imports)
   - `react-runner` resolves imports from the scope for external packages

**Key Insight**: Relative modules are stored in `demos[demoName].relativeModules` but these are primarily **for display in tabs**. 

**Important Note**: Material-UI's live editing with `react-runner` may have limitations with relative imports during live editing. The relative modules are loaded and stored, but the scope-based resolution works best with external packages. For demos with relative imports, Material-UI primarily uses the pre-bundled component (faster, no live editing) rather than live `ReactRunner` execution. However, the architecture still avoids file combination - relative imports would need to be added to the scope for full live editing support.

## 3. Code Combination Strategy

**Material-UI does NOT combine files.** Here's their approach:

```javascript
// Main file is passed as-is to react-runner
<ReactRunner
  code={demoData.raw}  // Single file, unchanged
  scope={{
    process: {},
    import: {
      // All imports pre-resolved in scope
      '@mui/material/Button': Button,
      'react': React,
      './data': dataModule,  // Relative imports resolved here
      './utils/helper': helperModule,
    }
  }}
/>
```

**No concatenation, no IIFE wrapping, no module transformation** - the main file keeps its original imports, and `react-runner` resolves them from the scope.

## 4. Import Resolution

**How relative imports are handled:**

1. **Build Time** (`packages/markdown/loader.mjs`):
   - Scans the main file for relative imports using regex: `/^\s*import.*from\s*["']([^"']+)["']/gm`
   - Resolves file extensions (`.js`, `.jsx`, `.ts`, `.tsx`)
   - Recursively processes nested imports
   - Loads all file contents

2. **Scope Population**:
   ```javascript
   demos.scope = {
     process: {},
     import: {
       // External packages (pre-imported)
       '@mui/material/Button': Button,
       'react': React,
       
       // Relative imports (loaded at build time)
       './data': dataModuleExports,
       './utils/helper': helperModuleExports,
     }
   };
   ```

3. **Runtime Resolution**:
   - `react-runner` receives the main file with imports intact
   - When it encounters `import { data } from './data'`, it looks up `'./data'` in `scope.import`
   - Returns the pre-loaded module exports

**Default vs Named Exports**: Both are supported - the scope contains the actual module exports object, so both `export default` and `export const` work.

## 5. Parsing Issues

**Material-UI avoids parsing issues entirely** by:
- Not combining files
- Not transforming code structure
- Keeping original import/export syntax
- Using scope-based resolution instead of file combination

**Your specific issue** (destructured parameters in combined code) wouldn't occur because:
- Files aren't combined
- Original syntax is preserved
- No regex-based transformations of function parameters

## 6. Code Transformation

**Minimal transformation is done:**

1. **Preview Mode**: When showing preview snippets, they replace the preview section:
   ```javascript
   // If in preview mode, replace preview snippet with edited code
   code = demoData.raw.replace(demoData.jsxPreview, editorCode.value)
   ```

2. **No Import Removal**: Imports are kept as-is in the code
3. **No Parameter Transformation**: No destructuring transformations
4. **No Wrappers**: No IIFE or module wrappers added

The code passed to `react-runner` is essentially the original file with imports intact.

## 7. Scope Management

**How scope is managed:**

1. **Build-Time Scope Creation**:
   ```javascript
   // In packages/markdown/loader.mjs
   demos.scope = {
     process: {},
     import: {
       // All external packages
       '@mui/material/Button': ButtonComponent,
       'react': React,
       // ... all other imports
     }
   };
   ```

2. **Relative Module Handling**:
   - Relative modules are detected and loaded at build time
   - Their exports are added to the scope using the import path as the key
   - Example: `import { data } from './data'` → scope.import['./data'] = { data: ... }`

3. **Naming Conflicts**: 
   - Handled by using full import paths as keys
   - Each module is namespaced by its path
   - No conflicts because each path is unique

4. **Module Map**: Yes, they use a module map in the scope's `import` object

## 8. Error Handling

**react-runner's error handling:**

- **Syntax Errors**: Caught during Babel transpilation, returned as error objects
- **Runtime Errors**: Caught during execution, returned via `onError` callback
- **Better Error Messages**: Babel provides more detailed error messages than react-live's parser
- **More Robust Parsing**: Babel Standalone is a full transpiler, not just a parser

**Material-UI's error display**:
- Errors are debounced (300ms) to prevent flickering
- Displayed as Material-UI Alert components above the editor
- Shows both syntax and runtime errors clearly

## 9. Performance

**Performance considerations:**

1. **Debouncing**: Code execution is debounced (300ms) to avoid excessive re-renders
2. **Memoization**: Components are memoized to prevent unnecessary re-renders
3. **Bundled vs Live**: 
   - When code matches original: uses pre-bundled component (faster)
   - When code is edited: switches to live `ReactRunner` execution
4. **Scope Caching**: Scope is created once at build time, reused for all executions

**Multiple Files Performance**:
- No performance penalty for multiple files because they're not combined
- Only the main file is transpiled/executed
- Relative modules are pre-loaded in scope (no runtime file I/O)

## 10. Migration Path: react-live → react-runner

**Main considerations:**

### Breaking Changes:
- **API is different**: `react-runner` uses `useRunner` hook vs `react-live`'s `LiveProvider`
- **Scope structure**: Must provide `scope.import` object with all imports
- **No LiveProvider wrapper**: Different component structure

### API Differences:

**react-live**:
```jsx
<LiveProvider code={code} scope={scope}>
  <LiveEditor />
  <LivePreview />
</LiveProvider>
```

**react-runner**:
```jsx
const { element, error } = useRunner({ code, scope });
return element;
```

### Migration Effort:

1. **Refactor to scope-based approach** (most important):
   - Stop combining files
   - Load all imports into scope at build time
   - Pass single main file to `react-runner`

2. **Update component structure**:
   - Replace `LiveProvider` with `useRunner` hook
   - Handle errors via callback instead of error boundary

3. **Scope preparation**:
   - Create scope object with all imports
   - Include relative modules in scope
   - Handle both default and named exports

### Estimated Effort:
- **Medium**: Requires architectural change (scope-based vs file combination)
- **Benefits**: More robust, better TypeScript support, no parsing issues

## Recommended Solution for Your Issue

Based on Material-UI's approach, here's what we recommend:

### 1. Switch to Scope-Based Architecture

**Instead of combining files:**
```javascript
// ❌ Don't do this
const combinedCode = files.map(f => f.content).join('\n');
```

**Do this:**
```javascript
// ✅ Create scope with all imports
const scope = {
  process: {},
  import: {
    'react': React,
    './Button': ButtonModule,  // Pre-loaded
    './data': DataModule,      // Pre-loaded
  }
};

// Pass only main file
<ReactRunner code={mainFileContent} scope={scope} />
```

### 2. Load Relative Modules at Build Time

```javascript
// At build/load time:
const relativeModules = {};
files.forEach(file => {
  // Parse exports from file
  const exports = parseExports(file.content);
  relativeModules[file.path] = exports;
});

// Add to scope
scope.import = { ...scope.import, ...relativeModules };
```

### 3. Keep Original Import Syntax

Don't remove or transform imports - let `react-runner` resolve them from scope:

```javascript
// Main file keeps original imports
import { Button } from './Button';
import { data } from './data';

export default function App() {
  // ...
}
```

### 4. Use react-runner

```bash
npm install react-runner
```

```jsx
import { useRunner } from 'react-runner';

function Playground({ code, scope }) {
  const { element, error } = useRunner({ code, scope });
  
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  return element;
}
```

## Key Takeaways

1. **Don't combine files** - use scope-based import resolution
2. **react-runner is better** for multi-file scenarios than react-live
3. **Pre-load imports** into scope at build time
4. **Keep original syntax** - no transformations needed
5. **Single file execution** - only main file goes to react-runner
6. **Scope contains everything** - all imports pre-resolved

This architecture avoids all the parsing issues you're experiencing because files are never combined, and the original syntax is preserved.

## Additional Resources

- **react-runner GitHub**: https://github.com/nihgwu/react-runner
- **Material-UI Implementation**: 
  - `docs/src/modules/components/ReactRunner.tsx`
  - `packages/markdown/loader.mjs` (scope creation)
  - `docs/src/modules/components/Demo.js` (usage)

## Contact

If you need more details about any specific part of the implementation, the Material-UI codebase is open source and well-documented. The key files to study are:
- `packages/markdown/loader.mjs` - Build-time processing and scope creation
- `docs/src/modules/components/ReactRunner.tsx` - Runtime execution
- `docs/src/modules/components/Demo.js` - Integration and state management
