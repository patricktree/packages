# Agent Guide for `@patricktree/webpage-observer`

- Source lives in `src/` (TypeScript) and compiles to `dist/`; edit TS only and run `pnpm run build` (tsc via `tsconfig.project.json`) to refresh the JS Playwright uses.
- Use `pnpm` (workspace root has the lockfile). Package scripts: `pnpm run build`, `pnpm run dev` (watch), `pnpm run lint` / `pnpm run lint:fix`, `pnpm run nuke`/`nuke:artifacts`.
- Playwright tests run from compiled JS: `pnpm start` pulls `mcr.microsoft.com/playwright:v1.56.0-noble` and executes `playwright test --config ./dist/playwright.config.js`. Build first if `dist/` is stale. Run e.g. `pnpm start './src/sentry.spec.ts'` to run tests just for this file (seems like Playwright uses the source file names to filter by file name).
- Playwright file filters are regexes against test file paths; use file-based patterns like `jsnation` instead of test titles or URLs like `jsnation.com`.
- Default test browser runs inside a Docker “Playwright Server” container (host networking, X11 forwarded when not CI). Docker must be available; tests need outbound internet to reach the target sites.
- Path alias `#pkg/*` maps to `./src/*`; keep snapshots under `snapshots/` (see `snapshotPathTemplate` in `src/playwright.config.ts`). Update screenshots intentionally (`--update-snapshots`) and expect EU/Vienna locale/timezone defaults.
