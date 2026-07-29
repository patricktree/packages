# Repository Guidelines

## Project Structure & Module Organization

- `packages/*`: TypeScript libraries and CLIs with `src/`, `tsconfig.json`, and `turbo.jsonc`; builds emit to `dist/`.
- `platform/*`: shared tooling packages (`config-typescript`) used across the workspace.
- `.patricktree-stack/`: git submodule with the shared baseline (oxfmt/oxlint/turbo configs, GitHub Actions) used by all patricktree monorepos. Do not edit it from here; change it in its own repository.
- Root files: `turbo.jsonc` coordinates build/lint/test; `pnpm-workspace.yaml` defines the workspace scope and the dependency catalogs; `package.json#devEngines.runtime` pins the Node.js version.

## Build, Test, and Development Commands

- `pnpm install`: bootstrap with workspace `pnpm` (`package.json#packageManager`); Node.js comes from `devEngines.runtime`.
- `pnpm build`: run `turbo run turbo:build` across packages.
- `pnpm lint` / `pnpm lint:fix`: lint with oxlint after builds per `turbo.jsonc` dependencies; auto-fix with `lint:fix`.
- `pnpm format` / `pnpm format:check`: apply/check oxfmt across the workspace.
- `pnpm fix`: `format` followed by `lint:fix`.
- `pnpm declutter`: run knip to find unused files, exports and dependencies.
- `pnpm validate`: build, lint, test and `declutter` in one go.
- `pnpm --filter <pkg> run build:watch`: package-level watch/compile loop.
- `pnpm clean`: remove build artifacts, turbo caches and `node_modules`.
- Validation when you think you are finished: `pnpm install && pnpm run fix && pnpm run validate && pnpm run format:check`.

## Coding Style & Naming Conventions

- TypeScript-first; follow the shared configs from `@patricktree-stack/config-oxlint`, `@patricktree-stack/config-oxfmt` and `@patricktree/config-typescript`.
- Format with oxfmt; lint with oxlint (`--type-aware`).
- `typescript` resolves to `@typescript/typescript6` and `@typescript/native` to TypeScript 7, both via the pnpm catalog in `pnpm-workspace.yaml`. Add them as `catalog:` entries, never as literal versions.
- Prefer `camelCase` for functions/variables, `PascalCase` for types/classes, and lower-case descriptive filenames under `src/`.
- Only disable oxlint rules when there is truly no other viable option; prefer code or config fixes instead, and always state the reason in a comment.
- Respect each package's module target (CommonJS vs ESM) and keep exports aligned with existing `package.json` fields.

## Testing Guidelines

- Use Vitest where present; co-locate specs alongside source with clear, discoverable names.
- Create "package consumption scenarios" tests like `packages/typescript-eslint-rules-requiring-type-info/test-pkg-consumption-scenarios`.
- Before PRs, run targeted tests via `pnpm --filter <pkg> test`.

## Commit & Pull Request Guidelines

- Follow Conventional Commits as seen in history (`chore:`, `fix(scope):`, `ci:`, `refactor:`); include scope when useful.
- Add a Changeset (`pnpm changeset`) for user-facing package changes; omit for tooling-only tweaks unless publishing impact.
- PRs should describe intent, affected packages, and commands run (`build`, `lint`, relevant tests); link issues and include screenshots/logs for UX/CLI changes when helpful.
