import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'import': importPlugin,
    },
    rules: {
      // TypeScript ESLint recommended rules
      ...typescript.configs.recommended.rules,
      
      // Specific rules for backend development
      '@typescript-eslint/no-explicit-any': 'off', // Allow any for external APIs and flexible typing
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off', // Allow for controlled scenarios
      '@typescript-eslint/ban-ts-comment': 'warn',
      
      // Import/Export rules
      'import/order': ['error', {
        'groups': [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always',
        'alphabetize': {
          'order': 'asc',
          'caseInsensitive': true
        }
      }],
      'import/no-duplicates': 'error',
      'import/no-unresolved': 'off', // TypeScript handles this better
      
      // General JavaScript rules
      'no-console': 'off', // Allow console usage in backend services
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-expressions': 'error',
      'no-undef': 'off', // TypeScript handles this
      'no-redeclare': 'off', // TypeScript handles this better
      
      // Bun/Node.js specific
      'no-process-exit': 'warn',
      'no-sync': 'off', // Bun supports sync operations efficiently
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'src/tests/**/*.ts', 'scripts/**/*.ts', '**/migrate.ts', '**/seed.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-process-exit': 'off',
      'import/order': 'off',
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'uploads/**',
      'public/**',
      'drizzle/**',
      'docs/**/*.cjs',
      '*.js',
      '*.mjs',
      '*.cjs',
    ],
  },
];