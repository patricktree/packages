# @patricktree/pkg-management

## 2.1.5

### Patch Changes

- 9183e69: Build the published output with TypeScript 6 (`@typescript/typescript6`) instead of TypeScript 5.9. The compiler options and the ES2018 target are unchanged, so the emitted API is the same.

  `@patricktree/codemod-rewrite-module-specifiers-to-full-paths` additionally drops its unused `@patricktree/commons-ecma` dependency.

- Updated dependencies [9183e69]
  - @patricktree/commons-ecma@3.2.1
  - @patricktree/commons-node@3.1.3

## 2.1.4

### Patch Changes

- Updated dependencies [839b08c]
  - @patricktree/commons-ecma@3.2.0
  - @patricktree/commons-node@3.1.2

## 2.1.3

### Patch Changes

- Updated dependencies [88d3751]
  - @patricktree/commons-ecma@3.1.1
  - @patricktree/commons-node@3.1.1

## 2.1.2

### Patch Changes

- Updated dependencies [8f41d11]
- Updated dependencies [8f41d11]
  - @patricktree/commons-ecma@3.1.0
  - @patricktree/commons-node@3.1.0

## 2.1.1

### Patch Changes

- Updated dependencies
- Updated dependencies
  - @patricktree/commons-ecma@3.0.0
  - @patricktree/commons-node@3.0.0

## 2.1.0

### Minor Changes

- 3049733: feat(pkg-management): option `--tsconfig-filename <name>` for `add-all-tsconfigs-as-project-references`

## 2.0.1

### Patch Changes

- f43b99b: chore(deps): bump all deps to latest and apply ESLint fixes
- Updated dependencies [aff99e2]
- Updated dependencies [f43b99b]
  - @patricktree/commons-node@2.2.0
  - @patricktree/commons-ecma@2.4.1

## 2.0.0

### Major Changes

- cdd6307: feat(pkg-management): allow to specify version of `ts-patch` via CLI option for bin `create-pnpm-patch-via-ts-patch`

  BREAKING CHANGE: the new option is required, making the used version of `ts-patch` more explicit

## 1.2.1

### Patch Changes

- a5c0ebb: docs(pkg-management): add README

## 1.2.0

### Minor Changes

- f11b1ef: feat(pkg-management): implement "add-all-tsconfigs-as-project-references"

## 1.1.1

### Patch Changes

- 80eb9d6: use dist dir in `imports` of package.json

## 1.1.0

### Minor Changes

- e716678: expose CLI `create-pnpm-patch-via-ts-patch` as `bin`

## 1.0.3

### Patch Changes

- Updated dependencies [defe2b1]
  - @patricktree/commons-ecma@2.1.2
  - @patricktree/commons-node@2.1.2

## 1.0.2

### Patch Changes

- Updated dependencies [8aa8641]
  - @patricktree/commons-ecma@2.1.1
  - @patricktree/commons-node@2.1.1

## 1.0.1

### Patch Changes

- Updated dependencies [2ad0473]
- Updated dependencies [98c3b5e]
  - @patricktree/commons-node@2.1.0
  - @patricktree/commons-ecma@2.1.0
