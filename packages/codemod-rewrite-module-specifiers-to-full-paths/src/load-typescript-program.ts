import path from 'node:path';
import invariant from 'tiny-invariant';
import ts from 'typescript';

import { fsUtils } from '@patricktree/commons-node/utils/fs';

export type TypeScriptProgram = {
  compilerOptions: ts.CompilerOptions;
  paths:
    | {
        absoluteBasePath: string;
        patterns: ReadonlyArray<string | ts.Pattern>;
      }
    | undefined;
  fileNames: string[];
};

export async function loadTypeScriptProgram(opts: {
  project: string;
  basepath?: string | undefined;
}): Promise<TypeScriptProgram> {
  const projectAbsolutePath = path.resolve(opts.project);
  invariant(
    await fsUtils.existsPath(projectAbsolutePath),
    `expected to find project, but did not! projectAbsolutePath=${projectAbsolutePath}`,
  );

  const basepath = opts.basepath ?? path.dirname(projectAbsolutePath);

  const configFile = ts.readConfigFile(projectAbsolutePath, ts.sys.readFile.bind(ts.sys));
  invariant(
    configFile.config,
    `expected to find config, but couldn't! projectAbsolutePath=${projectAbsolutePath}`,
  );
  const { options: compilerOptions, fileNames } = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    basepath,
  );

  const paths = computePathsContext(compilerOptions);

  return {
    compilerOptions,
    paths,
    fileNames,
  };
}

function computePathsContext(compilerOptions: ts.CompilerOptions) {
  let pathsPatterns = compilerOptions.configFile?.configFileSpecs?.pathPatterns;
  if (!compilerOptions.paths) {
    return undefined;
  }

  pathsPatterns = ts.tryParsePatterns(compilerOptions.paths);

  invariant(compilerOptions.pathsBasePath);
  const absoluteBasePath = compilerOptions.baseUrl ?? compilerOptions.pathsBasePath;

  return { absoluteBasePath, patterns: pathsPatterns };
}
