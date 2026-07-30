# @patricktree/runtime-extensions-node

## 0.0.3

### Patch Changes

- 9183e69: Build the published output with TypeScript 6 (`@typescript/typescript6`) instead of TypeScript 5.9. The compiler options and the ES2018 target are unchanged, so the emitted API is the same.

  `@patricktree/codemod-rewrite-module-specifiers-to-full-paths` additionally drops its unused `@patricktree/commons-ecma` dependency.

## 0.0.2

### Patch Changes

- build(runtime-extensions-node)!: ship as ESM
