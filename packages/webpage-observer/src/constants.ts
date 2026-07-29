import { config } from "#pkg/config.js";

export const playwrightServerPortEnvVarName = "PLAYWRIGHT_SERVER_PORT";

export const playwrightBrowser =
  /*
   * `--debug` does not correctly work when Playwright is running browsers in the Playwright Server Docker container --> run Playwright browsers locally instead
   */
  config.isPlaywrightStartedWithDebug ? "local" : "docker";
