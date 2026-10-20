// Runs the Firestore rules tests in tests/rules/. Passes when there are none yet
// (Story 1.2 adds them) and exits non-zero when any test fails.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const hasTests = (dir) =>
  readdirSync(dir, { withFileTypes: true }).some((e) =>
    e.isDirectory() ? hasTests(`${dir}/${e.name}`) : /\.(spec|test)\.[cm]?[jt]s$/.test(e.name),
  );

if (!hasTests('tests/rules')) {
  console.log('test:rules: no rules tests yet, nothing to run.');
  process.exit(0);
}

const result = spawnSync('npx', ['vitest', 'run', '--root', 'tests/rules'], { stdio: 'inherit', shell: true });
process.exit(result.status ?? 1);
