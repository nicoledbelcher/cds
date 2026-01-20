# Questions for Material-UI Team about Multiple Files Support

## Context

We're implementing multiple files support in our documentation playground (similar to Material-UI's approach), but we're encountering parsing errors when combining multiple files for execution. We're currently using `react-live`, while Material-UI uses `react-runner`.

## Key Questions

### 1. Library Choice
- **Why did you choose `react-runner` over `react-live`?**
- What were the key limitations of `react-live` that led to this decision?
- Does `react-runner` have better support for multiple files/modules?

### 2. Multiple Files Architecture
- **How do you handle multiple files in your playground?**
  - Do you combine them into a single code string, or handle them separately?
  - How do you resolve imports between files?
  - Do you use a virtual module system?

### 3. Code Combination Strategy
- **When you have multiple files (e.g., `App.tsx`, `Button.tsx`, `utils.ts`), how do you combine them for execution?**
  - Do you concatenate them?
  - Do you wrap them in an IIFE or module wrapper?
  - Do you transform imports to scope access?

### 4. Import Resolution
- **How does your system handle relative imports like `import { Button } from './Button'`?**
  - Do you parse and transform imports?
  - Do you use a scope-based system where imports are pre-resolved?
  - How do you handle default vs named exports?

### 5. Parsing Issues
- **Have you encountered issues with react-live's parser when combining code?**
  - Specifically, issues with destructured function parameters?
  - Issues with function declarations in combined code?
  - How did you solve them?

### 6. Code Transformation
- **Do you transform the code before passing it to react-runner?**
  - Remove/transform imports?
  - Transform destructured parameters?
  - Add any wrappers or helpers?

### 7. Scope Management
- **How do you manage scope for multiple files?**
  - Do you create a combined scope with all file exports?
  - How do you handle naming conflicts?
  - Do you use a module map?

### 8. Error Handling
- **How does react-runner handle syntax errors in combined code?**
  - Better error messages than react-live?
  - More robust parsing?

### 9. Performance
- **How does react-runner perform with multiple files?**
  - Any performance considerations?
  - Debouncing strategies?

### 10. Migration Path
- **If we wanted to switch from react-live to react-runner, what would be the main considerations?**
  - Breaking changes?
  - API differences?
  - Migration effort?

## Our Current Issue

We're getting this error when combining files:
```
SyntaxError: Unexpected token, expected "," (18:1)
```

The error occurs at line 18, which is:
```javascript
function CounterDisplay(props) {
  const { count } = props;
```

Even after transforming destructured parameters (`{ count }` → `props`), react-live's parser still fails. This suggests react-live might not be designed for combining multiple files.

## Our Current Approach

1. Combine all files into a single code string
2. Remove imports and exports
3. Transform destructured parameters to regular parameters
4. Pass combined code to react-live

This works for simple cases but fails with more complex code structures.

## Potential Solutions We're Considering

1. **Switch to react-runner** (like Material-UI)
2. **Use a proper module system** instead of combining files
3. **Wrap combined code in an IIFE** to create proper scope
4. **Use AST transformation** instead of regex-based transformation

## Contact

If you have any insights or can point us to relevant code/documentation, that would be greatly appreciated!
