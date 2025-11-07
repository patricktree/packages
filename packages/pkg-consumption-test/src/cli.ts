import { Command } from '@commander-js/extra-typings';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

import { check } from '@patricktree/commons-ecma/util/assert';

import { startTest } from '#pkg/start-test.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const packageJson: unknown = JSON.parse(
  await fs.promises.readFile(path.join(__dirname, '..', 'package.json'), { encoding: 'utf8' }),
);

assert(check.isNotNullish(packageJson));
assert(typeof packageJson['version'] === 'string');

const program = new Command()
  .version(packageJson['version'])
  .requiredOption(
    '--packageName <name>',
    'Name of the package to publish (into Verdaccio) and run the scenarios for',
  )
  .option(
    '--pathToPackageRoot <path>',
    'Absolute or relative path to the package; "npm publish" will be invoked there (default: ".")\'',
    '.',
  )
  .requiredOption(
    '--pathToScenariosDirectory <path>',
    "Absolute or relative path to the directory containing the consumption test scenarios'",
  );

program.parse();
const options = program.opts();

await startTest({
  packageName: options.packageName,
  pathToPackageRoot: options.pathToPackageRoot,
  pathToScenariosDirectory: options.pathToScenariosDirectory,
});
