Add static className support to the currently open CDS web component.

## Steps

1. **Identify the component** - Read the currently open file and identify the component name and root element.

2. **Add the static className constant** at the top of the file (after imports):

   ```tsx
   const COMPONENT_STATIC_CLASSNAME = 'cds-{ComponentName}';
   ```

3. **Apply to the root element** using `cx()`:
   - Import `cx` from `../cx` if not already imported
   - Add `COMPONENT_STATIC_CLASSNAME` as the FIRST argument in the `cx()` call on the root element's `className` prop
   - Ensure the user-provided `className` prop is the LAST argument in `cx()`

4. **Ensure className prop support** - The component props should include `className?: string` if not already present.

5. **Add test coverage** - Create or update the test file with:

   ```tsx
   it('applies static className to root element', () => {
     render(<ComponentName testID="test" />);
     const element = screen.getByTestId('test');
     expect(element.className).toContain('cds-{ComponentName}');
   });

   it('merges custom className with static className', () => {
     render(<ComponentName testID="test" className="custom-class" />);
     const element = screen.getByTestId('test');
     expect(element.className).toContain('cds-{ComponentName}');
     expect(element.className).toContain('custom-class');
   });
   ```

6. **Run the tests** for the specific component to verify the changes work.

## Reference Implementation

See `packages/web/src/buttons/Button.tsx` for the canonical example:

- Line 18: `const COMPONENT_STATIC_CLASSNAME = 'cds-Button';`
- Lines 241-252: Applied in `cx()` on the root `Pressable` element

## Root Element Guidance

The root element is the outermost element the component renders:

- For components wrapping `Box`/`Pressable`/`HStack`/etc. → that wrapper is the root
- For polymorphic components → the element from the `as` prop or default element
- For conditional rendering → identify the common wrapper or apply to both branches

## Naming Convention

- PascalCase components: `cds-{ComponentName}` (e.g., `cds-TextInput`, `cds-Modal`)
- Already kebab-case in codebase: `cds-table-header`, `cds-select-option` (follow existing pattern if updating related components)
