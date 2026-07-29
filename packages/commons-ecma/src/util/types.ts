export type ObjectLiteral = { [key: string]: unknown };

export type EmptyObject = { [prop: string]: never };

export type ArrayElement<A> = A extends ReadonlyArray<infer T> ? T : never;

// https://github.com/Microsoft/TypeScript/issues/15480#issuecomment-601714262
type PrependNextNum<A extends unknown[]> = A["length"] extends infer T
  ? ((t: T, ...a: A) => void) extends (...x: infer X) => void
    ? X
    : never
  : never;
type EnumerateInternal<A extends unknown[], N extends number> = {
  0: A;
  1: EnumerateInternal<PrependNextNum<A>, N>;
}[N extends A["length"] ? 0 : 1];
export type Enumerate<N extends number> =
  EnumerateInternal<[], N> extends Array<infer E> ? E : never;
export type Range<FROM extends number, TO extends number> = Exclude<Enumerate<TO>, Enumerate<FROM>>;

// https://stackoverflow.com/a/73555039/1700319
type Arr<N extends number, T extends unknown[] = []> = T["length"] extends N
  ? T
  : Arr<N, [...T, unknown]>;
export type Increment<N extends number> = [...Arr<N>, unknown]["length"] & number;

/*
 * discriminate unions
 * https://stackoverflow.com/a/50499316/1700319
 */
export type NarrowUnion<
  Union,
  DiscriminatorProperty extends keyof Union,
  DiscriminatorValue,
> = Union extends {
  [prop in DiscriminatorProperty]: DiscriminatorValue;
}
  ? Union
  : never;

/*
 * merge and flatten unions
 * https://www.roryba.in/programming/2019/10/12/flattening-typescript-union-types.html#flattenunion
 */
/** Converts a union of two types into an intersection i.e. A | B -> A & B */
export type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

export type KnownKeys<T> = {
  [K in keyof T]: string extends K ? never : number extends K ? never : K;
} extends { [_ in keyof T]: infer U }
  ? U
  : never;

export type RemoveIndexSignature<T> = {
  [K in KnownKeys<T>]: T[K];
};

/*
 * identity function to show computed types
 * https://github.com/microsoft/vscode/issues/94679#issuecomment-611320155
 */
export type Id<T> = {} & { [P in keyof T]: T[P] };

// https://stackoverflow.com/a/58993872/1700319
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
type ImmutablePrimitive = undefined | null | boolean | string | number | Function;
type ImmutableArray<T> = ReadonlyArray<Immutable<T>>;
type ImmutableMap<K, V> = ReadonlyMap<Immutable<K>, Immutable<V>>;
type ImmutableSet<T> = ReadonlySet<Immutable<T>>;
type ImmutableObject<T> = { readonly [K in keyof T]: Immutable<T[K]> };

export type Immutable<T> = T extends ImmutablePrimitive
  ? T
  : T extends Array<infer U>
    ? ImmutableArray<U>
    : T extends Map<infer K, infer V>
      ? ImmutableMap<K, V>
      : T extends Set<infer M>
        ? ImmutableSet<M>
        : ImmutableObject<T>;

export type FunctionType<Args extends unknown[], ReturnType> = (...args: Args) => ReturnType;

/** https://stackoverflow.com/a/43001581/1700319 */
export type Writeable<T> = { -readonly [P in keyof T]: T[P] };

/** Expands object types one level deep https://stackoverflow.com/a/57683652/1700319 */
export type ExpandProps<T> = T extends object
  ? T extends infer O
    ? { [K in keyof O]: O[K] }
    : never
  : T;
