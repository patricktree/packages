// @ts-expect-error -- for whatever reason TypeScript emits an error for the assignment here although this approach is suggested (https://devblogs.microsoft.com/typescript/announcing-typescript-5-2/#using-declarations-and-explicit-resource-management)
Symbol.dispose ??= Symbol("Symbol.dispose");
// @ts-expect-error -- for whatever reason TypeScript emits an error for the assignment here although this approach is suggested (https://devblogs.microsoft.com/typescript/announcing-typescript-5-2/#using-declarations-and-explicit-resource-management)
Symbol.asyncDispose ??= Symbol("Symbol.asyncDispose");
