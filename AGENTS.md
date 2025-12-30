# Repository Guidelines

## Project Structure & Module Organization

- `packages/*`: TypeScript libraries and CLIs with `src/`, `tsconfig.json`, and `turbo.json`; builds emit to `dist/`.
- `platform/*`: shared tooling packages (`eslint-config`, `config-typescript`, `superturbo`) used across the workspace.
- `test/*`: fixture packages (e.g., `test/test-package-for-pkg-consumption-test`) used in integration scenarios.
- `patches/`: patched dependencies (TypeScript patch referenced in `package.json#pnpm.patchedDependencies`).
- Root files: `tsconfig.json` references all projects; `turbo.json` coordinates build/lint; `.nvmrc` and `pnpm-workspace.yaml` define runtime and workspace scope.

## Build, Test, and Development Commands

- `pnpm install`: bootstrap with workspace `pnpm` (`package.json#packageManager`)
- `pnpm build`: run `superturbo build` across packages (turbo cache disabled by design).
- `pnpm lint` / `pnpm lint:fix`: lint after builds per `turbo.json` dependencies; auto-fix with `lint:fix`.
- `pnpm format`: apply Prettier across the workspace.
- `pnpm --filter <pkg> run dev`: package-level watch/compile loop when available (e.g., codemods, pkg-consumption-test).
- `pnpm --filter <pkg> test`: run package tests.
- `pnpm nuke`, `pnpm nuke:artifacts`, `pnpm nuke:node-modules`: clean builds, cache folders, and `node_modules`.
- Validation when you think you are finished: `pnpm install && pnpm run format && pnpm run build && pnpm run lint:fix`.

## Coding Style & Naming Conventions

- TypeScript-first; follow shared configs from `@patricktree/eslint-config` and `@patricktree/config-typescript`.
- Format with Prettier
- Prefer `camelCase` for functions/variables, `PascalCase` for types/classes, and lower-case descriptive filenames under `src/`.
- Only disable ESLint rules when there is truly no other viable option; prefer code or config fixes instead.
- Respect each package's module target (CommonJS vs ESM) and keep exports aligned with existing `package.json` fields.

## Testing Guidelines

- Use Vitest where present; co-locate specs alongside source with clear, discoverable names.
- Create "package consumption scenarios" tests like `packages/typescript-eslint-rules-requiring-type-info/test-pkg-consumption-scenarios` and `test/test-package-for-pkg-consumption-test`.
- Before PRs, run targeted tests via `pnpm --filter <pkg> test`.

## Commit & Pull Request Guidelines

- Follow Conventional Commits as seen in history (`chore:`, `fix(scope):`, `ci:`, `refactor:`); include scope when useful.
- Add a Changeset (`pnpm changeset`) for user-facing package changes; omit for tooling-only tweaks unless publishing impact.
- PRs should describe intent, affected packages, and commands run (`build`, `lint`, relevant tests); link issues and include screenshots/logs for UX/CLI changes when helpful.
