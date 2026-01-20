# Playground Improvements Progress Tracker

This document tracks the progress of playground improvements over time.

## Goals Overview

1. ✅ Support multiple files
2. ⏳ More menu buttons (reset code, copy current page, open in CodeSandbox)
3. ⏳ Better syntax highlighting
4. ✅ Improved error display
5. ⏳ Other improvements

## Phase 1: Foundation & Error Handling ✅ COMPLETE

**Status**: ✅ Completed

### Completed Tasks

- [x] **Improved Error Display** (2024-12-XX)
  - Created `PlaygroundError.tsx` component using CDS Banner
  - Added 300ms debouncing to prevent error flicker
  - Positioned error absolutely at top of editor with z-index 100
  - Error displays inline between preview and editor (or as overlay)
  - Uses `withLive` HOC to access react-live error context
  - Formatted error messages (removes stack traces, limits length)
  - Added accessibility attributes (`role="alert"`, `aria-live="polite"`)

- [x] **Store Original Code for Reset** (2024-12-XX)
  - Added `originalCodeRef` to store initial code state
  - Ready for reset functionality in Phase 2

### Files Created/Modified

**Created:**
- `apps/docs/src/theme/Playground/PlaygroundError.tsx`

**Modified:**
- `apps/docs/src/theme/Playground/index.tsx`
- `apps/docs/src/theme/Playground/styles.module.css`
- `apps/docs/src/components/page/ShareablePlayground/index.tsx`
- `apps/docs/src/components/page/ShareablePlayground/styles.module.css`

## Phase 2: Enhanced Controls & Syntax Highlighting ⏳ IN PROGRESS

**Status**: ⏳ In Progress

### Phase 2.2: Enhanced Toolbar/Menu ✅ COMPLETE

**Status**: ✅ Completed (2024-12-XX)

**Completed Tasks:**
- [x] Created `PlaygroundToolbar` component with reset, copy, and CodeSandbox buttons
- [x] Added reset functionality (uses `originalCodeRef` from Phase 1)
- [x] Enhanced copy functionality (already existed, now integrated into toolbar)
- [x] Added CodeSandbox integration
  - Created `utils/codesandbox.ts` with CodeSandbox API integration
  - Extracts dependencies from code imports
  - Creates proper file structure for CodeSandbox
  - Opens CodeSandbox in new tab with pre-filled code
- [x] Integrated toolbar into both `Playground` and `ShareablePlayground`
- [x] Added proper icons and accessibility labels

**Files Created/Modified:**

**Created:**
- `apps/docs/src/theme/Playground/PlaygroundToolbar.tsx`
- `apps/docs/src/theme/Playground/utils/codesandbox.ts`

**Modified:**
- `apps/docs/src/theme/Playground/index.tsx`
- `apps/docs/src/components/page/ShareablePlayground/index.tsx`

### Phase 2.1: Better Syntax Highlighting

**Status**: ⏳ Pending

**Tasks:**
- [ ] Research `react-simple-code-editor` vs improving `react-live` Prism integration
- [ ] Test both approaches with various code examples
- [ ] Check if `react-live` v4.1.8 has better Prism support
- [ ] Decide on approach (Option A: react-simple-code-editor or Option B: improve react-live)
- [ ] Implement chosen solution
- [ ] Test with TSX/JSX highlighting
- [ ] Ensure proper language detection

**Decision Points:**
- Quality of highlighting
- Maintenance burden
- Integration complexity

### Phase 2.2: Enhanced Toolbar/Menu

**Status**: ⏳ Pending

**Tasks:**
- [ ] Create `PlaygroundToolbar` component
- [ ] Add "Reset code" button (uses `originalCodeRef` from Phase 1)
- [ ] Enhance "Copy code" to copy current tab (for future multi-file support)
- [ ] Add "Open in CodeSandbox" button
- [ ] Research CodeSandbox API for creating projects
- [ ] Create function to format code for CodeSandbox
- [ ] Handle dependencies (extract from imports or use defaults)
- [ ] Use CDS Dropdown/Menu for additional options if needed
- [ ] Add proper icons and accessibility labels

**CodeSandbox Integration:**
- Research CodeSandbox API/define system
- Format code with proper structure (package.json, dependencies, etc.)
- Handle React, TypeScript, and CDS dependencies

## Phase 3: Multiple Files Support ⏳ IN PROGRESS

**Status**: ⏳ In Progress

### Phase 3.2: File Structure & API Design ✅ COMPLETE

**Status**: ✅ Completed (2024-12-XX)

**Completed Tasks:**
- [x] Created types for multiple files support (`types.ts`)
- [x] Defined `PlaygroundFiles` type (Record<string, string> or PlaygroundFile[])
- [x] Created normalization utilities
- [x] Updated `PlaygroundProps` to accept `files` prop

### Phase 3.3: File Tabs UI ✅ COMPLETE

**Status**: ✅ Completed (2024-12-XX)

**Completed Tasks:**
- [x] Created `FileTabs` component using CDS Tabs
- [x] Display file names as tabs
- [x] Show active file content in editor
- [x] Only main file is editable, others read-only
- [x] Handle tab switching
- [x] Show file path/name clearly
- [x] Read-only indicator (lock icon) for non-editable files
- [x] Integrated into Playground component

**Files Created:**
- `apps/docs/src/theme/Playground/types.ts`
- `apps/docs/src/theme/Playground/FileTabs.tsx`

**Files Modified:**
- `apps/docs/src/theme/Playground/index.tsx`

### Phase 3.4: Import Resolution & Code Execution ⏳ IN PROGRESS

**Status**: ⏳ In Progress

**Completed Tasks:**
- [x] Created import parser (`utils/importResolver.ts`)
- [x] Created code transformer utilities (`utils/codeTransformer.ts`)
- [x] Basic file resolution (finds files by import path)
- [x] Combined scope creation (adds file modules to scope)
- [x] Main file execution (uses main file for execution when multiple files present)

**Remaining Tasks:**
- [ ] Full import transformation (replace imports with scope access)
- [ ] Export extraction from imported files
- [ ] Nested import handling
- [ ] Error handling for missing imports
- [ ] Test with various import patterns

### Phase 3.1: Design Decision

**Status**: ⏳ Pending

**Options:**
- Option A: Build-Time File Resolution (Like MUI) - Complex, requires build changes
- Option B: Runtime File Resolution with Metadata - Simpler, manual file definition
- Option C: Hybrid - Build-time detection, runtime resolution

**Recommendation**: Start with Option B, upgrade to Option A if needed

### Phase 3.2: File Structure & API Design

**Status**: ⏳ Pending

**Tasks:**
- [ ] Design API for multiple files (props/metadata)
- [ ] Define file format structure
- [ ] Create TypeScript types

### Phase 3.3: File Tabs UI

**Status**: ⏳ Pending

**Tasks:**
- [ ] Create `FileTabs` component using CDS Tabs
- [ ] Display file names as tabs
- [ ] Show active file content in editor
- [ ] Only main file is editable, others read-only
- [ ] Handle tab switching
- [ ] Show file path/name clearly

### Phase 3.4: Import Resolution & Code Execution

**Status**: ⏳ Pending

**Tasks:**
- [ ] Parse imports from main file
- [ ] Resolve relative imports to file paths
- [ ] Create module map for `react-live` scope
- [ ] Transform imports in code to use scope
- [ ] Handle nested imports
- [ ] Update `LiveProvider` scope with file modules

## Phase 4: Polish & Additional Features ⏳ PENDING

**Status**: ⏳ Pending

### Tasks

- [ ] Copy current tab functionality (for multi-file)
- [ ] CodeSandbox multi-file support
- [ ] Additional UX improvements (keyboard shortcuts, mobile, etc.)

## Notes

- Error display completed and tested
- Original code storage ready for reset button
- Toolbar with reset, copy, and CodeSandbox completed
- Multiple files support: Basic implementation complete (file tabs, editing, scope)
- Import resolution: Basic structure in place, needs full transformation implementation

## Timeline

- **2024-12-XX**: Phase 1 completed (Error handling + Original code storage)
- **2024-12-XX**: Phase 2.2 completed (Enhanced Toolbar)
- **2024-12-XX**: Phase 3.2-3.3 completed (File structure + File tabs UI)
- **2024-12-XX**: Phase 3.4 in progress (Import resolution - basic structure done)
