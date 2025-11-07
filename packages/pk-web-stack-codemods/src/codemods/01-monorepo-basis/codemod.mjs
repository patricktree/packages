import deepmerge from 'deepmerge';
import fastGlob from 'fast-glob';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { $ } from 'zx';

import { check } from '@patricktree/commons-ecma/util/assert';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const PACKAGE_JSON_KEY_ORDER = [
  'name',
  'private',
  'scripts',
  'devDependencies',
  'packageManager',
  'engines',
  'pnpm',
];

const templatesDir = path.join(__dirname, 'templates');
const paths = {
  templates: {
    npmrc: path.join(templatesDir, 'template-.npmrc'),
    gitattributes: path.join(templatesDir, 'template-.gitattributes'),
    gitignore: path.join(templatesDir, 'template-.gitignore'),
    nvmrc: path.join(templatesDir, 'template-.nvmrc'),
    prettierignore: path.join(templatesDir, 'template-.prettierignore'),
    prettierrc: path.join(templatesDir, 'template-.prettierrc.js'),
    packageJson: path.join(templatesDir, 'template-package.json'),
    huskyPreCommit: path.join(templatesDir, 'template-.husky-pre-commit'),
    vscodeSettingsJson: path.join(templatesDir, 'template-.vscode-settings.json'),
    superturboDir: path.join(templatesDir, 'template-superturbo'),
  },
};

/**
 * @param {import("#pkg/types.js").CodemodRunOptions} options
 */
export async function run({ monorepoPath }) {
  const destPaths = {
    npmrc: path.join(monorepoPath, '.npmrc'),
    gitattributes: path.join(monorepoPath, '.gitattributes'),
    gitignore: path.join(monorepoPath, '.gitignore'),
    nvmrc: path.join(monorepoPath, '.nvmrc'),
    prettierignore: path.join(monorepoPath, '.prettierignore'),
    prettierrc: path.join(monorepoPath, '.prettierrc.js'),
    rootPackageJson: path.join(monorepoPath, 'package.json'),
    huskyPreCommit: path.join(monorepoPath, '.husky', 'pre-commit'),
    vscodeSettingsJson: path.join(monorepoPath, '.vscode', 'settings.json'),
    superturboDir: path.join(monorepoPath, 'platform', 'superturbo'),
  };

  const [
    npmrcContent,
    gitattributesContent,
    gitignoreContent,
    nvmrcContent,
    prettierignoreContent,
    prettierrcContent,
    huskyPreCommitContent,
    vscodeSettingsJsonContent,
  ] = await Promise.all([
    fs.promises.readFile(paths.templates.npmrc, 'utf8'),
    fs.promises.readFile(paths.templates.gitattributes, 'utf8'),
    fs.promises.readFile(paths.templates.gitignore, 'utf8'),
    fs.promises.readFile(paths.templates.nvmrc, 'utf8'),
    fs.promises.readFile(paths.templates.prettierignore, 'utf8'),
    fs.promises.readFile(paths.templates.prettierrc, 'utf8'),
    fs.promises.readFile(paths.templates.huskyPreCommit, 'utf8'),
    fs.promises.readFile(paths.templates.vscodeSettingsJson, 'utf8'),
  ]);
  await Promise.all([
    writeAndFormat(destPaths.npmrc, npmrcContent),
    writeAndFormat(destPaths.gitattributes, gitattributesContent),
    writeAndFormat(destPaths.gitignore, gitignoreContent),
    writeAndFormat(destPaths.nvmrc, nvmrcContent),
    writeAndFormat(destPaths.prettierignore, prettierignoreContent),
    writeAndFormat(destPaths.prettierrc, prettierrcContent),
    writeAndFormat(destPaths.huskyPreCommit, huskyPreCommitContent),
    writeAndFormat(destPaths.vscodeSettingsJson, vscodeSettingsJsonContent),
  ]);
  await fs.promises.cp(paths.templates.superturboDir, destPaths.superturboDir, {
    recursive: true,
    force: true,
  });
  await $`pnpm exec prettier --write --ignore-unknown '${destPaths.superturboDir}/**'`;

  const origRootPackageJsonContent = /** @type {unknown} */ (
    JSON.parse(await fs.promises.readFile(destPaths.rootPackageJson, 'utf8'))
  );
  assert(check.isNotNullish(origRootPackageJsonContent));
  assert(typeof origRootPackageJsonContent['name'] === 'string');
  const monorepoScope = `@${origRootPackageJsonContent['name']}`;
  const templatePackageJsonStr = (await fs.promises.readFile(paths.templates.packageJson, 'utf8'))
    // eslint-disable-next-line unicorn/no-await-expression-member
    .replace(/@monorepo-scope/g, monorepoScope);
  const templatePackageJsonContent = /** @type {unknown} */ (JSON.parse(templatePackageJsonStr));
  assert(check.isNotNullish(templatePackageJsonContent));

  const newRootPackageJsonEntries = Object.entries(
    deepmerge(origRootPackageJsonContent, templatePackageJsonContent),
  );
  newRootPackageJsonEntries.sort(
    ([keyA, _valueA], [keyB, _valueB]) =>
      PACKAGE_JSON_KEY_ORDER.indexOf(keyA) - PACKAGE_JSON_KEY_ORDER.indexOf(keyB),
  );
  const newRootPackageJson = Object.fromEntries(newRootPackageJsonEntries);
  assert(check.isNotNullish(newRootPackageJson['devDependencies']));
  newRootPackageJson['devDependencies'] = Object.fromEntries(
    Object.entries(newRootPackageJson['devDependencies']).sort((a, b) => a[0].localeCompare(b[0])),
  );

  await fs.promises.writeFile(
    destPaths.rootPackageJson,
    JSON.stringify(newRootPackageJson),
    'utf8',
  );
  await $`pnpm exec prettier --write ${destPaths.rootPackageJson}`;

  const allFiles = await fastGlob(['**/*', '!node_modules/**'], {
    cwd: monorepoPath,
    followSymbolicLinks: false,
    absolute: true,
    dot: true,
    onlyFiles: true,
  });
  await Promise.all(
    allFiles.map(async (file) => {
      const content = await fs.promises.readFile(file, 'utf8');
      const newContent = content.replace(/@monorepo-scope/g, monorepoScope);
      if (content !== newContent) {
        await fs.promises.writeFile(file, newContent, 'utf8');
      }
    }),
  );
}

/**
 * @param {string} path
 * @param {string} content
 */
async function writeAndFormat(path, content) {
  await fs.promises.writeFile(path, content, 'utf8');
  await $`pnpm exec prettier --write --ignore-unknown ${path}`;
}
