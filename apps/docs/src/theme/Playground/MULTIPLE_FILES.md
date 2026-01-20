# Multiple Files Support

## Overview

The Playground now supports multiple files, allowing you to organize code examples across multiple files similar to Material-UI's approach.

## Current Implementation Status

### ✅ Completed

1. **File Structure & Types**
   - Support for `Record<string, string>` or `PlaygroundFile[]`
   - File normalization and management
   - Main file detection

2. **File Tabs UI**
   - Tab interface using CDS Tabs
   - Active file highlighting
   - Read-only indicators for non-editable files
   - File switching

3. **Basic File Management**
   - Only main file is editable
   - Other files are read-only
   - Copy current tab functionality
   - Reset all files

4. **Scope Integration**
   - Files added to react-live scope
   - Combined scope creation

### ⚠️ Limitations / TODO

1. **Import Resolution**
   - Import parsing implemented
   - File resolution implemented
   - **Not yet**: Full import transformation (imports still need to be removed/transformed)
   - **Not yet**: Export extraction from imported files
   - **Not yet**: Nested import handling

2. **Code Execution**
   - Currently executes main file only
   - Imported files are available in scope but imports aren't transformed yet
   - Need to transform code to replace imports with scope access

## Usage

### Option 1: Using `files` prop (Recommended)

```tsx
<Playground
  files={{
    "main.tsx": `
import { Button } from './Button';
import { data } from './data';

export default function App() {
  return (
    <VStack gap={2}>
      <Button>Click me</Button>
      <Text>{data.message}</Text>
    </VStack>
  );
}
    `,
    "./Button.tsx": `
export function Button({ children }) {
  return <button>{children}</button>;
}
    `,
    "./data.ts": `
export const data = {
  message: "Hello from data file!"
};
    `
  }}
/>
```

### Option 2: Using `PlaygroundFile[]` format

```tsx
<Playground
  files={[
    {
      path: "main.tsx",
      content: `...`,
      editable: true
    },
    {
      path: "./Button.tsx",
      content: `...`,
      editable: false
    }
  ]}
/>
```

## File Naming

- Main file: Should be the first file or explicitly marked as `editable: true`
- Relative imports: Use `./filename` or `../filename` format
- File extensions: `.ts`, `.tsx`, `.js`, `.jsx` are supported

## Current Behavior

1. **File Display**: All files shown as tabs above the editor
2. **Editing**: Only the main (first) file is editable
3. **Execution**: Main file is executed (imports are parsed but not yet fully transformed)
4. **Scope**: All files are added to the scope, but imports need manual transformation

## Future Enhancements

1. **Full Import Transformation**
   - Automatically transform `import { X } from './file'` to scope access
   - Extract exports from imported files
   - Handle default, named, and namespace imports

2. **Build-Time File Resolution**
   - Auto-detect relative imports
   - Load files automatically
   - No manual file definition needed

3. **Nested Imports**
   - Handle imports within imported files
   - Recursive import resolution

## Implementation Details

### Files Created

- `types.ts` - Type definitions and normalization utilities
- `FileTabs.tsx` - Tab UI component
- `utils/importResolver.ts` - Import parsing and resolution
- `utils/codeTransformer.ts` - Code transformation utilities

### Key Functions

- `normalizeFiles()` - Converts various input formats to normalized structure
- `getMainFile()` - Gets the editable main file
- `parseImports()` - Parses import statements from code
- `findFileByImportPath()` - Resolves import paths to files
- `createCombinedScope()` - Combines original scope with file modules
