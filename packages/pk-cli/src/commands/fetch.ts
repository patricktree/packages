import { ReadableStream } from "node:stream/web";

import type { Command, CommandResult } from "#pkg/types.js";

export { fetchCommand };

const fetchCommand = (async (opts: { url: string; includeBody?: boolean }) => {
  const url = new URL(opts.url);
  const response = await fetch(url, { redirect: "manual" });

  let metaOutput = "";
  metaOutput += `Status: ${response.status}\n`;
  metaOutput += `Headers: \n`;
  for (const [name, value] of response.headers) {
    metaOutput += `  ${name}: ${value}\n`;
  }

  const metaStream = ReadableStream.from([metaOutput]);
  const bodyStream = response.body ?? ReadableStream.from([]);

  const result: CommandResult[] = [{ name: "meta", output: metaStream }];
  if (opts.includeBody) {
    result.push({ name: "body", output: bodyStream });
  }
  return result;
}) satisfies Command;
