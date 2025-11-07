import * as commander from '@commander-js/extra-typings';
import { findWorkspacePackagesNoCheck } from '@pnpm/find-workspace-packages';
import fs from 'node:fs';
import path from 'node:path';
import { $ } from 'zx';

import { check } from '@patricktree/commons-ecma/util/assert';
import { fsUtils } from '@patricktree/commons-node/utils/fs';

const program = new commander.Command()
  .addOption(new commander.Option('--monorepo-path <path>').makeOptionMandatory())
  .addOption(
    new commander.Option(
      '--tsconfig-filename <name>',
      'e.g. "tsconfig.json"',
    ).makeOptionMandatory(),
  );
program.parse();
const opts = program.opts();

const absoluteMonorepoPath = path.resolve(opts.monorepoPath);

// first elem of returned array is the root package.json, the monorepo itself --> discard that
const [_rootProject, ...workspaceProjects] =
  await findWorkspacePackagesNoCheck(absoluteMonorepoPath);

const tsconfigPaths = (
  await Promise.all(
    workspaceProjects.map(async (project) => {
      const tsconfigPath = path.join(project.dir, opts.tsconfigFilename);
      if (await fsUtils.existsPath(tsconfigPath)) {
        return tsconfigPath;
      }
    }),
  )
).filter(check.isNonEmptyString);

const pathToMonorepoTsconfig = path.join(absoluteMonorepoPath, 'tsconfig.json');
await fs.promises.writeFile(
  pathToMonorepoTsconfig,
  JSON.stringify({
    references: tsconfigPaths.map((tsconfigPath) => ({
      path: `./${path.relative(absoluteMonorepoPath, tsconfigPath)}`,
    })),
  }),
);
await $`pnpm exec prettier --write ${pathToMonorepoTsconfig}`;
