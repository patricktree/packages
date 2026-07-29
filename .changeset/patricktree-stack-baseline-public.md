---
"@patricktree/codemod-rewrite-module-specifiers-to-full-paths": patch
"@patricktree/typescript-eslint-rules-requiring-type-info": patch
"eslint-plugin-code-import-patterns": patch
"@patricktree/runtime-extensions-node": patch
"@patricktree/fetch-sitemap-locations": patch
"@patricktree/pkg-consumption-test": patch
"@patricktree/pkg-management": patch
"@patricktree/commons-ecma": patch
"@patricktree/commons-node": patch
"@patricktree/fetch-favicon": patch
---

Build the published output with TypeScript 6 (`@typescript/typescript6`) instead of TypeScript 5.9. The compiler options and the ES2018 target are unchanged, so the emitted API is the same.

`@patricktree/codemod-rewrite-module-specifiers-to-full-paths` additionally drops its unused `@patricktree/commons-ecma` dependency.
