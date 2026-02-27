import fs from 'fs';
import path from 'path';

import { TODO_PREFIX } from '../../../utils/constants';
import transformer from '../button-variant-mapping';
import { runTransform } from '../test-utils';

function readFixtureFile(fileName: string): string {
  const fixturePath = path.resolve(
    process.cwd(),
    'src/v8-to-v9/transforms/__fixtures__/button-variant-mapping',
    fileName,
  );
  return fs.readFileSync(fixturePath, 'utf8');
}

function normalizeCode(code: string): string {
  return code.replace(/\s+/g, '').replace(/"/g, "'");
}

describe('button-variant-mapping', () => {
  it('maps static literal variants for Button and IconButton', () => {
    const source = `
      import { Button, IconButton } from '@coinbase/cds-web';

      export function Example() {
        return (
          <>
            <Button variant="tertiary">Save</Button>
            <IconButton variant="foregroundMuted" name="close" />
            <Button variant={'foregroundMuted'}>Dismiss</Button>
            <IconButton variant={"tertiary"} name="backArrow" />
          </>
        );
      }
    `;

    const { output, entries } = runTransform(transformer, source);

    expect(output).toContain('variant="inverse"');
    expect(output).toContain('variant="secondary"');
    expect(entries.some((entry) => entry.level === 'SUCCESS')).toBe(true);
  });

  it('supports imported aliases', () => {
    const source = `
      import { Button as CdsButton, IconButton as CdsIconButton } from '@coinbase/cds-web';

      export const Example = () => (
        <>
          <CdsButton variant="tertiary">Save</CdsButton>
          <CdsIconButton variant="foregroundMuted" name="close" />
        </>
      );
    `;

    const { output } = runTransform(transformer, source);

    expect(output).toContain('<CdsButton variant="inverse">');
    expect(output).toContain('<CdsIconButton variant="secondary" name="close" />');
  });

  it('adds TODO for dynamic variants and spread props', () => {
    const source = `
      import { Button, IconButton } from '@coinbase/cds-web';

      const variant = shouldInvert() ? 'tertiary' : getVariant();
      const iconProps = { variant: 'foregroundMuted' as const, compact: true };

      export function Example() {
        return (
          <>
            <Button variant={variant}>Save</Button>
            <IconButton {...iconProps} name="close" />
          </>
        );
      }
    `;

    const { output, entries } = runTransform(transformer, source);

    expect(output).toContain(TODO_PREFIX);
    expect(output).toMatch(/variant:\s*["']secondary["']/);
    expect(entries.filter((entry) => entry.level === 'TODO').length).toBeGreaterThanOrEqual(2);
  });

  it('is idempotent for TODO insertion', () => {
    const source = `
      import { Button } from '@coinbase/cds-web';

      export function Example({ variant, props }: { variant: string; props: Record<string, unknown> }) {
        return <Button variant={variant} {...props}>Save</Button>;
      }
    `;

    const first = runTransform(transformer, source).output;
    const second = runTransform(transformer, first).output;

    const firstTodoCount = first.split(TODO_PREFIX).length - 1;
    const secondTodoCount = second.split(TODO_PREFIX).length - 1;
    expect(secondTodoCount).toBe(firstTodoCount);
  });

  it('does not change non-target components', () => {
    const source = `
      import { Button as NotCdsButton } from './local';

      export const Example = () => <NotCdsButton variant="tertiary">Save</NotCdsButton>;
    `;

    const { output, entries } = runTransform(transformer, source);
    expect(output).toBe(source);
    expect(entries.length).toBe(0);
  });

  it('matches basic-literal fixture output', () => {
    const input = readFixtureFile('basic-literal.input.tsx');
    const expected = readFixtureFile('basic-literal.output.tsx');

    const { output } = runTransform(transformer, input);
    expect(normalizeCode(output)).toBe(normalizeCode(expected));
  });

  it('matches dynamic-variant fixture output', () => {
    const input = readFixtureFile('dynamic-variant.input.tsx');
    const expected = readFixtureFile('dynamic-variant.output.tsx');

    const { output, entries } = runTransform(transformer, input);
    expect(normalizeCode(output)).toBe(normalizeCode(expected));
    expect(entries.some((entry) => entry.level === 'TODO')).toBe(true);
  });

  it('matches spread-props fixture output', () => {
    const input = readFixtureFile('spread-props.input.tsx');
    const expected = readFixtureFile('spread-props.output.tsx');

    const { output, entries } = runTransform(transformer, input);
    expect(normalizeCode(output)).toBe(normalizeCode(expected));
    expect(entries.some((entry) => entry.level === 'TODO')).toBe(true);
  });
});
