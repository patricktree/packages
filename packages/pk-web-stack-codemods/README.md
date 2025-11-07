# pk-web-stack-codemods

## Motivation

I have multiple git repositories using the same tech stack:

- `pnpm` for package management
- `turbo` as task runner (but a wrapper around it to adjust its behavior)
- `eslint` and `@typescript-eslint` for linting
- `prettier` for formatting
- many configurations (`.gitattributes`, `.gitignore`, `.npmrc`, ...)
- package.json scripts
- etc.

Merging all repositories into one is no option. They are different software projects hosted on GitHub with different visibilities, contributors, etc.  
So I need a way to manage the tech stack across multiple repositories.

This package is a CLI which accompishes that.

## Codemod ideas

- introduce `@patricktree/typescript-eslint-rules-requiring-type-info` everywhere
