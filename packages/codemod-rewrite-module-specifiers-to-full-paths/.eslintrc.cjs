const baseEslintConfig = require('@patricktree/config-eslint/eslint-ecma.cjs');

module.exports = {
  ...baseEslintConfig,
  parserOptions: {
    ...baseEslintConfig.parserOptions,
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: [
    ...(baseEslintConfig.ignorePatterns || []),
    '**/codemod-inputs/**',
    '**/codemod-outputs/**',
  ],
  rules: {
    ...baseEslintConfig.rules,
    'no-console': 'off',
  },
};
