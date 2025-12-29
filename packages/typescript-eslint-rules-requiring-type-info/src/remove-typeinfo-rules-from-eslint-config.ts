import type { Linter } from 'eslint';

import { getRules } from '#pkg/get-rules.js';

export function removeTypeInfoRules(eslintConfig: Linter.Config): Linter.Config {
  const rulesRequiringTypeInfo = getRules();

  let newExtends = eslintConfig.extends;
  if (typeof eslintConfig.extends === 'object' && Array.isArray(eslintConfig.extends)) {
    newExtends = eslintConfig.extends.filter(
      (extend) => extend !== 'plugin:@typescript-eslint/recommended-requiring-type-checking',
    );
  }

  let newRules = eslintConfig.rules;
  if (typeof eslintConfig.rules === 'object') {
    newRules = {};
    for (const [ruleName, ruleConfig] of Object.entries(eslintConfig.rules)) {
      if (!rulesRequiringTypeInfo.includes(ruleName)) {
        newRules[ruleName] = ruleConfig;
      }
    }
  }

  return {
    ...eslintConfig,
    extends: newExtends,
    rules: newRules,
  };
}
