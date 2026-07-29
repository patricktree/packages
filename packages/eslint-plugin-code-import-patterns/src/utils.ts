// taken from https://github.com/microsoft/vscode/blob/53d1dffaff509283d165f4d08e8ecd97956fc463/build/lib/eslint/utils.ts

import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/experimental-utils";
import type * as eslint from "eslint";

export function createImportRuleListener(
  validateImport: (node: TSESTree.Literal, value: string) => unknown,
): eslint.Rule.RuleListener {
  function checkImportOfNode(node: unknown) {
    if (isTSESTreeLiteral(node) && typeof node.value === "string") {
      validateImport(node, node.value);
    }
  }

  return {
    // import ??? from 'module'
    ImportDeclaration: (node) => {
      checkImportOfNode(node.source);
    },
    // import('module').then(...) OR await import('module')
    'CallExpression[callee.type="Import"][arguments.length=1] > Literal': (node: unknown) => {
      checkImportOfNode(node);
    },
    // import foo = ...
    "TSImportEqualsDeclaration > TSExternalModuleReference > Literal": (node: unknown) => {
      checkImportOfNode(node);
    },
    // export ?? from 'module'
    ExportAllDeclaration: (node) => {
      checkImportOfNode(node.source);
    },
    // export {foo} from 'module'
    ExportNamedDeclaration: (node) => {
      checkImportOfNode(node.source);
    },
  };
}

function isTSESTreeLiteral(node: unknown): node is TSESTree.Literal {
  return isNotNullish(node) && node["type"] === AST_NODE_TYPES.Literal;
}

export function isNullish(obj: unknown): obj is undefined | null {
  return obj === undefined || obj === null;
}

export function isNotNullish<T>(
  obj: T | undefined | null,
  // @ts-expect-error -- We don't care about the "A type predicate's type must be assignable to its parameter's type" error here for the unknown case
): obj is unknown extends T ? { [key: string]: unknown } : T {
  return !isNullish(obj);
}
