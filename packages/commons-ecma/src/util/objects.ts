import type { ObjectLiteral } from '#pkg/util/types.js';

export const objects = {
  shallowCopy,
  shallowIsEqual,
  groupBy,
};

function shallowCopy<T>(inObject: T): T {
  return typeof inObject !== 'object' || inObject === null
    ? // Return the value if inObject is not an object
      inObject
    : // shallow copy via object spread
      { ...inObject };
}

// https://stackoverflow.com/a/52323412/1700319
function shallowIsEqual(obj1: ObjectLiteral, objToCompareWith: ObjectLiteral) {
  return (
    Object.keys(obj1).length === Object.keys(objToCompareWith).length &&
    Object.keys(obj1).every(
      (key) =>
        Object.hasOwnProperty.call(objToCompareWith, key) && obj1[key] === objToCompareWith[key],
    )
  );
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy
 */
export function groupBy<T, U extends string | number | symbol>(
  items: Iterable<T>,
  callbackFn: (element: T, index: number) => U,
): { [prop in U]?: T[] } {
  const result: { [prop in U]?: T[] } = {};
  let index = 0;
  for (const item of items) {
    const key = callbackFn(item, index);
    result[key] = [...(result[key] ?? []), item];
    index += 1;
  }
  return result;
}
