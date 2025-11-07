# `@patricktree/codemod-rewrite-module-specifiers-to-full-paths`

Codemod to rewrite module specifiers of TypeScript files to their full paths.

## Problem

Module specifiers for relative, absolute, and "subpath" (=path alias) imports in Node.js ESM need to be "exact".  
This is in contrast to Node.js CJS modules, which applied a "searching" algorithm when loading modules (see also <https://nodejs.org/api/modules.html#file-modules>).

For example, while the following `require` function calls were working in Node.js CJS modules, they are not working anymore in ESM modules:

```js
/* assuming ./some-directory/index.js is present */
require('./some-directory');
require('./some-directory/index');
```

Therefore, migrating CJS code to ESM code involves rewriting every module specifier to its full path.  
Doing this by hand is tedious and error-prone.

## Solution

This package is a codemod which consumes a TypeScript configuration file and rewrites all relative, absolute, and path alias imports to their full paths.

## How to use

```bash
npx @patricktree/codemod-rewrite-module-specifiers-to-full-paths --help

# Usage: codemod [options]

# Options:
#   --project <path-to-tsconfig-json>  Path to the TypeScript configuration file (e.g. "./tsconfig.json").
#   --basepath <path>                  A root directory to resolve relative path entries in the TypeScript config file to (e.g. option "outDir"). If omitted, the directory of the
#                                      TypeScript configuration file passed with "--project" is used.
#   -h, --help                         display help for command

# for example
npx @patricktree/codemod-rewrite-module-specifiers-to-full-paths --project=./path/to/tsconfig.json
```
