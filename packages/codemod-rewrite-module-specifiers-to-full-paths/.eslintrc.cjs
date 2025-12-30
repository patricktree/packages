module.exports = {
  extends: ['@patricktree/eslint-config/eslint-ecma.cjs'],
  parserOptions: {
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['**/codemod-inputs/**', '**/codemod-outputs/**'],
  rules: {
    'no-console': 'off',
  },
};
