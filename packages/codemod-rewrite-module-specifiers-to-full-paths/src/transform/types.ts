import type { TypeScriptProgram } from "#pkg/load-typescript-program.js";

export type VisitorContext = {
  absolutePathSourceFile: string;
  compilerOptions: TypeScriptProgram["compilerOptions"];
  paths?: TypeScriptProgram["paths"];
};
