# Migration to react-runner

## Overview

Switching from `react-live` to `react-runner` to properly support multiple files without combining them, following Material-UI's approach.

## Key Differences

### react-live (Current)
- Requires combining files into single code string
- Parsing issues with combined code
- Limited import resolution support
- Uses `LiveProvider`, `LiveEditor`, `LivePreview`

### react-runner (Target)
- No file combination needed
- Scope-based import resolution via `scope.import`
- Better TypeScript support
- Uses `useRunner` hook or `Runner` component
- Supports `importCode` for virtual modules

## Migration Steps

1. **Install react-runner**
   ```bash
   yarn add react-runner
   ```

2. **Create ReactRunner wrapper component**
   - Similar to Material-UI's ReactRunner.tsx
   - Handles scope creation
   - Manages error state
   - Provides debouncing

3. **Update Playground component**
   - Replace `LiveProvider` with `useRunner` hook
   - Create scope with `import` object for file modules
   - Parse exports from files and add to `scope.import`
   - Pass only main file to `useRunner`

4. **Update editor component**
   - Replace `LiveEditor` with custom editor or keep using it separately
   - Or use a different editor component

5. **Update error handling**
   - Use `useRunner`'s error return value
   - Update `PlaygroundError` component

6. **Update scope creation**
   - Parse exports from all files
   - Add to `scope.import` using file paths as keys
   - Use `importCode` for virtual modules

## Implementation Plan

### Phase 1: Install and Setup
- [ ] Install react-runner
- [ ] Create ReactRunner wrapper component
- [ ] Test basic single-file execution

### Phase 2: Multi-file Support
- [ ] Parse exports from files
- [ ] Create scope.import with file modules
- [ ] Test multi-file execution

### Phase 3: Integration
- [ ] Update Playground component
- [ ] Update editor (keep LiveEditor or replace)
- [ ] Update error handling
- [ ] Test all features

### Phase 4: Cleanup
- [ ] Remove react-live dependencies (or keep for editor)
- [ ] Update documentation
- [ ] Remove file combination code
