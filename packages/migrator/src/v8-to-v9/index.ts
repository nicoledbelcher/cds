/**
 * v8 to v9 Migration
 *
 * This module defines all transforms needed to migrate from CDS v8 to v9
 */

export type Transform = {
  name: string;
  description: string;
  file: string;
  extensions?: string;
};

export const transforms: Transform[] = [
  // Add transforms here as they are created
  // Example:
  // {
  //   name: 'update-button-props',
  //   description: 'Update Button component props',
  //   file: 'transforms/update-button-props.ts',
  // },
];

export const description = `
CDS v8 to v9 Migration
======================

This migration includes the following transforms:
${transforms.map((t) => `  - ${t.name}: ${t.description}`).join('\n')}

Breaking changes in v9:
- [Add breaking changes here as they are identified]

Please review the changes carefully before committing.
`;
