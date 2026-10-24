import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  // The mobile app isn't linted here (Expo has its own tooling)
  { ignores: ['apps/mobile/**', '**/dist/**', '**/node_modules/**', '.playwright-mcp/**'] },

  // Recommended rules for all linted JavaScript
  js.configs.recommended,

  // Shared package: runs in Node, browsers and React Native
  {
    files: ['packages/shared/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },

  // Web app UI code (and its component tests) runs in the browser
  {
    files: ['apps/web/src/**/*.{js,jsx}', 'apps/web/test/**/*.jsx'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },

  // React hooks rules for web components
  {
    files: ['apps/web/**/*.jsx'],
    ...reactHooks.configs.flat.recommended,
  },

  // Server code and config files run in Node
  {
    files: [
      'apps/web/api/**/*.js',
      'apps/web/server/**/*.js',
      'apps/web/test/**/*.js',
      '*.config.js',
      '**/*.config.js',
    ],
    languageOptions: { globals: globals.node },
  },
];
