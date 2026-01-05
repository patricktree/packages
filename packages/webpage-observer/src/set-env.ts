/* eslint-disable n/no-process-env -- need to set process.env things here */

import { playwrightBrowserConfig } from '#pkg/constants.js';

if (playwrightBrowserConfig.browser === 'docker') {
  process.env['PW_TEST_CONNECT_WS_ENDPOINT'] = `ws://127.0.0.1:${playwrightBrowserConfig.port}/`;
}
