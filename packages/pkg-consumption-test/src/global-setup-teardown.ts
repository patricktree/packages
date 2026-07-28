import type { Config } from "@verdaccio/types";
import fs from "node:fs";
import * as verdaccio from "verdaccio";
import { $ } from "zx";

import { PATHS } from "#pkg/helpers/constants.js";
import { fsUtil } from "#pkg/helpers/fs-util.js";
import { networkUtil } from "#pkg/helpers/network-util.js";

type VerdaccioServer = {
  closeAndCleanup: () => Promise<void>;
};

let verdaccioServer: VerdaccioServer | undefined;

type SetupOptions = {
  packageName: string;
  absolutePathToPackageRoot: string;
};

export async function setup(options: SetupOptions) {
  // Start verdaccio
  const verdaccioPort = await networkUtil.getRandomFreePort();
  verdaccioServer = await startVerdaccioServer(verdaccioPort, options.packageName);

  /*
   * Publish to Verdaccio
   *
   * We set the registry URL to point to Verdaccio and a fake auth token (otherwise some package
   * managers would complain, see https://twitter.com/verdaccio_npm/status/1357798427283910660?s=21).
   *
   * These process.env variables will also be active in the test cases, so any "npm install" there
   * will fetch the dependencies from Verdaccio.
   */
  /* eslint-disable n/no-process-env */
  /* pnpm 11 rejects an `_auth` value that is not valid base64 with "[ERROR] Invalid character" */
  const fakeAuth = Buffer.from("fake-user:fake-password").toString("base64");
  let npmrcContent = "";
  npmrcContent += `registry=http://localhost:${verdaccioPort}/\n`;
  npmrcContent += `//localhost:${verdaccioPort}/:_auth=${fakeAuth}\n`;
  process.env["npm_config_registry"] = `http://localhost:${verdaccioPort}/\n`;
  await fs.promises.mkdir(PATHS.TEMP_FOLDER, { recursive: true });
  await fs.promises.writeFile(PATHS.TEMP_NPMRC, npmrcContent, "utf8");
  /* eslint-enable n/no-process-env */
  await publishToVerdaccio(options.absolutePathToPackageRoot);
}

export async function teardown() {
  if (verdaccioServer) {
    await verdaccioServer.closeAndCleanup();
  }
}

async function startVerdaccioServer(
  portToStartOn: number,
  packageName: string,
): Promise<VerdaccioServer> {
  // Remove .verdaccio folder (could be present from a previous run)
  await fsUtil.cleanupDirectory(PATHS.VERDACCIO_TEMP_FOLDER);

  /*
   * Verdaccio initialization with its Node.js API is based on https://verdaccio.org/docs/verdaccio-programmatically#using-the-module-api.
   * The type "Config" has some properties defined as required which are'nt in reality, so omit them.
   */
  const cache = PATHS.VERDACCIO_TEMP_FOLDER_CACHE;
  const config: Omit<
    Config,
    "server_id" | "secret" | "checkSecretKey" | "getMatchedPackagesSpec" | "security"
  > = {
    uplinks: {
      npmjs: {
        url: "https://registry.npmjs.org/",
      },
    },
    packages: {
      [packageName]: {
        access: ["$all"],
        publish: ["$all"],
      },
      "@*/*": {
        access: ["$all"],
        publish: ["$all"],
        proxy: ["npmjs"],
      },
      "**": {
        access: ["$all"],
        publish: ["$all"],
        proxy: ["npmjs"],
      },
    },
    storage: PATHS.VERDACCIO_TEMP_FOLDER_STORAGE,
    self_path: cache,
  };

  /* verdaccio's `Config` type demands many fields it fills in with defaults itself */
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const app = await verdaccio.runServer(config as Config);
  await new Promise<void>((resolve, reject) => {
    console.info(`[Verdaccio] starting server on port ${portToStartOn}`);
    app.listen(portToStartOn, function listeningListener() {
      console.info(`[Verdaccio] server started!`);
      resolve();
    });
    app.on("error", reject);
  });

  async function closeServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      app.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  return {
    closeAndCleanup: async () => {
      await closeServer();
      await fsUtil.cleanupDirectory(PATHS.VERDACCIO_TEMP_FOLDER);
    },
  };
}

async function publishToVerdaccio(absolutePathToPackageRoot: string) {
  $.cwd = absolutePathToPackageRoot;
  await $`npm --userconfig ${PATHS.TEMP_NPMRC} publish`;
}
