import { createBaseConfig } from "@patricktree-stack/config-oxfmt/oxfmt-base.js";
import { defineConfig } from "oxfmt";

const baseConfig = createBaseConfig({
  patricktreeStackGitSubmoduleRelativePath: ".patricktree-stack",
});

export default defineConfig({
  ...baseConfig,
  ignorePatterns: [
    ...baseConfig.ignorePatterns,
    /* codemod fixtures are byte-compared by the tests and must not be reformatted */
    "/packages/codemod-rewrite-module-specifiers-to-full-paths/test/codemod-inputs/**",
    "/packages/codemod-rewrite-module-specifiers-to-full-paths/test/codemod-outputs/**",
    /* package consumption scenarios are standalone projects with their own formatting */
    "/packages/typescript-eslint-rules-requiring-type-info/test-pkg-consumption-scenarios/**",
  ],
  sortImports: {
    customGroups: [
      /* create a group for patricktree packages to separate them from other external dependencies */
      {
        groupName: "patricktree-packages",
        elementNamePattern: ["@patricktree/**"],
      },
      /* create a group for subpath imports = internal dependencies */
      {
        groupName: "subpath-imports",
        elementNamePattern: ["#pkg/**"],
      },
      /* create a group for subpath imports for test modules */
      {
        groupName: "subpath-imports-test-modules",
        elementNamePattern: ["#pkg-test/**"],
      },
    ],
    groups: [
      ["value-builtin", "type-builtin", "value-external", "type-external"],
      ["value-external", "type-external"],
      ["value-internal", "type-internal"],
      "patricktree-packages",
      "subpath-imports",
      "subpath-imports-test-modules",
      ["value-parent", "type-parent", "value-sibling", "type-sibling", "value-index", "type-index"],
      "unknown",
    ],
  },
});
