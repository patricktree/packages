#!/usr/bin/env node

try {
  /* this shim is the published bin entrypoint, its whole job is to load the build output */
  // oxlint-disable-next-line no-restricted-imports
  await import("../dist/cli.js");
} catch (err) {
  if (
    err.code === "ERR_MODULE_NOT_FOUND" &&
    err.message.includes("Cannot find package") &&
    err.message.includes("dist/cli.js")
  ) {
    throw new Error(
      `Could not find JS code to execute! Build this workspace project to fix this.`,
      { cause: err },
    );
  }
  throw err;
}
