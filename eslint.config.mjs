import { baseConfig } from '@rheo/config/eslint.js';

export default [
  ...baseConfig,
  {
    ignores: ['packages/**', 'scripts/**', '.expo/**', 'ios/**', 'android/**', 'dist/**'],
  },
  {
    files: ['babel.config.js', 'metro.config.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        __dirname: 'readonly',
        exports: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
