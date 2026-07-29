import fs from "node:fs";

export const fsUtil = {
  cleanupDirectory,
  checkIfDirentExists,
};

async function cleanupDirectory(path: string) {
  const directoryExists = await checkIfDirentExists(path);
  if (directoryExists) {
    await fs.promises.rm(path, { recursive: true });
  }
}

async function checkIfDirentExists(path: string): Promise<boolean> {
  try {
    await fs.promises.stat(path);
    return true;
  } catch (error) {
    if (isFSDirentNotFoundError(error)) {
      return false;
    }

    // Some unexpected error was thrown --> rethrow
    throw error;
  }
}

type FSDirentNotFoundError = {
  code: "ENOENT";
};

function isFSDirentNotFoundError(err: unknown): err is FSDirentNotFoundError {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { [prop in string]?: unknown })["code"] === "ENOENT"
  );
}
