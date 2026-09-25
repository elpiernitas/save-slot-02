import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      // Persistence must go through src/game/save. See docs/DECISION_LOG.md (D-006).
      'no-restricted-globals': [
        'error',
        { name: 'localStorage', message: 'Use the save layer in src/game/save instead.' },
        { name: 'sessionStorage', message: 'Use the save layer in src/game/save instead.' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      // Scenes share one props contract; `_` marks props a scene does not need.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // The only module allowed to touch Web Storage directly.
    files: ['src/game/save/localStorageAdapter.ts'],
    rules: { 'no-restricted-globals': 'off' },
  },
  prettier,
]);
