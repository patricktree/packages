const { removeTypeInfoRules } = require('@patricktree/typescript-eslint-rules-requiring-type-info');
const assert = require('node:assert/strict');

const testEslintConfig = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended-requiring-type-checking'],
  rules: {
    'no-console': 'error',
    '@typescript-eslint/await-thenable': 'error',
  },
};

assert.deepStrictEqual(removeTypeInfoRules(testEslintConfig), {
  extends: ['eslint:recommended'],
  rules: {
    'no-console': 'error',
  },
});
