import { config as baseConfig } from "@patricktree-stack/config-oxlint/oxlint-base.js";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [baseConfig],
  /* the package consumption scenarios are standalone projects, installed and compiled at test time
     with their own (deliberately old) TypeScript versions and configs */
  ignorePatterns: ["test-pkg-consumption-scenarios/**"],
});
