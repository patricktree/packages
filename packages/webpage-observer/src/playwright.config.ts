import { defineConfig, devices, type ReporterDescription } from '@playwright/test';
import os from 'node:os';

import { config } from '#pkg/config.js';
import { playwrightBrowserConfig } from '#pkg/constants.js';

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

  snapshotPathTemplate: `{testDir}/../snapshots/{testFilePath}/{arg}-{projectName}-${playwrightBrowserConfig.browser === 'docker' ? 'docker' : '{platform}'}{ext}`,

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
  },

  webServer:
    playwrightBrowserConfig.browser === 'docker'
      ? {
          // start the Playwright server in a docker container
          command: createDockerRunCommand(playwrightBrowserConfig.port),
          url: `http://127.0.0.1:${playwrightBrowserConfig.port}/`,
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

function createDockerRunCommand(port: number) {
  let dockerRunCommand = `docker run --rm --init --workdir /home/pwuser --user pwuser --network host`;
  if (!config.CI) {
    // on development machines, we forward the X11 socket to the host system to allow GUI applications to run from within the container
    dockerRunCommand += ` -e DISPLAY=$DISPLAY -v /tmp/.X11-unix:/tmp/.X11-unix`;
  }
  dockerRunCommand += ` mcr.microsoft.com/playwright:v1.57.0-noble /bin/sh -c "npx -y playwright@1.57.0 run-server --port ${port} --host 0.0.0.0"`;

  return dockerRunCommand;
}
