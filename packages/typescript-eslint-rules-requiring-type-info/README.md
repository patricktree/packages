# `@patricktree/typescript-eslint-rules-requiring-type-info`

## Problem

Some [`typescript-eslint`](https://github.com/typescript-eslint/typescript-eslint) rules require type information.
Enabling them provides real benefits, e.g. [`no-floating-promises`](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/no-floating-promises.md) catches cases in which one might forgot to `await` a promise.

However, if at least one rule requiring type information is enabled, the time it takes to lint increases significantly.
See [this page](https://typescript-eslint.io/docs/linting/typed-linting#how-is-performance) for more information.  
This is usually OK if linting is done via the `eslint` CLI; however, in an IDE (especially if autofix-on-save is enabled), this can be very annoying.  
Depending on the size of the TypeScript codebase, it might even happen that saving a file takes a couple of seconds because of these linting rules.

## Solution

Only lint using rules requiring type information when the `eslint` CLI is used.
Disable those rules when using an IDE like VS Code.  
This way the IDE stays fast but running `eslint` from the terminal (or as pre-commit hook, in a CI/CD system, ...) still performs an "exhaustive" lint run.

This package exposes two functions to help accomplish this idea:

- `fetchAndStoreRules`: fetches the list of rules from [typescript-eslint.io/rules](https://typescript-eslint.io/rules) and stores all rules requiring type information in a JSON file.
- `removeTypeInfoRules`: given a ESLint config and the JSON file, removes all rules which require type information from the ESLint config.

## Installation (in four steps)

1. Install the package:

   ```sh
   npm i --save-dev @patricktree/typescript-eslint-rules-requiring-type-info
   ```

2. Run `fetchAndStoreRules` on a regular basis. You can run it using `node` in `postinstall` script of your `package.json`:

   ```json
   {
     "scripts": {
       "postinstall": "node --input-type=module -e 'import { fetchAndStoreRules } from \"@patricktree/typescript-eslint-rules-requiring-type-info\"; void fetchAndStoreRules();'"
     }
   }
   ```

3. Configure your `.eslintrc.cjs` file (picked up by IDEs) such that the rules are excluded, like so:

   ```js
   const {
     removeTypeInfoRules,
   } = require('@patricktree/typescript-eslint-rules-requiring-type-info');

   const applyHeavyRules = process.env.APPLY_HEAVY_RULES === 'true';

   /**
    * @type {any}
    */
   const eslintConfig = {
     root: true,
     parser: '@typescript-eslint/parser',
     parserOptions: {
       tsconfigRootDir: __dirname,
       project: './tsconfig.json',
     },
     plugins: ['@typescript-eslint/eslint-plugin'],
     extends: [
       'eslint:recommended',
       'plugin:@typescript-eslint/recommended',
       'plugin:@typescript-eslint/recommended-requiring-type-checking',
     ],
   };

   /*
    * only if env variable APPLY_HEAVY_RULES is set, we will include the "heavy" @typescript-eslint rules
    */
   module.exports = applyHeavyRules ? eslintConfig : removeTypeInfoRules(eslintConfig);
   ```

4. To run _all_ rules when using the `eslint` CLI, configure a `lint` script in your `package.json` (and use that script from the terminal, in pre-commit hooks, in CI/CD, etc.):

   ```json
   {
     "scripts": {
       "lint": "cross-env APPLY_HEAVY_RULES=true eslint --max-warnings 0 ."
     }
   }
   ```
