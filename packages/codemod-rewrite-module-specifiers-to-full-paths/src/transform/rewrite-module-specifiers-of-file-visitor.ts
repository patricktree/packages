/* eslint-disable unicorn/no-array-method-this-argument -- false positives for `jscodeshift` `find` method */
import jscodeshift from "jscodeshift";
import invariant from "tiny-invariant";

import { resolveModuleSpecifierToFullPath } from "#pkg/transform/resolve-module-specifier-to-full-path.js";
import type { VisitorContext } from "#pkg/transform/types.js";

type QuoteToUseRef = {
  value: NonNullable<Parameters<jscodeshift.Collection["toSource"]>[0]>["quote"];
};

export function rewriteModuleSpecifiersOfFileVisitor(
  opts: VisitorContext & {
    text: string;
  },
): string {
  /**
   * Recast, used when `jscodeshift` `toSource` is called, changes the quotes of the source code. So
   * we just detect the quote style used in our source code for module specifiers and use that.
   *
   * @see {@link https://github.com/benjamn/recast/issues/171#issuecomment-224996336}
   */
  const quoteToUseRef: QuoteToUseRef = { value: undefined };

  const root = jscodeshift.withParser("tsx")(opts.text);
  const astNodesWithModuleSpecifiers = [
    /**
     * @example
     *   ```typescript
     *   import defaultExport from "#pkg/some-module.js";
     *   import * as name from "#pkg/some-module.js";
     *   import { noop } from "#pkg/some-module.js";
     *   ```;
     */
    root.find(jscodeshift.ImportDeclaration, {
      source: {
        type: "StringLiteral",
      },
    }),

    /**
     * @example
     *   ```typescript
     *   export * from "#pkg/some-module.js";
     *   ```;
     */
    root.find(jscodeshift.ExportAllDeclaration, {
      source: {
        type: "StringLiteral",
      },
    }),

    /**
     * @example
     *   ```typescript
     *   export { noop } from "#pkg/some-module.js";
     *   ```;
     */
    root.find(jscodeshift.ExportNamedDeclaration, {
      source: {
        type: "StringLiteral",
      },
    }),

    /**
     * @example
     *   ```typescript
     *   await import("#pkg/some-module.js");
     *   typeof import("#pkg/some-module.js");
     *   ```;
     */
    root.find(jscodeshift.ImportExpression, {
      source: {
        type: "StringLiteral",
      },
    }),
    root.find(jscodeshift.CallExpression, {
      callee: {
        type: "Import",
      },
    }),

    /**
     * @example
     *   ```typescript
     *   require("#pkg/some-module.js");
     *   ```;
     */
    root.find(jscodeshift.CallExpression, {
      callee: {
        type: "Identifier",
        name: "require",
      },
    }),

    /**
     * @example
     *   ```typescript
     *   import foo = require("#pkg/some-module.js");
     *   ```;
     */
    root.find(jscodeshift.TSExternalModuleReference, {
      expression: {
        type: "StringLiteral",
      },
    }),

    /**
     * @example
     *   ```typescript
     *   type Type = import("#pkg/some-module.js").Type;
     *   ```;
     */
    root.find(jscodeshift.TSImportType, {
      argument: {
        type: "StringLiteral",
      },
    }),

    /**
     * @example
     *   ```typescript
     *   declare module "#pkg/some-module.js" {}
     *   ```;
     */
    root.find(jscodeshift.TSModuleDeclaration, {
      id: {
        type: "StringLiteral",
      },
    }),
  ];
  for (const astNodes of astNodesWithModuleSpecifiers) {
    rewriteModuleSpecifiersOfASTNodes({ ...opts, astNodes, quoteToUseRef });
  }

  return root.toSource({ quote: quoteToUseRef.value });
}

function rewriteModuleSpecifiersOfASTNodes(
  opts: VisitorContext & {
    astNodes: jscodeshift.Collection;
    quoteToUseRef: QuoteToUseRef;
  },
) {
  return (
    opts.astNodes
      .find(jscodeshift.StringLiteral)
      // eslint-disable-next-line unicorn/no-array-for-each -- false positive
      .forEach((path) => {
        // store the quote style used for the module specifier
        invariant(
          "extra" in path.node &&
            typeof path.node.extra === "object" &&
            path.node.extra !== null &&
            "raw" in path.node.extra &&
            typeof path.node.extra.raw === "string" &&
            (path.node.extra.raw.startsWith('"') || path.node.extra.raw.startsWith("'")),
        );
        if (path.node.extra.raw.startsWith("'")) {
          opts.quoteToUseRef.value = "single";
        } else if (path.node.extra.raw.startsWith('"')) {
          opts.quoteToUseRef.value = "double";
        }

        // resolve new module specifier and replace it
        const originalModuleSpecifier = path.node.value;
        const newModuleSpecifier = resolveModuleSpecifierToFullPath({
          ...opts,
          originalModuleSpecifier,
        });
        path.node.value = newModuleSpecifier;
      })
  );
}
