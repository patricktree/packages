import { config } from '#pkg/config.js';

export const playwrightBrowserConfig =
  /*
   * `--debug` does not correctly work when Playwright is running browsers in the Playwright Server Docker container --> run Playwright browsers locally instead
   */
  config.isPlaywrightStartedWithDebug
    ? ({ browser: 'local' } as const)
    : ({ browser: 'docker', port: 36_719 } as const);
