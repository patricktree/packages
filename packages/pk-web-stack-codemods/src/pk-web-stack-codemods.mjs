#!/usr/bin/env node
import * as commander from '@commander-js/extra-typings';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

import { check } from '@patricktree/commons-ecma/util/assert';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const PATHS = {
  CODEMODS_DIR: path.join(__dirname, 'codemods'),
};

const program = new commander.Command()
  .addOption(new commander.Option('--monorepo-path <path>').makeOptionMandatory())
  .addOption(
    new commander.Option(
      '--codemod <codemod-number>',
      'e.g. "01", "01-sync-monorepos"',
    ).makeOptionMandatory(),
  );
program.parse();
const opts = program.opts();

const dirents = await fs.promises.readdir(PATHS.CODEMODS_DIR);
const codemodToApply = dirents.find((dirent) => dirent.startsWith(opts.codemod));
if (!codemodToApply) {
  throw new Error(`could not find codemod which should get applied!`);
}

const codemodToExecute = /** @type {unknown} */ (
  await import(path.join(PATHS.CODEMODS_DIR, codemodToApply, `codemod.mjs`))
);
assert(check.isNotNullish(codemodToExecute) && typeof codemodToExecute['run'] === 'function');
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
await codemodToExecute['run']({ monorepoPath: path.resolve(opts.monorepoPath) });
