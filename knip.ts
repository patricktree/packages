import type { KnipConfig } from "knip";

/**
 * The packages here are published as compiled output: their `package.json` `exports`/`bin` fields
 * point into `dist/`, which knip cannot map back to `src/`. Every workspace therefore declares its
 * entry points in source terms.
 *
 * Packages whose `exports` contain a wildcard (`"./*": "./dist/*.js"`) publish all of `src/**` as
 * public API, so all of `src/**` is an entry point for them.
 */
const config: KnipConfig = {
  $schema: "./node_modules/knip/schema.json",
  /* `commons-ecma` deliberately keeps `serializeErrorWithClause` as a `@deprecated` alias of
     `serializeErrorWithCause`; it is published since 3.1.1, so dropping it would break consumers */
  exclude: ["duplicates"],
  ignore: [
    /* ignore the patricktree-stack packages themselves, since they are not part of this monorepo */
    ".patricktree-stack/**",
    /* the codemod fixtures are inputs and expected outputs of the codemod, not project code */
    "packages/codemod-rewrite-module-specifiers-to-full-paths/test/codemod-inputs/**",
    "packages/codemod-rewrite-module-specifiers-to-full-paths/test/codemod-outputs/**",
    /* package consumption scenarios are standalone projects installed at test time */
    "packages/typescript-eslint-rules-requiring-type-info/test-pkg-consumption-scenarios/**",
  ],
  workspaces: {
    ".": {
      ignoreDependencies: [
        "husky",
        /* the TypeScript 7 binary is invoked by oxlint-tsgolint, not imported anywhere */
        "@typescript/native",
        /* oxlint doesn't resolve its JS plugins correctly, we need it in the root node_modules */
        "eslint-plugin-react-you-might-not-need-an-effect",
      ],
    },
    "packages/codemod-rewrite-module-specifiers-to-full-paths": {
      entry: ["src/bin/*.ts", "test/*.spec.mts"],
    },
    "packages/commons-ecma": { entry: ["src/**/*.ts"] },
    "packages/commons-node": { entry: ["src/**/*.ts"] },
    "packages/eslint-plugin-code-import-patterns": { entry: ["src/**/*.ts"] },
    "packages/fetch-favicon": { entry: ["src/**/*.ts"] },
    "packages/fetch-sitemap-locations": {
      entry: ["src/index.ts", "src/bin/*.ts", "bin/*.js"],
    },
    "packages/pk-cli": { entry: ["bin/*.js", "src/cli.ts"] },
    "packages/pkg-consumption-test": { entry: ["src/cli.ts"] },
    "packages/pkg-management": {
      entry: ["src/*.mjs"],
      /* required peer dependency of the `@pnpm/*` packages, not imported directly */
      ignoreDependencies: ["@pnpm/logger"],
      /* `add-all-tsconfigs-as-project-references` formats its output with the *consuming*
         repository's prettier, which this monorepo no longer has */
      ignoreBinaries: ["prettier"],
    },
    "packages/runtime-extensions-node": { entry: ["src/index.ts"] },
    "packages/typescript-eslint-rules-requiring-type-info": { entry: ["src/**/*.ts"] },
    "packages/webpage-observer": {
      entry: ["src/playwright.config.ts", "src/**/*.spec.ts"],
    },
  },
};

export default config;
