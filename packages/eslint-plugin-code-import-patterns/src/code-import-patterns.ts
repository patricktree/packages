// based on https://github.com/microsoft/vscode/blob/324764a4dfadb8be90fe9dd06bb3e8d9639b2cf5/build/lib/eslint/code-import-patterns.ts

import type { TSESTree } from "@typescript-eslint/experimental-utils";
import type * as eslint from "eslint";
import path from "node:path";

import type { ImportPatternsConfig, ObjectPattern, PatternsCollection, Zone } from "#pkg/types.js";
import { createImportRuleListener, isNotNullish } from "#pkg/utils.js";

type MessageId = "noAllowedPatternDidMatch" | "forbiddenPatternWasViolated";
type Messages = {
  [messageId in MessageId]: string;
};
const messages: Messages = {
  noAllowedPatternDidMatch:
    'Imports violates restrictions. None of the allowed patterns did match. allowedPatterns="{{allowedPatterns}}"',
  forbiddenPatternWasViolated: "{{forbiddenPatternsViolationsMessage}}",
};

export class CodeImportPatternsRule implements eslint.Rule.RuleModule {
  public readonly meta: eslint.Rule.RuleMetaData = {
    messages,
  };

  public create(context: eslint.Rule.RuleContext): eslint.Rule.RuleListener {
    /* `context.options` is typed as `any[]` by ESLint - the shape is defined by this rule's own
       schema, so the assertion cannot be replaced by a narrowing check */
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const ruleOption = context.options[0] as ImportPatternsConfig;
    const lintedFilename = ensurePathUsesPosixSeparator(context.filename);
    const patterns = collectAllowedAndForbiddenPatterns(lintedFilename, ruleOption.zones);

    if (patterns.allowedPatterns.length > 0 || patterns.forbiddenPatterns.length > 0) {
      return createImportRuleListener((node, value) =>
        checkImport(context, patterns, node, value, !!ruleOption.matchAgainstAbsolutePaths),
      );
    }

    return {};
  }
}

export const codeImportPatternsRule = new CodeImportPatternsRule();

function checkImport(
  context: eslint.Rule.RuleContext,
  patterns: PatternsCollection,
  node: TSESTree.Node,
  pathOfFile: string,
  matchAgainstAbsolutePaths: boolean,
) {
  // resolve relative paths if "matchAgainstAbsolutePaths" is configured
  if (matchAgainstAbsolutePaths && pathOfFile.startsWith(".")) {
    pathOfFile = path.join(context.filename, pathOfFile);
  }

  let someAllowedPatternDidMatch = false;

  if (patterns.allowedPatterns.length === 0) {
    someAllowedPatternDidMatch = true;
  } else {
    for (const stringOrRegexToTest of patterns.allowedPatterns) {
      if (testPattern(stringOrRegexToTest, pathOfFile)) {
        someAllowedPatternDidMatch = true;
        break;
      }
    }
  }

  const errorMessagesOfViolatedForbiddenPatterns: string[] = [];
  for (const pattern of patterns.forbiddenPatterns) {
    let stringOrRegexToTest: string | RegExp;
    let errorMessage: string | undefined;
    if (typeof pattern === "string") {
      stringOrRegexToTest = pattern;
      errorMessage = `Import pattern "${stringOrRegexToTest}" is not allowed.`;
    } else if (thingIsRegexp(pattern)) {
      stringOrRegexToTest = pattern;
      errorMessage = `Import pattern "${stringOrRegexToTest.source}" is not allowed.`;
    } else if (thingIsObjectPattern(pattern)) {
      stringOrRegexToTest = pattern.pattern;
      errorMessage = pattern.errorMessage;
    } else {
      assertIsUnreachable(pattern);
    }

    if (testPattern(stringOrRegexToTest, pathOfFile)) {
      errorMessagesOfViolatedForbiddenPatterns.push(errorMessage);
    }
  }

  if (errorMessagesOfViolatedForbiddenPatterns.length > 0) {
    const messageId: MessageId = "forbiddenPatternWasViolated";
    context.report({
      loc: node.loc,
      messageId,
      data: {
        forbiddenPatternsViolationsMessage: errorMessagesOfViolatedForbiddenPatterns.join(" "),
      },
    });
  } else if (!someAllowedPatternDidMatch) {
    const messageId: MessageId = "noAllowedPatternDidMatch";
    context.report({
      loc: node.loc,
      messageId,
      data: {
        allowedPatterns: patterns.allowedPatterns.join('" or "'),
      },
    });
  }
}

function collectAllowedAndForbiddenPatterns(
  lintedFilename: string,
  zones: Zone[],
): PatternsCollection {
  const result: PatternsCollection = {
    allowedPatterns: [],
    forbiddenPatterns: [],
  };

  for (const zone of zones) {
    if (zone.target.test(lintedFilename)) {
      result.allowedPatterns.push(...(zone.allowedPatterns ?? []));
      result.forbiddenPatterns.push(...(zone.forbiddenPatterns ?? []));
    }
  }

  return result;
}

function testPattern(stringOrRegexToTest: string | RegExp, pathToTest: string): boolean {
  let importIsOK;

  if (typeof stringOrRegexToTest === "string") {
    importIsOK = pathToTest === stringOrRegexToTest;
  } else if (thingIsRegexp(stringOrRegexToTest)) {
    importIsOK = stringOrRegexToTest.test(pathToTest);
  } else {
    assertIsUnreachable(stringOrRegexToTest);
  }

  return importIsOK;
}

function thingIsRegexp(something: unknown): something is RegExp {
  return isNotNullish(something) && typeof something["test"] === "function";
}

function thingIsObjectPattern(something: unknown): something is ObjectPattern {
  return (
    isNotNullish(something) &&
    (typeof something["pattern"] === "string" || thingIsRegexp(something["pattern"])) &&
    typeof something["errorMessage"] === "string"
  );
}

// https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking
function assertIsUnreachable(value: never): never {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`should be unreachable, but got here. value=${value}`);
}

function ensurePathUsesPosixSeparator(filePath: string): string {
  return filePath.split(path.sep).join(path.posix.sep);
}
