import fs from 'fs';
import type { API, FileInfo, Options } from 'jscodeshift';
import { withParser } from 'jscodeshift';
import os from 'os';
import path from 'path';

import type { LogEntry } from '../../utils/logger.js';
import { createLogger } from '../../utils/logger.js';

export function runTransform(
  transform: (file: FileInfo, api: API, options: Options) => string | null,
  source: string,
): { output: string; entries: LogEntry[] } {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cds-migrator-test-'));
  const logger = createLogger(outputDir);
  const api = { jscodeshift: withParser('tsx') } as API;

  const result = transform({ path: '/tmp/example.tsx', source }, api, {});
  return {
    output: result ?? source,
    entries: logger.getEntries(),
  };
}
