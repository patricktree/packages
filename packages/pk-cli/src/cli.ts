import '@patricktree/runtime-extensions-node';

import * as commander from '@commander-js/extra-typings';
import fs from 'node:fs';
import stream from 'node:stream';

import { fetchCommand } from '#pkg/commands/fetch.js';
import type { CommandResult } from '#pkg/types.js';

const outputTypes = ['console', 'file'] as const;
type OutputType = (typeof outputTypes)[number];

const runCommand = new commander.Command('fetch')
  .addOption(
    new commander.Option('--output <output-type>')
      .choices(outputTypes)
      .makeOptionMandatory()
      .default('console'),
  )
  .addOption(new commander.Option('--include-body'))
  .addArgument(new commander.Argument('<url>'))
  .action(async (url, options) => {
    const commandResult = await fetchCommand({ url, includeBody: options.includeBody });
    await outputTypeToPrintFn[options.output](commandResult);
  });

const program = new commander.Command().addCommand(runCommand);
program.parse();

const outputTypeToPrintFn: Record<
  OutputType,
  (commandResults: CommandResult[]) => void | Promise<void>
> = {
  console: async (commandResults) => {
    for (const result of commandResults) {
      console.log(`\n--- Output for ${result.name} ---`);
      try {
        for await (const chunk of result.output) {
          process.stdout.write(chunk);
        }
      } catch (error) {
        console.error(`Error reading stream for ${result.name}:`, error);
      }
      process.stdout.write('\n');
    }
  },
  file: async (commandResults) => {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
    for (const [index, result] of commandResults.entries()) {
      const filePath = `./${timestamp}-${index + 1}-${result.name}.txt`;
      const fileStream = fs.createWriteStream(filePath, { encoding: 'utf8' });
      try {
        await stream.promises.pipeline(result.output, fileStream);
      } catch (error) {
        console.error(`Error writing file ${filePath}:`, error);
        // Clean up partially written file on error
        try {
          await fs.promises.unlink(filePath);
        } catch {
          // ignore
        }
      }
    }
  },
};
