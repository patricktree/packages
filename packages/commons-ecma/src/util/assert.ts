import type { ObjectLiteral } from "#pkg/util/types.js";

// https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking
export function assertIsUnreachable(value?: never): never {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`should be unreachable, but got here. value=${value}`);
}

export const check = {
  isNullish,
  isNotNullish,
  isEmptyString,
  isNullishOrEmptyString,
  isNonEmptyString,
  isEmptyObject,
  isValueInEnum,
};

function isNullish(obj: unknown): obj is undefined | null {
  return obj === undefined || obj === null;
}

function isNotNullish<T>(
  obj: T | undefined | null,
  // @ts-expect-error -- We don't care about the "A type predicate's type must be assignable to its parameter's type" error here for the unknown case
): obj is unknown extends T ? ObjectLiteral : T {
  return !isNullish(obj);
}

function isEmptyString(str: string): str is "" {
  return str.trim().length === 0;
}

function isNullishOrEmptyString(str: string | undefined | null): str is "" | undefined | null {
  return isNullish(str) || isEmptyString(str);
}

function isNonEmptyString(str: string | undefined | null): str is string {
  return !isNullish(str) && !isEmptyString(str);
}

function isEmptyObject(obj: ObjectLiteral): boolean {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
}

export function isValueInEnum<TEnumValue extends string>(
  value: string,
  enumVariable: { [key in string]: TEnumValue },
): value is TEnumValue {
  const enumValues = Object.values(enumVariable);
  return enumValues.some((enumValue) => enumValue === value);
}
