// @ts-check

module.exports = {
  extends: ['@patricktree/eslint-config/eslint-ecma.cjs'],
  parserOptions: {
    tsconfigRootDir: __dirname,
  },
  rules: {
    'n/no-process-env': 'off',
  },
};
