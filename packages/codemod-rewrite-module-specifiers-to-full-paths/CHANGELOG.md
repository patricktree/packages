# @patricktree/codemod-rewrite-module-specifiers-to-full-paths

## 2.3.0

### Minor Changes

- 087a1ac: Add a `--debug` flag that emits structured diagnostic logs during codemod runs.

### Patch Changes

- 087a1ac: Bump codemod dependencies.
- 087a1ac: Select the `tsx` parser for `.jsx`/`.tsx` files so JSX sources are rewritten correctly.
- 9183e69: Build the published output with TypeScript 6 (`@typescript/typescript6`) instead of TypeScript 5.9. The compiler options and the ES2018 target are unchanged, so the emitted API is the same.

  `@patricktree/codemod-rewrite-module-specifiers-to-full-paths` additionally drops its unused `@patricktree/commons-ecma` dependency.

- Updated dependencies [9183e69]
  - @patricktree/commons-node@3.1.3

## 2.0.3

### Patch Changes

- Updated dependencies [839b08c]
  - @patricktree/commons-ecma@3.2.0
  - @patricktree/commons-node@3.1.2

## 2.0.2

### Patch Changes

- Updated dependencies [88d3751]
  - @patricktree/commons-ecma@3.1.1
  - @patricktree/commons-node@3.1.1

## 2.0.1

### Patch Changes

- Updated dependencies [8f41d11]
- Updated dependencies [8f41d11]
  - @patricktree/commons-ecma@3.1.0
  - @patricktree/commons-node@3.1.0

## 2.0.0

### Major Changes

- build(codemod-rewrite-module-specifiers-to-full-paths)!: ship as ESM

### Patch Changes

- chore(codemod-rewrite-module-specifiers-to-full-paths): use exact module specifiers
- Updated dependencies
- Updated dependencies
  - @patricktree/commons-ecma@3.0.0
  - @patricktree/commons-node@3.0.0

## 1.0.2

### Patch Changes

- bbb5955: Add a shebang to the CLI entrypoint so npx can execute the bin script.

## 1.0.1

### Patch Changes

- 3f52b98: fix(codemod-rewrite-module-specifiers-to-full-paths): make `@patricktree/runtime-extensions-node` a dev dependency

## 1.0.0

### Major Changes

- chore(codemod-rewrite-module-specifiers-to-full-paths): release 1.0.0
