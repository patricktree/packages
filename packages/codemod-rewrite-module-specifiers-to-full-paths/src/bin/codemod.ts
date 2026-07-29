#!/usr/bin/env node

import * as commander from "@commander-js/extra-typings";
import { ConsoleLogRecordExporter, SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { NodeSDK } from "@opentelemetry/sdk-node";
import fs from "node:fs";

import { loadTypeScriptProgram } from "#pkg/load-typescript-program.js";
import { logger } from "#pkg/otel-logger.js";
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
  )
  .addOption(new commander.Option("--debug").default(false));
commanderProgram.parse();
const options = commanderProgram.opts();
const { debug } = options;
let nodeSdk: NodeSDK | undefined;
if (debug) {
  nodeSdk = new NodeSDK({
    logRecordProcessors: [new SimpleLogRecordProcessor(new ConsoleLogRecordExporter())],
  });
  nodeSdk.start();
}

async function run() {
  const { default: pLimit } = await import("p-limit");

  const typeScriptProgram = await loadTypeScriptProgram(options);
  logger.debug("Loaded TypeScript program", { fileCount: typeScriptProgram.fileNames.length });

  const limit = pLimit(10);
  const operations = typeScriptProgram.fileNames.map((absolutePathSourceFile) =>
    limit(async () => {
      logger.debug("Reading source file", { absolutePathSourceFile });
      const text = await fs.promises.readFile(absolutePathSourceFile, "utf8");
      logger.debug("Rewriting module specifiers", { absolutePathSourceFile });
      const newText = rewriteModuleSpecifiersOfTypeScriptProject(
        typeScriptProgram,
        absolutePathSourceFile,
        text,
      );
      if (newText === text) {
        logger.debug("No module specifier changes", { absolutePathSourceFile });
      } else {
        logger.debug("Rewrote module specifiers", { absolutePathSourceFile });
      }
      await fs.promises.writeFile(absolutePathSourceFile, newText);
    }),
  );
  await Promise.all(operations);
  logger.debug("Completed module specifier rewrite");
}

void run().finally(async () => {
  if (nodeSdk) {
    await nodeSdk.shutdown();
  }
});
