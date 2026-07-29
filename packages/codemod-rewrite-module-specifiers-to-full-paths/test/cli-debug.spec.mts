import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import url from "node:url";
import { test, expect } from "vitest";

import { fsUtils } from "@patricktree/commons-node/utils/fs";

const currentDirectoryPath = url.fileURLToPath(new URL(".", import.meta.url));
const PATH_TO_PACKAGE_ROOT = path.join(currentDirectoryPath, "..");
const PATH_TO_CODEMOD_INPUTS = path.join(currentDirectoryPath, "codemod-inputs", "project-1");
const PATH_TO_CODEMOD_BIN = path.join(PATH_TO_PACKAGE_ROOT, "dist", "bin", "codemod.js");

async function runCli(args: string[]) {
  return new Promise<{ stdout: string; stderr: string; exitCode: number | null }>(
    (resolve, reject) => {
      const child = spawn(process.execPath, [PATH_TO_CODEMOD_BIN, ...args], {
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk: Buffer | string) => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", (chunk: Buffer | string) => {
        stderr += chunk.toString();
      });

      child.on("error", reject);
      child.on("close", (exitCode) => {
        resolve({ stdout, stderr, exitCode });
      });
    },
  );
}

async function prepareTempProject(): Promise<{ projectPath: string; basepath: string }> {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "codemod-debug-"));
  await fs.promises.cp(PATH_TO_CODEMOD_INPUTS, tempDir, { recursive: true });

  return { projectPath: path.join(tempDir, "tsconfig.json"), basepath: tempDir };
}

test("cli --debug emits log output", async () => {
  if (!(await fsUtils.existsPath(PATH_TO_CODEMOD_BIN))) {
    throw new Error(`Expected built CLI at ${PATH_TO_CODEMOD_BIN}. Run the build first.`);
  }

  const { projectPath, basepath } = await prepareTempProject();
  const { stdout, stderr, exitCode } = await runCli([
    "--project",
    projectPath,
    "--basepath",
    basepath,
    "--debug",
  ]);

  expect(exitCode).toEqual(0);

  const output = `${stdout}\n${stderr}`;
  expect(output).toContain("Loaded TypeScript program");
  expect(output).toContain("Reading source file");
});

test("cli without --debug is silent", async () => {
  if (!(await fsUtils.existsPath(PATH_TO_CODEMOD_BIN))) {
    throw new Error(`Expected built CLI at ${PATH_TO_CODEMOD_BIN}. Run the build first.`);
  }

  const { projectPath, basepath } = await prepareTempProject();
  const { stdout, stderr, exitCode } = await runCli([
    "--project",
    projectPath,
    "--basepath",
    basepath,
  ]);

  expect(exitCode).toEqual(0);

  const output = `${stdout}\n${stderr}`;
  expect(output).not.toContain("Loaded TypeScript program");
  expect(output).not.toContain("Reading source file");
});
