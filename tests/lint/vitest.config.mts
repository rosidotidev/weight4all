import { defineConfig } from 'vitest/config';

// Lint-rule fixture tests run outside `ng test` (its include globs are limited to src/).
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/lint/**/*.spec.ts'],
  },
});
