const baseEslintConfig = require('@patricktree/config-eslint/eslint-ecma.cjs');

module.exports = {
  ...baseEslintConfig,
  parserOptions: {
    ...baseEslintConfig.parserOptions,
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: [...(baseEslintConfig.ignorePatterns ?? []), 'pkg-consumption-test.js'],
  rules: {
    ...baseEslintConfig.rules,
    'no-console': 'off',
  },
};
