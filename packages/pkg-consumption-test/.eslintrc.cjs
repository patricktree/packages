module.exports = {
  extends: ['@patricktree/eslint-config/eslint-ecma.cjs'],
  parserOptions: {
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['pkg-consumption-test.js'],
  rules: {
    'no-console': 'off',
  },
};
