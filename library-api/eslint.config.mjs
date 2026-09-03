import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: globals.node,
      sourceType: 'commonjs',
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
  prettier,
]);
