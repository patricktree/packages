import { type TypeScriptProgram } from '#pkg/load-typescript-program.js';
import { rewriteModuleSpecifiersOfFileVisitor } from '#pkg/transform/rewrite-module-specifiers-of-file-visitor.js';
import type { VisitorContext } from '#pkg/transform/types.js';

export function rewriteModuleSpecifiersOfTypeScriptProject(
  typeScriptProgram: TypeScriptProgram,
  absolutePathSourceFile: string,
  text: string,
): string {
  const visitorContext: VisitorContext = {
    absolutePathSourceFile,
    compilerOptions: typeScriptProgram.compilerOptions,
    paths: typeScriptProgram.paths,
  };

  const newText = rewriteModuleSpecifiersOfFileVisitor({ ...visitorContext, text });

  return newText;
}
