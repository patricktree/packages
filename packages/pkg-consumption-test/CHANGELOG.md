# @patricktree/pkg-consumption-test

## 1.0.8

### Patch Changes

- 9183e69: Build the published output with TypeScript 6 (`@typescript/typescript6`) instead of TypeScript 5.9. The compiler options and the ES2018 target are unchanged, so the emitted API is the same.

  `@patricktree/codemod-rewrite-module-specifiers-to-full-paths` additionally drops its unused `@patricktree/commons-ecma` dependency.

- 9183e69: Write a valid base64 `_auth` value into the temporary `.npmrc`. pnpm 11 validates the value and rejected the previous literal placeholder with "[ERROR] Invalid character", which broke every package consumption scenario.
- Updated dependencies [9183e69]
  - @patricktree/commons-ecma@3.2.1
  - @patricktree/commons-node@3.1.3

## 1.0.7

### Patch Changes

- Updated dependencies [839b08c]
  - @patricktree/commons-ecma@3.2.0
  - @patricktree/commons-node@3.1.2

## 1.0.6

### Patch Changes

- Updated dependencies [88d3751]
  - @patricktree/commons-ecma@3.1.1
  - @patricktree/commons-node@3.1.1

## 1.0.5

### Patch Changes

- Updated dependencies [8f41d11]
- Updated dependencies [8f41d11]
  - @patricktree/commons-ecma@3.1.0
  - @patricktree/commons-node@3.1.0

## 1.0.4

### Patch Changes

- Updated dependencies
- Updated dependencies
  - @patricktree/commons-ecma@3.0.0
  - @patricktree/commons-node@3.0.0

## 1.0.3

### Patch Changes

- 9f8b96e: fix(pkg-consumption-test): configure npm token via `_auth` instead of `_authToken`
- 6a266dd: fix(pkg-consumption-test): use random temporary directories to allow multiple runs in parallel
- f43b99b: chore(deps): bump all deps to latest and apply ESLint fixes
- Updated dependencies [aff99e2]
- Updated dependencies [f43b99b]
  - @patricktree/commons-node@2.2.0
  - @patricktree/commons-ecma@2.4.1
