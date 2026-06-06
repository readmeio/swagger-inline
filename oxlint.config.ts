import oxlintConfig from '@readme/oxlint-config';
import oxlintConfigVitest from '@readme/oxlint-config/testing/vitest';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [oxlintConfig],
  options: {
    reportUnusedDisableDirectives: 'error',
  },
  ignorePatterns: ['coverage/', 'dist/', '__tests__/__fixtures__/**'],
  categories: {
    suspicious: 'error',
  },
  env: {
    browser: true,
    commonjs: true,
    es2022: true,
    node: true,
  },
  rules: {
    'no-console': 'off',
    'node/no-path-concat': 'off',
    'typescript/no-extraneous-class': 'off',
    'unicorn/no-array-sort': 'off',
  },
  overrides: [
    {
      files: ['__tests__/**/*.test.{js,ts}'],
      ...oxlintConfigVitest,
      rules: oxlintConfigVitest.rules,
    },
  ],
});
