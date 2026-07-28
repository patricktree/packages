import path from "node:path";
import invariant from "tiny-invariant";
import ts from "typescript";

import type { VisitorContext } from "#pkg/transform/types.js";

const tsExtensionToJsExtensionMap = {
  /* map .d.ts and its variants to just .js */
  ".d.ts": ".js",
  ".d.tsx": ".js",
  ".d.mts": ".mjs",
  ".d.mtsx": ".mjs",
  ".d.cts": ".cjs",
  ".d.ctsx": ".cjs",

  /* map .ts and its variants to .js */
  ".ts": ".js",
  ".tsx": ".js",
  ".mts": ".mjs",
  ".mtsx": ".mjs",
  ".cts": ".cjs",
  ".ctsx": ".cjs",

  /* keep js extensions */
  ".js": ".js",
  ".jsx": ".jsx",
  ".mjs": ".mjs",
  ".mjsx": ".mjsx",
  ".cjs": ".cjs",
  ".cjsx": ".cjsx",
} as const;

export function resolveModuleSpecifierToFullPath(
  opts: VisitorContext & {
    originalModuleSpecifier: string;
  },
): string {
  // determine if the given module specifier matches a "paths" pattern
  const pathsPatternMatched =
    !!opts.paths && !!ts.matchPatternOrExact(opts.paths.patterns, opts.originalModuleSpecifier);

  // ignore module specifiers which are not absolute paths, relative paths, or "paths" patterns
  if (
    !isAbsolutePathModuleSpecifier(opts.originalModuleSpecifier) &&
    !isRelativePathModuleSpecifier(opts.originalModuleSpecifier) &&
    !pathsPatternMatched
  ) {
    return opts.originalModuleSpecifier;
  }

  return resolveToExactModuleSpecifier(opts);
}

export function resolveToExactModuleSpecifier(
  opts: VisitorContext & {
    originalModuleSpecifier: string;
  },
) {
  // use TypeScript to resolve the module specifier from the source file to a full path
  const { resolvedModule } = ts.resolveModuleName(
    opts.originalModuleSpecifier,
    opts.absolutePathSourceFile,
    opts.compilerOptions,
    ts.sys,
  );

  if (!resolvedModule) {
    // could be e.g. a ".png" modules specifier which is resolved by a bundler
    return opts.originalModuleSpecifier;
  }

  /*
   * We have 1 of 3 cases here:
   *
   * 1. The module specifier is a "paths" pattern (e.g. "#pkg/internal/transformer")
   * 2. The module specifier is a relative path (e.g. "./internal/transformer.ts")
   * 3. The module specifier is an absolute path (e.g. "/home/user/project/src/internal/transformer.ts")
   *
   * The "paths" pattern case is the most complex one, as mapping the module specifier to a full path
   * requires us to consider the "paths" configuration in the TypeScript configuration file.
   * The TypeScript Compiler API has only limited APIs exposed to us to
   * - remove the "paths" prefix from the module specifier
   * - as well as to compute the destination path(s) for a given paths pattern
   *
   * Luckily it is not that hard to implement this ourselves.
   */

  let newModuleSpecifier;
  if (opts.paths) {
    const matchedPathsPattern = ts.matchPatternOrExact(
      opts.paths.patterns,
      opts.originalModuleSpecifier,
    );
    if (
      matchedPathsPattern &&
      // ignore patterns which do not have a star in them and thus, resolve to concrete file(s) anyways
      typeof matchedPathsPattern !== "string"
    ) {
      if (matchedPathsPattern.suffix !== "") {
        throw new TypeError(`patterns with suffixes are not supported`);
      }
      invariant(opts.compilerOptions.paths);
      const pathsDestinationPatterns =
        opts.compilerOptions.paths[ts.patternText(matchedPathsPattern)];
      invariant(pathsDestinationPatterns);

      const parsedDestinationPatterns = pathsDestinationPatterns
        .map((pathDestinationPattern) => {
          const parsedPattern = ts.tryParsePattern(pathDestinationPattern);
          if (!parsedPattern) {
            // invalid pattern
            return undefined;
          }
          const prefix = typeof parsedPattern === "string" ? parsedPattern : parsedPattern.prefix;
          const suffix = typeof parsedPattern === "string" ? undefined : parsedPattern.suffix;
          invariant(opts.paths);
          return {
            fullPrefix: path.join(opts.paths.absoluteBasePath, prefix),
            prefix,
            suffix,
          };
        })
        .filter((elem) => elem !== undefined);

      const matchingDestinationPattern = parsedDestinationPatterns.find((destinationPattern) => {
        return resolvedModule.resolvedFileName.startsWith(destinationPattern.fullPrefix);
      });
      invariant(
        matchingDestinationPattern,
        `could not resolve the destination pattern although the module specifier matched a "paths" pattern! ` +
          `opts.originalModuleSpecifier=${opts.originalModuleSpecifier}, matchedPathsPattern.prefix=${matchedPathsPattern.prefix}, ` +
          `opts.paths.absoluteBasePath=${opts.paths.absoluteBasePath}` +
          `parsedDestinationPatterns=${JSON.stringify(parsedDestinationPatterns)}, resolvedModule.resolvedFileName=${resolvedModule.resolvedFileName}`,
      );

      // e.g. "#pkg/internal/transformer" -> "internal/transformer"
      const origModuleNameWithoutPattern = opts.originalModuleSpecifier.slice(
        matchedPathsPattern.prefix.length,
      );

      // e.g. "/home/user/project/src/internal/transformer.ts" -> "internal/transformer.ts"
      const resolvedModuleName = resolvedModule.resolvedFileName.slice(
        matchingDestinationPattern.fullPrefix.length,
      );

      // e.g. "internal/transformer.ts" --> "internal/transformer.js"
      let resolvedModuleNameMappedExt;
      for (const [fromExtname, toExtname] of Object.entries(tsExtensionToJsExtensionMap)) {
        if (resolvedModuleName.endsWith(fromExtname)) {
          resolvedModuleNameMappedExt =
            resolvedModuleName.slice(0, -fromExtname.length) + toExtname;
          break;
        }
      }
      invariant(resolvedModuleNameMappedExt);

      // e.g. origModuleNameWithoutPattern="internal/transformer" and resolvedModuleNameMappedExt="internal/transformer.js" --> ".js"
      const slugToAdd = resolvedModuleNameMappedExt.slice(origModuleNameWithoutPattern.length);

      // e.g. "#pkg/", "internal/transformer", "ts" --> "#pkg/internal/transformer.ts"
      newModuleSpecifier = `${matchedPathsPattern.prefix}${origModuleNameWithoutPattern}${slugToAdd}`;
    }
  }

  if (newModuleSpecifier === undefined) {
    // we have no "paths" patterns at all or none matched --> must be a module specifier which is a relative path or an absolute path
    invariant(
      isRelativePathModuleSpecifier(opts.originalModuleSpecifier) ||
        isAbsolutePathModuleSpecifier(opts.originalModuleSpecifier),
    );
    const moduleSpecifierAbsolutePath = opts.originalModuleSpecifier.startsWith("/")
      ? opts.originalModuleSpecifier
      : path.join(path.dirname(opts.absolutePathSourceFile), opts.originalModuleSpecifier);

    // e.g. "internal/transformer.ts" --> "internal/transformer.js"
    let resolvedFileNameMappedExt;
    for (const [fromExtname, toExtname] of Object.entries(tsExtensionToJsExtensionMap)) {
      if (resolvedModule.resolvedFileName.endsWith(fromExtname)) {
        resolvedFileNameMappedExt =
          resolvedModule.resolvedFileName.slice(0, -fromExtname.length) + toExtname;
        break;
      }
    }
    invariant(resolvedFileNameMappedExt);

    const slugToAdd = resolvedFileNameMappedExt.slice(moduleSpecifierAbsolutePath.length);
    newModuleSpecifier = `${opts.originalModuleSpecifier}${slugToAdd}`;
  }

  return newModuleSpecifier;
}

function isAbsolutePathModuleSpecifier(moduleSpecifier: string) {
  return moduleSpecifier.startsWith("/");
}

function isRelativePathModuleSpecifier(moduleSpecifier: string) {
  return moduleSpecifier.startsWith(".");
}
