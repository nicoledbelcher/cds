const config = {
  preset: '../../jest.preset.js',
  displayName: 'cds-migrator',
  // Migrator tests execute codemods and filesystem helpers, so Node is the correct runtime.
  testEnvironment: 'node',
  coverageReporters: ['text-summary', 'text', 'json-summary'],
  moduleNameMapper: {
    // Transform source imports use ESM ".js" specifiers, but Jest runs TS sources in tests.
    // Remap relative ".js" imports to extensionless paths so Jest resolves TS modules correctly.
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};

export default config;
