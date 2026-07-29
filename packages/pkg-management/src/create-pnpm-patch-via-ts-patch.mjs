import "#pkg/polyfill-explicit-resource-management.mjs";
import * as commander from "@commander-js/extra-typings";
import fs from "node:fs";
import { temporaryDirectory } from "tempy";
import { $ } from "zx";

const program = new commander.Command()
  .addOption(new commander.Option("--typescript-version <version>").makeOptionMandatory())
  .addOption(new commander.Option("--ts-patch-version <version>").makeOptionMandatory());
program.parse();
const opts = program.opts();

await using typeScriptTempDir = createTempDir();
await $`pnpm patch --edit-dir=${typeScriptTempDir.path} typescript@${opts.typescriptVersion}`;
await $`pnpm --package='typescript@${opts.typescriptVersion}' --package='ts-patch@${opts.tsPatchVersion}' dlx ts-patch --dir=${typeScriptTempDir.path} install`;
await $`pnpm patch-commit ${typeScriptTempDir.path}`;

function createTempDir() {
  const dir = temporaryDirectory();
  return {
    path: dir,
    async [Symbol.asyncDispose]() {
      await fs.promises.rm(dir, { recursive: true });
    },
  };
}
