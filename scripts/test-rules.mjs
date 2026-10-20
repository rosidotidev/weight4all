// Runs the Firestore rules tests in tests/rules/ inside the Firestore emulator.
// Passes when there are none yet and exits non-zero when any test fails.
import { existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const hasTests = (dir) =>
  readdirSync(dir, { withFileTypes: true }).some((e) =>
    e.isDirectory() ? hasTests(`${dir}/${e.name}`) : /\.(spec|test)\.[cm]?[jt]s$/.test(e.name),
  );

if (!existsSync('tests/rules') || !hasTests('tests/rules')) {
  console.log('test:rules: no rules tests yet, nothing to run.');
  process.exit(0);
}

// The emulator starts and stops around vitest and sets FIRESTORE_EMULATOR_HOST for the tests.
const vitest = 'vitest run --config tests/rules/vitest.config.mts';
const result = spawnSync(
  'npx',
  ['firebase', 'emulators:exec', '--only', 'firestore', '--project', 'demo-weight4all', `"${vitest}"`],
  { stdio: 'inherit', shell: true },
);
process.exit(result.status ?? 1);
