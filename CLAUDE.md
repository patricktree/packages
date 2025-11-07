# CLAUDE.md - Repository Context

This document provides essential information about the `packages-private` repository to help AI assistants understand the codebase structure, conventions, and development practices.

## Repository Overview

This is a **TypeScript monorepo** managed with **pnpm workspaces** and **Turbo**. It contains various utility packages, tools, and libraries created by Patrick Kerschbaum (@patricktree).

### Key Technologies

- **Language**: TypeScript
- **Package Manager**: pnpm
- **Build System**: Turbo (via custom `superturbo` wrapper)
- **Node Version**: Specified in `.nvmrc`
- **Module Systems**: Both CommonJS and ESM packages

### Repository Structure

```txt
packages-private/
├── packages/          # Main packages (published to npm)
├── platform/          # Internal platform utilities
│   ├── config-eslint/
│   ├── config-typescript/
│   └── superturbo/
├── test/              # Test packages
├── patches/           # pnpm patches for dependencies
└── turbo.json         # Turbo configuration
```

## Development Setup

### Prerequisites

1. Install Node.js using nvm: `nvm install`
2. Enable pnpm via corepack: `corepack enable`
3. Install native toolchain for Node.js modules: Run the installation instructions "A C/C++ compiler tool chain for your platform" of [microsoft/vscode/wiki/How-to-Contribute#prerequisites](https://github.com/microsoft/vscode/wiki/How-to-Contribute#prerequisites)

### Common Commands

```bash
pnpm install         # Install all dependencies
pnpm run build       # Build all packages
pnpm run lint        # Run ESLint across all packages
pnpm run lint:fix    # Fix linting issues
pnpm run format      # Format with Prettier
pnpm run nuke        # Clean all build artifacts and node_modules
```

## Coding Conventions

### TypeScript Configuration

- **Base config**: `platform/config-typescript/tsconfig.json`
- **Strict mode**: Enabled with additional strict checks
- **Module resolution**: Node16
- **Path aliases**: Use `#pkg/*` for internal imports (transformed to relative paths during build)
- **Custom transformer**: `typescript-transform-paths` for path alias support

### Code Style

- **Formatting**: Prettier with single quotes, trailing commas, 100-char line width
- **Linting**: ESLint with TypeScript support, all errors shown as warnings
- **Import ordering**: External → workspace → internal, alphabetically sorted
- **No default exports**: Use named exports only
- **No relative imports**: Use `#pkg/*` aliases instead (except for assets)

### Package Structure

Each package typically follows this structure:

```txt
package-name/
├── src/              # Source files
├── dist/             # Build output (gitignored)
├── package.json      # Package manifest
├── tsconfig.project.json  # TypeScript config
└── turbo.json        # Turbo config (if needed)
```

### Package Configuration

- **Exports**: Use `exports` field in package.json
- **Types**: TypeScript declarations generated with source maps
- **Scripts**:
  - `build`: Compile TypeScript
  - `dev`: Watch mode compilation
  - `lint`: Run ESLint
  - `nuke`: Clean artifacts

## Important Patterns

### Path Aliases

All internal imports use `#pkg/*` aliases which map to `./src/*`. These are transformed to relative paths during compilation using `typescript-transform-paths`.

### Monorepo References

The root `tsconfig.json` contains references to all packages for TypeScript project references support.

### Build System

- Uses Turbo for orchestrating builds across packages
- Custom `superturbo` wrapper in `platform/superturbo/`
- Build outputs go to `dist/` directories

### Testing

- Test packages in `test/` directory
- Package consumption tests ensure packages work correctly when installed

### Publishing

- Packages under `packages/` are published to npm
- Uses Changesets for version management
- Public packages use `@patricktree/` scope

## Special Considerations

### TypeScript Patching

The repository uses a patched version of TypeScript to support custom transformers. We use the custom transformer (plugin) [`typescript-transform-paths`](https://github.com/LeDDGroup/typescript-transform-paths) in our TypeScript codebase. This enables authoring TypeScript sources with path aliases but during TypeScript compilation, they are replaced by relative paths. That avoids all sorts of difficulties supporting path aliases in Node.js, Next.js, etc.

Such custom transformers (plugins) are not supported by TypeScript out-of-the-box, so we apply [`ts-patch`](https://github.com/nonara/ts-patch) to the `typescript` package. To better incorporate with pnpm (<https://github.com/pnpm/pnpm/issues/6111>) we create a pnpm patch via `ts-patch`, using [`@patricktree/pkg-management`](https://www.npmjs.com/package/@patricktree/pkg-management).

When updating TypeScript to a new version, this procedure is required:

1. Remove current patch:

   ```bash
   pnpm patch-remove typescript@5.5.4 # <-- look this up in package.json#pnpm.patchedDependencies
   ```

2. Update `typescript` everywhere:

   ```bash
   pnpm -r update typescript@5.6.3 # <-- new version here
   ```

3. Run:

   ```bash
   pnpm --package="@patricktree/pkg-management@2.1.0" dlx create-pnpm-patch-via-ts-patch \
      --typescript-version=5.6.3 \ # <-- new version of `typescript` here
      --ts-patch-version=3.3.0 # <-- latest version of `ts-patch` here
   ```

In the future, when all tools (like Node.js, Next.js builds, Playwright, ...) support ["subpath imports"](https://nodejs.org/api/packages.html#subpath-imports) correctly, we can configure `#pkg/*` imports via subpath imports and remove that "patching" approach altogether.

### Git Hooks

- Husky is configured for git hooks
- Pre-commit hooks run linting and formatting checks

### CI/CD

- GitHub Actions workflows handle testing and publishing
- Changesets manage versioning and changelogs
