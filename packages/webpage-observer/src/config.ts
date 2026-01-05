/* eslint-disable n/no-process-env -- configs are the only place where reading from process.env is allowed */

export const config = {
  CI: process.env['CI'],

  /**
   * if `--inspect-publish-uid` is in env variable `NODE_OPTIONS` - which is a Node.js feature to
   * allow easier debugging - it indicates that the current `playwright test` run is debugged by an
   * engineer (e.g. via VS Code Debug Terminal)
   */
  isDebuggingSession: process.env['NODE_OPTIONS']?.includes('--inspect-publish-uid'),

  isPlaywrightStartedWithDebug: process.env['PWDEBUG'] === '1',
};
