import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ESLint } from 'eslint';

// Fixture violations are stored as .txt files and linted as strings with a virtual
// filePath, so the layer rules of eslint.config.js apply by path (AD-13).
const ROOT = process.cwd();
const FIXTURES = join(ROOT, 'tests', 'lint', 'fixtures');

const eslint = new ESLint({ cwd: ROOT, overrideConfigFile: join(ROOT, 'eslint.config.js') });

async function ruleIds(fixture: string, virtualPath: string): Promise<string[]> {
  const code = readFileSync(join(FIXTURES, `${fixture}.txt`), 'utf8');
  const [result] = await eslint.lintText(code, { filePath: join(ROOT, virtualPath) });
  const fatal = result.messages.filter((m) => m.fatal);
  expect(fatal, JSON.stringify(fatal)).toEqual([]);
  return result.messages.map((m) => m.ruleId ?? 'parse-error');
}

const IMPORTS = 'no-restricted-imports';
const SYNTAX = 'no-restricted-syntax';
const GLOBALS = 'no-restricted-globals';

interface Case {
  name: string;
  fixture: string;
  path: string;
  rule: string;
}

const violations: Case[] = [
  { name: 'firebase/* in features', fixture: 'firebase-import', path: 'src/app/features/today/a.ts', rule: IMPORTS },
  { name: 'firebase/* in shared', fixture: 'firebase-import', path: 'src/app/shared/a.ts', rule: IMPORTS },
  { name: 'firebase/* in core/state', fixture: 'firebase-import', path: 'src/app/core/state/a.ts', rule: IMPORTS },
  { name: 'firebase/* in domain', fixture: 'firebase-import', path: 'src/app/domain/a.ts', rule: IMPORTS },
  { name: '@firebase/* in shell', fixture: 'firebase-scoped-import', path: 'src/app/shell/a.ts', rule: IMPORTS },
  { name: 'domain importing core', fixture: 'layer-import', path: 'src/app/domain/a.ts', rule: IMPORTS },
  { name: 'core/state importing core/data', fixture: 'layer-data-import', path: 'src/app/core/state/a.ts', rule: IMPORTS },
  { name: 'core/data importing shared', fixture: 'layer-shared-import', path: 'src/app/core/data/a.ts', rule: IMPORTS },
  { name: 'shared importing features', fixture: 'layer-features-import', path: 'src/app/shared/a.ts', rule: IMPORTS },
  { name: 'features importing shell', fixture: 'layer-shell-import', path: 'src/app/features/today/a.ts', rule: IMPORTS },
  { name: 'new Date in a feature', fixture: 'new-date', path: 'src/app/features/today/a.ts', rule: SYNTAX },
  { name: 'new Date in domain/other.ts', fixture: 'new-date', path: 'src/app/domain/other.ts', rule: SYNTAX },
  { name: 'Date.now', fixture: 'date-now', path: 'src/app/core/data/a.ts', rule: SYNTAX },
  { name: 'Date.parse', fixture: 'date-parse', path: 'src/app/shared/a.ts', rule: SYNTAX },
  { name: 'Intl.DateTimeFormat', fixture: 'intl-datetimeformat', path: 'src/app/features/history/a.ts', rule: SYNTAX },
  { name: 'Angular import in domain', fixture: 'angular-import', path: 'src/app/domain/a.ts', rule: IMPORTS },
  { name: 'DOM global in domain', fixture: 'dom-global', path: 'src/app/domain/a.ts', rule: GLOBALS },
  { name: 'toFixed outside number.ts', fixture: 'to-fixed', path: 'src/app/features/today/a.ts', rule: SYNTAX },
  { name: 'toLocaleString outside number.ts', fixture: 'to-locale-string', path: 'src/app/shared/a.ts', rule: SYNTAX },
  { name: 'Intl.NumberFormat in domain/day.ts', fixture: 'intl-numberformat', path: 'src/app/domain/day.ts', rule: SYNTAX },
  { name: 'toFixed in domain/day.ts', fixture: 'to-fixed', path: 'src/app/domain/day.ts', rule: SYNTAX },
  { name: 'new Date in domain/number.ts', fixture: 'new-date', path: 'src/app/domain/number.ts', rule: SYNTAX },
];

const allowed: Omit<Case, 'rule'>[] = [
  { name: 'firebase/* in core/data', fixture: 'firebase-import', path: 'src/app/core/data/firebase.ts' },
  { name: '@firebase/* in core/data', fixture: 'firebase-scoped-import', path: 'src/app/core/data/entry.store.ts' },
  { name: 'core/state importing domain', fixture: 'layer-domain-import', path: 'src/app/core/state/a.ts' },
  { name: 'core/data importing core/state', fixture: 'layer-state-import', path: 'src/app/core/data/a.ts' },
  { name: 'shell importing features', fixture: 'layer-features-import', path: 'src/app/shell/a.ts' },
  { name: 'features importing shared', fixture: 'layer-shared-import', path: 'src/app/features/today/a.ts' },
  { name: 'new Date in domain/day.ts', fixture: 'new-date', path: 'src/app/domain/day.ts' },
  { name: 'Date.now in domain/day.ts', fixture: 'date-now', path: 'src/app/domain/day.ts' },
  { name: 'Date.parse in domain/day.ts', fixture: 'date-parse', path: 'src/app/domain/day.ts' },
  { name: 'Intl.DateTimeFormat in domain/day.ts', fixture: 'intl-datetimeformat', path: 'src/app/domain/day.ts' },
  { name: 'new Date in ClockService', fixture: 'new-date', path: 'src/app/core/state/clock.service.ts' },
  { name: 'Date.now in ClockService', fixture: 'date-now', path: 'src/app/core/state/clock.service.ts' },
  { name: 'fake clock Date in a spec file', fixture: 'new-date', path: 'src/app/features/today/a.spec.ts' },
  { name: 'toFixed in domain/number.ts', fixture: 'to-fixed', path: 'src/app/domain/number.ts' },
  { name: 'toLocaleString in domain/number.ts', fixture: 'to-locale-string', path: 'src/app/domain/number.ts' },
  { name: 'Intl.NumberFormat in domain/number.ts', fixture: 'intl-numberformat', path: 'src/app/domain/number.ts' },
];

describe('architecture lint rules', () => {
  it.each(violations)('reports $rule for $name', async ({ fixture, path, rule }) => {
    expect(await ruleIds(fixture, path)).toContain(rule);
  });

  it.each(allowed)('allows $name', async ({ fixture, path }) => {
    const ids = await ruleIds(fixture, path);
    expect(ids.filter((id) => id.startsWith('no-restricted-'))).toEqual([]);
  });
});
