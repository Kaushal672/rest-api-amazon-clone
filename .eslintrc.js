module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es2021: true,
        node: true,
    },
    extends: ['airbnb-base', 'plugin:prettier/recommended'],
    overrides: [],
    parserOptions: {
        ecmaVersion: 'latest',
    },
    plugins: ['no-autofix', 'prettier'],
    rules: {
        'prettier/prettier': ['error'],
        'no-unused-vars': [1, { argsIgnorePattern: '^_' }],
        'prefer-const': 0,
        'no-autofix/prefer-const': 1,
        'func-names': [1, 'never'],
        'consistent-return': 0,
    },
};
