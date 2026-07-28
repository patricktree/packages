import { config as baseConfig } from "@patricktree-stack/config-oxlint/oxlint-base.js";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [baseConfig],
  /* the codemod fixtures are inputs and expected outputs of the codemod - they intentionally contain
     the very code patterns this codemod rewrites, so they must not be linted */
  ignorePatterns: ["test/codemod-inputs/**", "test/codemod-outputs/**"],
});
