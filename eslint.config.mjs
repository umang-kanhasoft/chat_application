import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';

export default [
    {
        files: ['src/**/*.ts'],
        extends: ['eslint:recommended', 'plugin:prettier/recommended'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: './tsconfig.json',
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
            import: importPlugin,
        },
        rules: {
            ...tseslint.configs.recommended.rules,
            ...prettier.rules,
            'prettier/prettier': 'error',

            // Custom rules
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'import/order': [
                'error',
                {
                    groups: [
                        ['builtin', 'external'],
                        ['internal', 'parent', 'sibling', 'index'],
                    ],
                    'newlines-between': 'always',
                },
            ],
        },
        overrides: [
            {
                files: ['src/prototypes/**/*.ts'],
                rules: {
                    '@typescript-eslint/no-explicit-any': 'off',
                },
            },
        ],
    },
];
