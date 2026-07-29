import type { Increment, Range } from "#pkg/util/types.js";

export const numbers = { convert, sequence };

function convert(input: unknown): number | undefined {
  // https://stackoverflow.com/a/1421988/1700319
  if (Number.isNaN(Number.parseFloat(String(input))) || Number.isNaN(Number(input) - 0)) {
    return undefined;
  }
  return Number(input);
}

function sequence<const FromInclusive extends number, const ToInclusive extends number>(options: {
  fromInclusive: FromInclusive;
  toInclusive: ToInclusive;
}): Array<Range<FromInclusive, Increment<ToInclusive>>> {
  /* the arithmetic above produces exactly the numbers described by `Range<...>`, but TypeScript
     cannot narrow `number` to that literal union on its own */
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return Array.from(
    Array.from({ length: options.toInclusive - (options.fromInclusive - 1) }),
    (_, i) => i + options.fromInclusive,
  ) as Array<Range<FromInclusive, Increment<ToInclusive>>>;
}
