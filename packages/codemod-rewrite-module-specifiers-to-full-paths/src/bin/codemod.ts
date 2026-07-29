#!/usr/bin/env node

import * as commander from "@commander-js/extra-typings";
import fs from "node:fs";

import { loadTypeScriptProgram } from "#pkg/load-typescript-program.js";
import { rewriteModuleSpecifiersOfTypeScriptProject } from "#pkg/transform/index.js";

const commanderProgram = new commander.Command()
  .addOption(
    new commander.Option(
      "--project <path-to-tsconfig-json>",
      'Path to the TypeScript configuration file (e.g. "./tsconfig.json").',
    ).makeOptionMandatory(),
  )
  .addOption(
    new commander.Option(
      "--basepath <path>",
      'A root directory to resolve relative path entries in the TypeScript config file to (e.g. option "outDir"). If omitted, the directory of the TypeScript configuration file passed with "--project" is used.',
    ),
  );
commanderProgram.parse();
const options = commanderProgram.opts();

async function run() {
  const { default: pLimit } = await import("p-limit");

  const typeScriptProgram = await loadTypeScriptProgram(options);

  const limit = pLimit(10);
  const operations = typeScriptProgram.fileNames.map((absolutePathSourceFile) =>
    limit(async () => {
      const text = await fs.promises.readFile(absolutePathSourceFile, "utf8");
      const newText = rewriteModuleSpecifiersOfTypeScriptProject(
        typeScriptProgram,
        absolutePathSourceFile,
        text,
      );
      await fs.promises.writeFile(absolutePathSourceFile, newText);
    }),
  );
  await Promise.all(operations);
}

void run();
