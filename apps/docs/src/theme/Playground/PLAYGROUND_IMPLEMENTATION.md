# Playground Implementation Documentation

## Overview

The CDS documentation playground uses `react-live` to provide an interactive code editing and preview experience. This document details how the playground works, including code rendering, syntax highlighting, error handling, and additional features.

## Core Library: `react-live`

- **Version**: `^4.1.8`
- **Key Components**:
  - `LiveProvider`: Wraps the playground and manages code execution
  - `LiveEditor`: Code editor component with syntax highlighting
  - `LivePreview`: Renders the executed code output
  - `LiveError`: Displays runtime/compilation errors

## Code Rendering and Execution

### Code Transformation

1. **Transformation Process**:
   - `react-live` transforms JSX/TSX code in the browser
   - Uses Babel transforms (handled internally by `react-live`)
   - No custom `transformCode` prop is used; relies on default transformation

2. **Execution Modes**:
   - **Inline mode** (default): Code is automatically wrapped in a render function
   - **No-inline mode**: Code must explicitly call `render()` to display output
   - Controlled via the `noInline` prop:
     - Regular `Playground`: Set via `metastring` prop (e.g., `noInline` in metastring)
     - `ShareablePlayground`: Always uses `noInline={true}`

3. **Scope/Context**:
   - `ReactLiveScope` provides all available imports/components
   - Includes CDS components, hooks, utilities, and sample data
   - `ShareablePlayground` explicitly passes `scope={ReactLiveScope}`
   - Regular `Playground` inherits scope from parent context

### TypeScript Support

- `ShareablePlayground` explicitly enables TypeScript:
  - `enableTypeScript={true}`
  - `language="tsx"`
- Regular `Playground` relies on default `react-live` behavior

## Syntax Highlighting

### Theme System

1. **Theme Source**:
   - Uses `prism-react-renderer` themes
   - Theme is determined by `usePlaygroundTheme()` hook:
     ```typescript
     const prismTheme = playgroundColorScheme === 'dark' 
       ? prismThemes.nightOwl 
       : prismThemes.github;
     ```
   - Theme is passed to `LiveProvider` via `theme={prismTheme}` prop

2. **Editor Styling**:
   - Custom CSS in `styles.module.css`:
     - Monospace font family (`var(--fontFamilyMono-label2)`)
     - Custom padding and colors
     - Transparent background
     - Thin scrollbar styling

3. **Implementation**:
   - `LiveEditor` component uses Prism for syntax highlighting
   - Theme is applied through `LiveProvider`'s `theme` prop
   - Highlighting happens automatically based on code content

## Error Handling

### Runtime Errors

1. **Compilation/Runtime Errors**:
   - `LiveError` component displays errors from code compilation or execution
   - Rendered alongside `LivePreview` component
   - Shows syntax errors, type errors, and runtime exceptions

2. **React Error Boundaries**:
   - `ErrorBoundary` from Docusaurus wraps `LivePreview`
   - Fallback component: `ErrorBoundaryErrorMessageFallback`
   - Prevents entire page crashes from component errors
   - Implementation:
     ```tsx
     <ErrorBoundary fallback={renderErrorFallback}>
       <LivePreview />
     </ErrorBoundary>
     <LiveError />
     ```

3. **Browser-Only Rendering**:
   - `BrowserOnly` wrapper ensures client-side only rendering
   - Prevents SSR issues with code execution
   - Fallback shows "Loading..." during SSR

## Additional Features

### Code Formatting

- **Prettier Integration**:
  - Keyboard shortcut: `Ctrl/Cmd + S` formats code
  - Uses Prettier standalone with TypeScript/ESTree plugins
  - Configuration:
    ```typescript
    {
      parser: 'typescript',
      plugins: [estreePlugin, typescriptPlugin],
      arrowParens: 'always',
      bracketSameLine: false,
      jsxSingleQuote: false,
      printWidth: 100,
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'all',
      useTabs: false,
    }
    ```

### Code Management

1. **Copy to Clipboard**:
   - Button to copy current code
   - Uses `navigator.clipboard.writeText()`
   - Toast notification on success/failure

2. **Collapsible Editor** (Regular Playground):
   - Editor can be collapsed/expanded
   - State controlled by `collapsed` state
   - Default state: collapsed (unless `editorStartsExpanded` is true)

3. **Shareable URLs** (ShareablePlayground):
   - Code can be shared via URL
   - Uses `lz-string` for compression
   - Code stored in URL query parameter `?code=...`
   - Debounced URL updates (500ms)

### Theming Integration

- Integrated with CDS theme system
- Supports light/dark mode
- Theme-aware syntax highlighting
- Uses `ThemeProvider` from CDS for component theming
- Separate theme context for playground vs docs

## Component Comparison

### Playground vs ShareablePlayground

| Feature | Playground | ShareablePlayground |
|---------|-----------|---------------------|
| **Scope** | Inherited from context | Explicitly set to `ReactLiveScope` |
| **TypeScript** | Not explicitly enabled | `enableTypeScript={true}` |
| **Language** | Not specified | `language="tsx"` |
| **noInline** | Configurable via metastring | Always `true` |
| **Sharing** | No | Yes (URL compression) |
| **Editor** | Collapsible | Always visible |
| **Use Case** | Inline examples in docs | Standalone playground page |

### Key Files

- **Regular Playground**: `apps/docs/src/theme/Playground/index.tsx`
- **Shareable Playground**: `apps/docs/src/components/page/ShareablePlayground/index.tsx`
- **React Live Scope**: `apps/docs/src/theme/ReactLiveScope/index.tsx`
- **Theme Context**: `apps/docs/src/theme/Layout/Provider/UnifiedThemeContext.tsx`
- **Styles**: `apps/docs/src/theme/Playground/styles.module.css`

## Dependencies

### Core Dependencies

- `react-live`: `^4.1.8` - Live code editing library
- `prism-react-renderer`: `^2.4.1` - Syntax highlighting themes
- `prettier`: `^3.6.2` - Code formatting (standalone with plugins)
- `lz-string`: `^1.5.0` - URL compression for ShareablePlayground

### Prettier Plugins

- `prettier/plugins/estree.js` - ESTree parser support
- `prettier/plugins/typescript.js` - TypeScript support

## Usage Examples

### Regular Playground (in MDX)

```mdx
```jsx live
<Button>Click me</Button>
```

```jsx live noInline
const MyComponent = () => {
  return <Button>Click me</Button>;
};
render(<MyComponent />);
```
```

### ShareablePlayground (in React)

```tsx
<ShareablePlayground defaultInitialCode={exampleCode} />
```

## Implementation Details

### Code State Management

- Code stored in React state (`useState`)
- Also stored in ref (`useRef`) for access in event handlers
- Code changes trigger re-render and re-execution

### Preview Rendering

- `LivePreview` renders the transformed code
- Wrapped in `ErrorBoundary` for error isolation
- Wrapped in `BrowserOnly` for SSR safety
- Styled with CDS components (VStack, etc.)

### Editor Component

- `LiveEditor` provides the code editing interface
- Uses Prism for syntax highlighting
- Custom styling via CSS module
- `onChange` handler updates code state

## Notes

- The playground is client-side only (no SSR support for code execution)
- All CDS components and utilities are available in `ReactLiveScope`
- Theme switching updates syntax highlighting automatically
- Error boundaries prevent playground errors from crashing the page
- Prettier formatting is optional but recommended for code examples
