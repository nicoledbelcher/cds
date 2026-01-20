# Playground Improvements Implementation Plan

## Overview

This document outlines the implementation plan for improving the CDS documentation playground with the following priorities:

1. Support multiple files
2. More menu buttons (reset code, copy current page, open in CodeSandbox)
3. Better syntax highlighting
4. Improved error display
5. Other improvements

## Phase 1: Foundation & Error Handling (Start Here)

### 1.1 Improved Error Display
**Priority**: High | **Effort**: Low | **Dependencies**: None

**Tasks**:
- [ ] Create `PlaygroundError` component using CDS Alert
- [ ] Add debouncing (300ms) to error state
- [ ] Position error above editor (similar to MUI)
- [ ] Style error with CDS design tokens
- [ ] Update `Playground` and `ShareablePlayground` to use new error component

**Files to modify**:
- `apps/docs/src/theme/Playground/index.tsx`
- `apps/docs/src/components/page/ShareablePlayground/index.tsx`
- Create: `apps/docs/src/theme/Playground/PlaygroundError.tsx`

**Implementation Notes**:
- Replace `LiveError` with custom component
- Use `useState` + `useEffect` with debounce for error state
- Extract error from `react-live` context or use error callback if available

### 1.2 Store Original Code for Reset
**Priority**: High | **Effort**: Low | **Dependencies**: None

**Tasks**:
- [ ] Store original code in `useRef` when component mounts
- [ ] Add `originalCodeRef` to track initial state
- [ ] Prepare for reset functionality in Phase 2

**Files to modify**:
- `apps/docs/src/theme/Playground/index.tsx`
- `apps/docs/src/components/page/ShareablePlayground/index.tsx`

## Phase 2: Enhanced Controls & Syntax Highlighting

### 2.1 Better Syntax Highlighting
**Priority**: High | **Effort**: Medium | **Dependencies**: None

**Research First**:
- [ ] Evaluate `react-simple-code-editor` vs improving `react-live` Prism integration
- [ ] Test both approaches with various code examples
- [ ] Check if `react-live` v4.1.8 has better Prism support than we're using

**Option A: Switch to `react-simple-code-editor`**
- [ ] Install `react-simple-code-editor` and `prismjs`
- [ ] Create custom `CodeEditor` component
- [ ] Integrate with `react-live` execution (keep `LiveProvider` for execution)
- [ ] Apply Prism themes from `usePlaygroundTheme`
- [ ] Test with TSX/JSX highlighting

**Option B: Improve `react-live` Integration**
- [ ] Check `react-live` Prism configuration options
- [ ] Customize Prism theme application
- [ ] Ensure proper language detection
- [ ] Test edge cases

**Files to modify/create**:
- `apps/docs/src/theme/Playground/index.tsx`
- `apps/docs/src/components/page/ShareablePlayground/index.tsx`
- Create: `apps/docs/src/theme/Playground/CodeEditor.tsx` (if Option A)

**Decision Point**: After research, choose Option A or B based on:
- Quality of highlighting
- Maintenance burden
- Integration complexity

### 2.2 Enhanced Toolbar/Menu
**Priority**: High | **Effort**: Medium | **Dependencies**: 1.2

**Tasks**:
- [ ] Create `PlaygroundToolbar` component with menu
- [ ] Add "Reset code" button (uses original code from 1.2)
- [ ] Enhance "Copy code" to copy current tab (for multi-file support)
- [ ] Add "Open in CodeSandbox" button
- [ ] Use CDS Dropdown/Menu for additional options
- [ ] Add proper icons and accessibility labels

**CodeSandbox Integration**:
- [ ] Research CodeSandbox API for creating projects
- [ ] Create function to format code for CodeSandbox
- [ ] Handle dependencies (extract from imports or use defaults)
- [ ] Open CodeSandbox in new tab with pre-filled code

**Files to modify/create**:
- `apps/docs/src/theme/Playground/index.tsx`
- `apps/docs/src/components/page/ShareablePlayground/index.tsx`
- Create: `apps/docs/src/theme/Playground/PlaygroundToolbar.tsx`
- Create: `apps/docs/src/theme/Playground/utils/codesandbox.ts`

**Implementation Notes**:
- Use CodeSandbox's `define` API or form submission
- Format code with proper structure (package.json, dependencies, etc.)
- Handle React, TypeScript, and CDS dependencies

## Phase 3: Multiple Files Support

### 3.1 Design Decision: File Resolution Approach

**Option A: Build-Time File Resolution (Like MUI)**
- Pros: Fast, no runtime overhead, clear file structure
- Cons: Requires build-time processing, more complex setup
- Implementation: Custom webpack/Docusaurus plugin to scan and bundle files

**Option B: Runtime File Resolution with Metadata**
- Pros: Simpler, no build changes needed
- Cons: Requires manual file definition in MDX, less automatic
- Implementation: Accept files as prop/metadata, resolve at runtime

**Option C: Hybrid - Build-Time Detection, Runtime Resolution**
- Pros: Best of both worlds
- Cons: Most complex
- Implementation: Build-time scanning + runtime file loading

**Recommendation**: Start with **Option B** (simpler, can upgrade later), then consider Option A if needed.

### 3.2 File Structure & API Design

**Proposed API**:

```tsx
// In MDX
```jsx live
<Playground files={{
  "main.tsx": `...code...`,
  "./utils.ts": `...code...`,
  "./data.ts": `...code...`
}}>
```

Or via metadata:
```mdx
```jsx live files=main.tsx,utils.ts,data.ts
// Main code here
```

**File Format**:
```typescript
type PlaygroundFile = {
  path: string; // e.g., "main.tsx", "./utils.ts"
  content: string;
  editable?: boolean; // Only main file is editable
};

type PlaygroundFiles = Record<string, string> | PlaygroundFile[];
```

### 3.3 File Tabs UI
**Priority**: High | **Effort**: Medium | **Dependencies**: 3.2

**Tasks**:
- [ ] Create `FileTabs` component using CDS Tabs
- [ ] Display file names as tabs
- [ ] Show active file content in editor
- [ ] Only main file is editable, others read-only
- [ ] Handle tab switching
- [ ] Show file path/name clearly

**Files to create/modify**:
- Create: `apps/docs/src/theme/Playground/FileTabs.tsx`
- `apps/docs/src/theme/Playground/index.tsx`

**UI Design**:
- Tabs above editor
- Active tab highlighted
- Read-only indicator for non-editable files
- File path shown in tab (e.g., "main.tsx", "./utils.ts")

### 3.4 Import Resolution & Code Execution
**Priority**: High | **Effort**: High | **Dependencies**: 3.2, 3.3

**Tasks**:
- [ ] Parse imports from main file
- [ ] Resolve relative imports to file paths
- [ ] Create module map for `react-live` scope
- [ ] Transform imports in code to use scope
- [ ] Handle nested imports (imports within imported files)
- [ ] Update `LiveProvider` scope with file modules

**Implementation Approach**:
1. Parse AST to find import statements
2. Match relative imports to file paths
3. Create a module system that maps imports to file content
4. Transform code to replace imports with scope access
5. Execute transformed code with all files in scope

**Files to create/modify**:
- Create: `apps/docs/src/theme/Playground/utils/importResolver.ts`
- Create: `apps/docs/src/theme/Playground/utils/codeTransformer.ts`
- `apps/docs/src/theme/Playground/index.tsx`

**Challenges**:
- TypeScript/JSX import parsing
- Handling different import styles (default, named, namespace)
- Module execution context
- Error handling for missing imports

### 3.5 Build-Time File Detection (Optional Enhancement)
**Priority**: Medium | **Effort**: High | **Dependencies**: 3.4

**Tasks**:
- [ ] Create Docusaurus/webpack plugin to scan MDX files
- [ ] Detect relative imports in code blocks
- [ ] Resolve and load file contents
- [ ] Inject file data into MDX
- [ ] Handle file watching for development

**Files to create**:
- Create: `apps/docs/plugins/playground-file-loader.mjs` (or similar)

**Note**: This is optional and can be added later if Option B works well.

## Phase 4: Polish & Additional Features

### 4.1 Copy Current Tab
**Priority**: Medium | **Effort**: Low | **Dependencies**: 3.3

**Tasks**:
- [ ] Update copy button to copy active tab's code
- [ ] Show which file is being copied in toast
- [ ] Handle single-file vs multi-file scenarios

### 4.2 CodeSandbox Integration Polish
**Priority**: Medium | **Effort**: Medium | **Dependencies**: 2.2, 3.4

**Tasks**:
- [ ] Handle multiple files in CodeSandbox
- [ ] Proper file structure in CodeSandbox
- [ ] Include all dependencies
- [ ] Test with various code examples

### 4.3 Additional UX Improvements
**Priority**: Low | **Effort**: Varies

**Potential improvements**:
- [ ] Keyboard shortcuts (beyond Cmd+S for format)
- [ ] Better mobile experience
- [ ] Loading states
- [ ] Code diff visualization (show what changed)
- [ ] Undo/redo functionality

## Implementation Order

### Sprint 1: Foundation
1. ✅ Improved error display (1.1)
2. ✅ Store original code (1.2)
3. ✅ Research syntax highlighting options (2.1 research)

### Sprint 2: Controls & Syntax
1. ✅ Implement better syntax highlighting (2.1)
2. ✅ Enhanced toolbar with reset and CodeSandbox (2.2)

### Sprint 3: Multiple Files (Part 1)
1. ✅ Design and implement file structure API (3.2)
2. ✅ Create file tabs UI (3.3)
3. ✅ Basic multi-file support (manual file definition)

### Sprint 4: Multiple Files (Part 2)
1. ✅ Import resolution (3.4)
2. ✅ Code transformation for multi-file execution
3. ✅ Testing and bug fixes

### Sprint 5: Polish
1. ✅ Copy current tab (4.1)
2. ✅ CodeSandbox multi-file support (4.2)
3. ✅ Additional UX improvements (4.3)

## Technical Decisions Needed

1. **Syntax Highlighting**: `react-simple-code-editor` vs improved `react-live`?
2. **File Resolution**: Build-time vs runtime vs hybrid?
3. **Import Handling**: Transform code vs custom module system?
4. **CodeSandbox**: Use API vs form submission?

## Testing Strategy

- [ ] Test with simple single-file examples
- [ ] Test with complex multi-file examples
- [ ] Test error handling (syntax errors, missing imports, etc.)
- [ ] Test CodeSandbox integration with various code structures
- [ ] Test mobile responsiveness
- [ ] Test accessibility (keyboard navigation, screen readers)
- [ ] Test performance with large code examples

## Dependencies to Add

Potential new dependencies:
- `react-simple-code-editor` (if chosen for syntax highlighting)
- `prismjs` (if using react-simple-code-editor)
- `@babel/parser` (for import parsing)
- `@babel/traverse` (for AST traversal)

## Files Structure

```
apps/docs/src/theme/Playground/
├── index.tsx (main component)
├── PlaygroundError.tsx (new)
├── PlaygroundToolbar.tsx (new)
├── FileTabs.tsx (new)
├── CodeEditor.tsx (new, if needed)
├── utils/
│   ├── codesandbox.ts (new)
│   ├── importResolver.ts (new)
│   └── codeTransformer.ts (new)
├── styles.module.css
├── PLAYGROUND_IMPLEMENTATION.md
├── MUI_COMPARISON.md
└── IMPLEMENTATION_PLAN.md (this file)
```

## Notes

- Start with Phase 1 (error handling) as it's foundational
- Phase 2 can be done in parallel with Phase 3 planning
- Phase 3 is the most complex - break into smaller milestones
- Test each phase thoroughly before moving to next
- Consider user feedback after each phase
