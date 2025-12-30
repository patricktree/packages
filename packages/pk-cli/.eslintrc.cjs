module.exports = {
  extends: ['@patricktree/eslint-config/eslint-ecma.cjs'],
  parserOptions: {
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['**/bin/pk-cli.js'],
  rules: {
    /* allow for this package to use console logs - is a CLI application */
    'no-console': 'off',
  },
};
