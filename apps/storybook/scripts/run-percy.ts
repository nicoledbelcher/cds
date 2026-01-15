import path from 'node:path';
import { $ } from 'zx';

$.verbose = true;

const MONOREPO_ROOT = process.env.PROJECT_CWD ?? process.env.NX_MONOREPO_ROOT;

if (!MONOREPO_ROOT) throw Error('MONOREPO_ROOT is undefined');

const getPercyToken = (): string | undefined => {
  const token = process.env.PERCY_TOKEN;

  if (token) {
    return token;
  }

  const envVarName = `PERCY_TOKEN_${String(process.env.NX_PROJECT_NAME)
    .toUpperCase()
    .replace(/[-/]/g, '_')}`;

  if (process.env[envVarName]) {
    return process.env[envVarName];
  }

  throw new Error(
    `A PERCY_TOKEN or ${envVarName} environment variable is required for running Percy in the "${process.env.NX_PROJECT_NAME}" project.`,
  );
};

const main = async () => {
  console.log('========================================');
  console.log('🔍 Percy Visual Regression Test Starting');
  console.log('========================================');
  console.log(`📁 Storybook dist path: ${path.join(MONOREPO_ROOT, 'apps/storybook/dist')}`);
  console.log(`🌿 Branch: ${process.env.PERCY_BRANCH || 'not set'}`);
  console.log(`🔧 CI: ${process.env.CI || 'false'}`);
  console.log('========================================');

  process.env.PERCY_TOKEN = getPercyToken();
  console.log('✅ PERCY_TOKEN is set');

  console.log('🚀 Uploading snapshots to Percy...');
  const result = await $`percy storybook ${path.join(MONOREPO_ROOT, 'apps/storybook/dist')}`;

  console.log('========================================');
  console.log('📝 Percy storybook output (stdout):');
  console.log(result.stdout);
  console.log('========================================');

  // Extract build ID from output like: [percy] Finalized build #7229: https://percy.io/.../builds/46143234
  const buildIdMatch = result.stdout.match(/\/builds\/(\d+)/);
  console.log('🔍 Build ID regex match:', buildIdMatch);

  if (!buildIdMatch) {
    console.log('❌ Could not find build ID in output. Looking for pattern: /builds/<id>');
    console.log('📄 Full stdout length:', result.stdout.length);
    console.log('📄 Full stderr:', result.stderr);
    throw new Error('Could not extract Percy build ID from output');
  }

  const buildId = buildIdMatch[1];
  const fullMatch = buildIdMatch[0];
  console.log(`📋 Percy build ID: ${buildId}`);
  console.log(`🔗 Matched URL path: ${fullMatch}`);

  console.log('========================================');
  console.log('⏳ Waiting for Percy build to complete...');
  console.log(`🔧 Running: npx percy build:wait --build ${buildId} --fail-on-changes`);
  console.log('========================================');
  await $`npx percy build:wait --build ${buildId} --fail-on-changes`;

  console.log('========================================');
  console.log('✨ Percy run complete!');
  console.log('========================================');
};

void main();
