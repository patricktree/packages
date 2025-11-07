const baseEslintConfig = require('@patricktree/config-eslint/eslint-ecma.cjs');

module.exports = {
  ...baseEslintConfig,
  parserOptions: {
    ...baseEslintConfig.parserOptions,
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: [...(baseEslintConfig.ignorePatterns || []), '**/bin/pk-cli.js'],
  rules: {
    ...baseEslintConfig.rules,
    /* allow for this package to use console logs - is a CLI application */
    'no-console': 'off',
  },
};
