import type { ReadableStream } from "node:stream/web";

export type Command = (
  opts: // eslint-disable-next-line @typescript-eslint/no-explicit-any -- this type is used with `satisfies`, we don't mind about this any here
  any,
) => Promise<CommandResult[]>;
export type CommandResult = {
  name: string;
  output: ReadableStream<ChunkType> | globalThis.ReadableStream<ChunkType>;
};

type ChunkType = string | Uint8Array;
