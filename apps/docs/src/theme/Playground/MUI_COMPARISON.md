# MUI Playground vs CDS Playground Comparison

This document compares Material-UI's playground implementation with our current CDS playground to identify key differences and potential improvements.

## Key Differences Summary

| Feature | MUI | CDS | Notes |
|---------|-----|-----|-------|
| **Core Library** | `react-runner` | `react-live` | Different approaches to live code execution |
| **Code Editor** | `react-simple-code-editor` | `LiveEditor` (from react-live) | MUI has more control over editor |
| **Syntax Highlighting** | Prism.js via `@mui/internal-markdown/prism` | Prism via `react-live` | User reports MUI's works better |
| **Multiple Files** | ✅ Yes (relative imports) | ❌ No | MUI auto-detects and shows as tabs |
| **Preview Snippets** | ✅ Yes (`.tsx.preview` files) | ❌ No | MUI shows simplified JSX when code closed |
| **Dynamic Code Visibility** | ✅ Yes (preview vs full) | ⚠️ Partial (collapsible) | MUI shows preview snippet, we just collapse |
| **Error Display** | ✅ Advanced (debounced, positioned) | ⚠️ Basic (`LiveError`) | MUI has better UX for errors |
| **JS/TS Toggle** | ✅ Yes | ❌ No | MUI can switch between JS/TS variants |
| **External Tools** | ✅ StackBlitz, CodeSandbox | ❌ No | MUI integrates with online IDEs |
| **Reset Functionality** | ✅ Yes | ❌ No | MUI can reset to original code |
| **Import System** | ✅ Relative imports | ⚠️ Global scope only | MUI supports file-based imports |

## Detailed Feature Comparison

### 1. Multiple Files Support

#### MUI Approach
- **Automatic Detection**: Scans for relative imports (`./` or `../`)
- **File Resolution**: Automatically resolves file extensions (`.js`, `.jsx`, `.ts`, `.tsx`)
- **Tab Interface**: Shows each file as a separate tab
- **Recursive Processing**: Handles nested relative imports
- **Example Structure**:
  ```typescript
  // Main file: Example.tsx
  import { data } from './data';
  import { helper } from './utils/helper';
  
  // Automatically creates tabs for:
  // - Example.tsx (editable)
  // - ./data.ts (read-only)
  // - ./utils/helper.ts (read-only)
  ```

#### CDS Current Approach
- **Global Scope Only**: All components available via `ReactLiveScope`
- **No File System**: No concept of multiple files or relative imports
- **Single Code Block**: Only one code editor per playground instance

#### Why This Matters
- **Better Organization**: Complex examples can be split into logical files
- **Real-world Patterns**: Matches how developers actually structure code
- **Reusability**: Shared utilities can be imported across examples
- **Clarity**: Separates concerns (data, utilities, main component)

#### Implementation Challenge
- Without showing imports, it's unclear to users how multiple files would work
- Would need to either:
  1. Show import statements (like MUI does)
  2. Create a different abstraction (e.g., "snippets" or "modules")
  3. Use a file tree UI (more complex)

### 2. Preview Snippets / Dynamic Code Visibility

#### MUI Approach
- **Preview Generation**: Babel plugin extracts simplified JSX (max 16 lines)
- **Auto-generated**: Creates `.tsx.preview` files during build
- **Smart Extraction**: Removes wrapper components, de-indents code
- **Two States**:
  - **Closed**: Shows preview snippet (simplified JSX)
  - **Open**: Shows full source code with all files
- **Example**:
  ```tsx
  // Full code (50+ lines with logic, hooks, etc.)
  // Preview shows just:
  <ToggleButtonGroup value={alignment} onChange={handleChange}>
    <ToggleButton value="web">Web</ToggleButton>
    <ToggleButton value="android">Android</ToggleButton>
  </ToggleButtonGroup>
  ```

#### CDS Current Approach
- **Binary State**: Code is either visible (expanded) or hidden (collapsed)
- **No Preview**: When collapsed, nothing is shown
- **All or Nothing**: Can't show a simplified version

#### Why This Matters
- **Better UX**: Users can see what the example does without expanding
- **Faster Scanning**: Quick preview of component usage
- **Progressive Disclosure**: Preview → Full code → Multiple files
- **Visual Context**: Preview gives immediate visual feedback

### 3. Syntax Highlighting Quality

#### MUI Approach
- **Library**: `react-simple-code-editor` + custom Prism integration
- **Control**: Full control over Prism configuration
- **Custom Integration**: Uses `@mui/internal-markdown/prism` wrapper
- **Language Support**: Explicit JSX/TSX language modes

#### CDS Current Approach
- **Library**: `LiveEditor` from `react-live` (uses Prism internally)
- **Limited Control**: Depends on `react-live`'s Prism integration
- **Theme**: Uses `prism-react-renderer` themes (nightOwl/github)
- **Language**: Inherited from `react-live` configuration

#### Potential Issues
- `react-live`'s Prism integration might be outdated or less configurable
- Less control over highlighting rules
- May not support latest Prism features
- Theme application might be less precise

#### Possible Solutions
1. **Switch to `react-simple-code-editor`**: More control, better highlighting
2. **Custom Prism Integration**: Use Prism directly with `LiveEditor` replacement
3. **Update react-live**: Check if newer versions have better Prism support
4. **Hybrid Approach**: Use `react-simple-code-editor` for display, `react-live` for execution

### 4. Error Handling

#### MUI Approach
- **Debounced Errors**: 300ms debounce to prevent flickering
- **Positioned Display**: Error shown as Alert banner above editor
- **Visual Design**: Material-UI Alert component with error styling
- **Error Types**: Handles syntax, type, runtime, and import errors
- **State Management**: Separate error state with debouncing logic

#### CDS Current Approach
- **Immediate Display**: `LiveError` shows errors immediately
- **Component-based**: Uses `LiveError` component from `react-live`
- **Position**: Rendered alongside preview (below or above)
- **Styling**: Inherits from `react-live` default styling

#### Improvements Needed
- Debouncing to prevent error flicker during typing
- Better visual design (CDS Alert component)
- More precise error positioning
- Better error message formatting

### 5. Additional Features MUI Has

#### JS/TS Toggle
- Can switch between JavaScript and TypeScript versions
- Auto-generated JS from TS during build
- Users can see both variants

#### External Tool Integration
- **StackBlitz**: Opens demo in StackBlitz
- **CodeSandbox**: Opens demo in CodeSandbox
- Creates full project with dependencies

#### Reset Functionality
- Button to reset code to original state
- Clears any edits made in editor
- Useful for experimentation

#### Comprehensive Toolbar
- More controls (copy, share, reset, external tools)
- Better keyboard navigation
- Accessibility features
- Context menu with additional options

## Implementation Recommendations

### High Priority

1. **Improve Syntax Highlighting**
   - Evaluate switching to `react-simple-code-editor`
   - Or enhance Prism integration with `react-live`
   - Test with various code examples to ensure quality

2. **Add Preview Snippets**
   - Create Babel plugin to extract preview JSX
   - Generate `.preview` files during build
   - Show preview when code is collapsed
   - This provides immediate visual context

3. **Better Error Display**
   - Add debouncing (300ms)
   - Use CDS Alert component for errors
   - Better positioning and styling
   - Improve error message formatting

### Medium Priority

4. **Multiple Files Support**
   - If we want this, need to decide on approach:
     - Show imports (like MUI) - more transparent
     - Hide imports (current scope approach) - simpler but less clear
   - Would require significant refactoring
   - Consider if it's worth the complexity

5. **Reset Functionality**
   - Add button to reset code to original
   - Store original code in ref/state
   - Simple to implement, good UX

### Low Priority

6. **JS/TS Toggle**
   - Only if we generate JS versions
   - Requires build-time processing
   - May not be necessary if TS is preferred

7. **External Tool Integration**
   - Nice to have but not essential
   - Requires API integration
   - Lower priority for internal docs

## Technical Considerations

### Library Choices

**Current: `react-live`**
- Pros: Simple, integrated solution
- Cons: Less control, potentially outdated Prism

**Alternative: `react-runner` (MUI's choice)**
- Pros: More control, better error handling
- Cons: Different API, would require refactoring

**Hybrid: `react-simple-code-editor` + `react-live`**
- Pros: Better editor, keep execution
- Cons: More complex integration

### Build-Time vs Runtime

**MUI**: Heavy build-time processing
- Preview generation
- JS/TS transpilation
- File resolution

**CDS**: Mostly runtime
- Code execution in browser
- Minimal build processing
- Simpler pipeline

### File System Abstraction

**Challenge**: How to support multiple files without showing imports?

**Options**:
1. **Show imports** (MUI approach) - transparent but requires file system
2. **Module system** - abstract files as "modules" in UI
3. **Snippet system** - treat as code snippets, not files
4. **Keep single file** - accept limitation, keep it simple

## Questions to Consider

1. **Do we need multiple files?**
   - Are our examples complex enough to warrant it?
   - Would it improve or complicate the docs?

2. **Is preview snippet generation worth it?**
   - Requires build-time processing
   - But provides significant UX improvement

3. **Should we switch from `react-live`?**
   - Would give more control
   - But requires significant refactoring

4. **How important is syntax highlighting quality?**
   - If users report issues, prioritize fix
   - Otherwise, may be lower priority

## Additional Observations

### Build-Time Processing

**MUI**: Heavy build-time processing
- Preview file generation (Babel plugin)
- TypeScript → JavaScript transpilation
- File dependency resolution
- Markdown preprocessing

**CDS**: Minimal build-time processing
- Code examples embedded directly in MDX
- Runtime code execution
- Simpler pipeline, faster builds

**Trade-off**: MUI's approach is more complex but provides better UX. Our approach is simpler but less feature-rich.

### Code Execution Library

**MUI uses `react-runner`**:
- Uses Babel Standalone for transpilation
- More control over execution context
- Better error handling
- Supports import resolution

**CDS uses `react-live`**:
- Integrated solution (editor + execution)
- Less control but simpler
- May have limitations with complex code

### Isolation Options

**MUI**: Supports iframe rendering (`iframe` option)
- Complete isolation
- Useful for demos that might conflict with page styles
- More secure execution context

**CDS**: No iframe support
- Code runs in same context as page
- Simpler but less isolated

### AI Integration

**MUI**: Has AI chat integration (`OpenMuiChat`)
- Pre-loads demo code into chat
- Allows asking questions about examples
- Modern feature for developer experience

**CDS**: No AI integration
- Could be future enhancement
- Lower priority

### Keyboard Navigation

**MUI**: Comprehensive keyboard support
- Arrow keys navigate toolbar
- Home/End jump to first/last
- Tab order management
- Better accessibility

**CDS**: Basic keyboard support
- Standard tab navigation
- Could be enhanced

### Code State Management

**MUI**: 
- Tracks original vs edited code
- Can detect if code has changed
- Enables reset functionality
- Optimizes rendering (uses bundled component if unchanged)

**CDS**:
- Tracks current code state
- No original code tracking
- Always uses live execution
- Could optimize by detecting unchanged code

## Summary

**Key Missing Features**:
1. ✅ Preview snippets (high value, medium effort)
2. ✅ Better syntax highlighting (high value, low-medium effort)
3. ✅ Improved error display (medium value, low effort)
4. ⚠️ Multiple files (high value, high effort - need to decide on approach)
5. ✅ Reset functionality (medium value, low effort)

**Other Notable Differences**:
- MUI has more sophisticated build pipeline
- MUI uses different execution library (`react-runner` vs `react-live`)
- MUI supports iframe isolation
- MUI has AI chat integration
- MUI has better keyboard navigation
- MUI optimizes rendering (uses pre-rendered component when code unchanged)

**Recommended Priority**:
1. Fix syntax highlighting (if users are reporting issues)
2. Add preview snippets
3. Improve error display
4. Add reset functionality
5. Consider multiple files (if examples become complex enough)
6. Evaluate `react-runner` vs `react-live` (if we need more control)
