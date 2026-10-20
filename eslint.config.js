// @ts-check
const { defineConfig, globalIgnores } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

// ---------------------------------------------------------------------------
// Architecture rules (AD-1, AD-13). Flat-config blocks are applied in order;
// for a rule configured by several blocks the last matching block wins, so each
// layer block states the complete value of the rule for that layer.
// ---------------------------------------------------------------------------

const FIREBASE = {
  group: ['firebase', 'firebase/*', '@firebase/*'],
  message: 'Only src/app/core/data may import firebase/* or @firebase/* (AD-1).',
};

const layerGroup = (dir) => [`**/${dir}`, `**/${dir}/**`];

/** @param {string[]} forbiddenDirs @param {boolean} firebaseBanned */
const importRule = (forbiddenDirs, firebaseBanned = true, extra = []) => [
  'error',
  {
    patterns: [
      ...(firebaseBanned ? [FIREBASE] : []),
      ...forbiddenDirs.map((dir) => ({
        group: layerGroup(dir),
        message: `This layer may not import from "${dir}" (allowed-imports table, AD-13a).`,
      })),
      ...extra,
    ],
  },
];

const DATE_SELECTORS = [
  {
    selector: "NewExpression[callee.name='Date']",
    message: 'new Date is only allowed in domain/day.ts and ClockService (AD-4, AD-13b).',
  },
  {
    selector: "MemberExpression[object.name='Date'][property.name=/^(now|parse)$/]",
    message:
      'Date.now and Date.parse are only allowed in domain/day.ts and ClockService (AD-4, AD-13b).',
  },
  {
    selector: "MemberExpression[object.name='Intl'][property.name='DateTimeFormat']",
    message:
      'Intl.DateTimeFormat is only allowed in domain/day.ts and ClockService (AD-4, AD-13b).',
  },
];

const NUMBER_SELECTORS = [
  {
    selector: 'MemberExpression[property.name=/^(toFixed|toLocaleString)$/]',
    message: 'toFixed and toLocaleString are only allowed in domain/number.ts (AD-14, AD-13e).',
  },
  {
    selector: "MemberExpression[object.name='Intl'][property.name='NumberFormat']",
    message: 'Intl.NumberFormat is only allowed in domain/number.ts (AD-14, AD-13e).',
  },
];

const DOM_GLOBALS = [
  'window',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
  'location',
  'history',
].map((name) => ({ name, message: 'domain must not use the DOM (AD-13d).' }));

const LAYER = 'src/app';

module.exports = defineConfig([
  globalIgnores([
    'dist/',
    '.angular/',
    'coverage/',
    'node_modules/',
    '.firebase/',
    'tests/lint/fixtures/',
    '_bmad/',
    '_bmad-output/',
    '.claude/',
    '.agents/',
    '.github/',
    'docs/',
  ]),
  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommended, angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'w4a', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'w4a', style: 'kebab-case' },
      ],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      'no-restricted-imports': importRule([], true),
      'no-restricted-syntax': ['error', ...DATE_SELECTORS, ...NUMBER_SELECTORS],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },

  // --- Layer import tables (AD-13a) ---------------------------------------
  {
    files: [`${LAYER}/domain/**/*.ts`],
    rules: {
      'no-restricted-imports': importRule(['core', 'shared', 'features', 'shell'], true, [
        {
          group: ['@angular/*', '@angular/**', 'rxjs', 'rxjs/*', 'zone.js'],
          message: 'domain must stay pure: no Angular or DOM imports (AD-13d).',
        },
      ]),
      'no-restricted-globals': ['error', ...DOM_GLOBALS],
    },
  },
  {
    files: [`${LAYER}/core/state/**/*.ts`],
    rules: {
      'no-restricted-imports': importRule(['core/data', 'shared', 'features', 'shell'], true, [
        // sibling-relative form, e.g. ../data/x from core/state
        {
          group: ['**/data', '**/data/**'],
          message: 'core/state may not import from core/data (allowed-imports table, AD-13a).',
        },
      ]),
    },
  },
  {
    files: [`${LAYER}/core/data/**/*.ts`],
    rules: { 'no-restricted-imports': importRule(['shared', 'features', 'shell'], false) },
  },
  {
    files: [`${LAYER}/shared/**/*.ts`],
    rules: { 'no-restricted-imports': importRule(['features', 'shell']) },
  },
  {
    files: [`${LAYER}/features/**/*.ts`],
    rules: { 'no-restricted-imports': importRule(['shell']) },
  },
  { files: [`${LAYER}/shell/**/*.ts`], rules: { 'no-restricted-imports': importRule([]) } },

  // --- Exemptions for Date / Intl.DateTimeFormat (AD-13b) -----------------
  {
    files: [`${LAYER}/domain/day.ts`, `${LAYER}/core/state/clock.service.ts`, '**/*.spec.ts'],
    rules: { 'no-restricted-syntax': ['error', ...NUMBER_SELECTORS] },
  },
  // --- Exemption for number formatting (AD-13e) ---------------------------
  {
    files: [`${LAYER}/domain/number.ts`],
    rules: { 'no-restricted-syntax': ['error', ...DATE_SELECTORS] },
  },
]);
