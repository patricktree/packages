import { defineConfig, devices, type ReporterDescription } from '@playwright/test';
import os from 'node:os';

import { config } from '#pkg/config.js';
import { playwrightBrowser, playwrightServerPortEnvVarName } from '#pkg/constants.js';

const countOfCpus = os.cpus().length;
const workers = countOfCpus
  ? // utilize all logical processors up to a max of 4 to limit RAM usage
    Math.min(countOfCpus, 4)
  : undefined;

const htmlReporter: ReporterDescription = [
  'html',
  { open: 'never', outputFolder: '../playwright-html-report' },
];

// eslint-disable-next-line import/no-default-export -- needs to be default export for Playwright
export default defineConfig({
  fullyParallel: true,
  reporter: config.CI ? [htmlReporter, ['github']] : [htmlReporter],
  testMatch: ['*.spec.js'],
  globalTimeout: 1000 * 8 * 60, // 8 minutes
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // opt into "New Headless" chromium (https://playwright.dev/docs/browsers#chromium-new-headless-mode, https://developer.chrome.com/docs/chromium/headless)
        channel: 'chromium',
      },
    },
  ],

  /**
   * increase timeout to 30 minutes and set workers count to 1 if we are in a debugging session
   */
  timeout: config.isDebuggingSession ? 1000 * 60 * 30 : undefined,
  workers: config.isDebuggingSession ? 1 : workers,

  // fail a Playwright run in CI if some test.only is in the source code
  forbidOnly: !!config.CI,

  snapshotPathTemplate: `{testDir}/../snapshots/{testFilePath}/{arg}-{projectName}-${playwrightBrowser === 'docker' ? 'docker' : '{platform}'}{ext}`,

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.03,
    },
  },

  use: {
    /* have consistent timezone and locale */
    timezoneId: 'Europe/Vienna',
    locale: 'de-AT',

    // always capture trace (seems to not have any performance impact)
    trace: 'on',

    // always capture video (seems to not have any performance impact)
    video: 'on',

    connectOptions:
      playwrightBrowser === 'docker'
        ? {
            wsEndpoint: `ws://127.0.0.1:${
              // eslint-disable-next-line n/no-process-env -- port provided by Playwright server stdout via regex (see webServer.wait.stdout)
              process.env[playwrightServerPortEnvVarName]
            }/`,
          }
        : undefined,
  },

  webServer:
    playwrightBrowser === 'docker'
      ? {
          // start the Playwright server in a docker container
          command: `docker run --rm --init --workdir /home/pwuser --user pwuser --network host mcr.microsoft.com/playwright:v1.58.2-noble /bin/sh -c "npx -y playwright@1.58.2 run-server --host 0.0.0.0"`,
          wait: {
            // Capture the Playwright Server port from stdout via regex (https://playwright.dev/docs/api/class-testconfig#test-config-web-server)
            // eslint-disable-next-line prefer-regex-literals
            stdout: new RegExp(
              String.raw`Listening on ws:\/\/0\.0\.0\.0:(?<${playwrightServerPortEnvVarName}>\d+)`,
            ),
          },
          stdout: 'pipe',
          stderr: 'pipe',
          timeout: 30_000,
          gracefulShutdown: {
            signal: 'SIGTERM',
            timeout: 10_000,
          },
          reuseExistingServer: !config.CI,
        }
      : undefined,
});
