/**
 * Source: https://github.com/steipete/agent-scripts/blob/2002ed5c2387d2d492a77b8dece56e218f817696/scripts/browser-tools.ts
 * Original author: Peter Steinberger (@steipete)
 */

import { Command } from 'commander';
import { exec as execCallback, spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { stdin as input, stdout as output } from 'node:process';
import readline from 'node:readline/promises';
import { inspect, promisify } from 'node:util';
import puppeteer, {
  type Browser,
  type CDPSession,
  type ConsoleMessage,
  type Page,
  type Protocol,
} from 'puppeteer-core';

type AsyncFunctionCtor = new (...args: string[]) => (...fnArgs: unknown[]) => Promise<unknown>;

type ConsoleLocation = ReturnType<ConsoleMessage['location']>;

type ReadableArticle = { title?: string; content?: string; url: string };

type StartOptions = {
  port: number;
  profile: boolean;
  profileDir: string;
  chromePath: string;
  killExisting: boolean;
};

type NavigationOptions = { port: number; new?: boolean };

type EvalOptions = { port: number; prettyPrint?: boolean };

type ScreenshotOptions = { port: number };

type PickOptions = { port: number };

type ConsoleOptions = {
  port: number;
  types?: string;
  follow?: boolean;
  timeout?: number;
  noSerialize?: boolean;
};

type ContentOptions = { port: number; timeout?: number };

type CookiesOptions = { port: number };

type InspectOptions = { ports?: number[]; pids?: number[]; json?: boolean };

type KillOptions = {
  ports?: number[];
  pids?: number[];
  all?: boolean;
  force?: boolean;
};

type ChromeProcessInfo = {
  pid: number;
  port?: number;
  usesPipe: boolean;
  command: string;
};

type ChromeTabInfo = {
  id?: string;
  title?: string;
  url?: string;
  type?: string;
};

type ChromeVersionResponse = Record<string, string>;

type ChromeSessionDescription = ChromeProcessInfo & {
  version?: ChromeVersionResponse;
  tabs: ChromeTabInfo[];
};

const DEFAULT_PORT = 9222;
const DEFAULT_PROFILE_DIR = path.join(os.homedir(), '.cache', 'scraping');
const DEFAULT_CHROME_BIN = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const exec = promisify(execCallback);

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const stringifyValue = (value: unknown): string => {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'bigint' || typeof value === 'symbol') {
    return value.toString();
  }
  try {
    return JSON.stringify(value);
  } catch {
    return '[Unserializable]';
  }
};

function browserURL(port: number): string {
  return `http://localhost:${port}`;
}

async function connectBrowser(port: number): Promise<Browser> {
  return puppeteer.connect({ browserURL: browserURL(port), defaultViewport: null });
}

async function getActivePage(port: number): Promise<{ browser: Browser; page: Page }> {
  const browser = await connectBrowser(port);
  const pages = await browser.pages();
  const page = pages.at(-1);
  if (!page) {
    await browser.disconnect();
    throw new Error('No active tab found');
  }
  return { browser, page };
}

const program = new Command();
program
  .name('browser-tools')
  .description('Lightweight Chrome DevTools helpers (no MCP required).')
  .configureHelp({ sortSubcommands: true })
  .showSuggestionAfterError();

program
  .command('start')
  .description('Launch Chrome with remote debugging enabled.')
  .option(
    '-p, --port <number>',
    'Remote debugging port (default: 9222)',
    (value) => Number.parseInt(value, 10),
    DEFAULT_PORT,
  )
  .option('--profile', 'Copy your default Chrome profile before launch.', false)
  .option(
    '--profile-dir <path>',
    'Directory for the temporary Chrome profile.',
    DEFAULT_PROFILE_DIR,
  )
  .option('--chrome-path <path>', 'Path to the Chrome binary.', DEFAULT_CHROME_BIN)
  .option(
    '--kill-existing',
    'Stop any running Google Chrome before launch (default: false).',
    false,
  )
  .action(async (options: StartOptions) => {
    const { port, profile, profileDir, chromePath, killExisting } = options;

    if (killExisting) {
      try {
        await exec("killall 'Google Chrome'");
      } catch {
        // ignore missing processes
      }
      await sleep(1000);
    }
    await exec(`mkdir -p "${profileDir}"`);
    if (profile) {
      const source = `${path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome')}/`;
      await exec(`rsync -a --delete "${source}" "${profileDir}/"`);
    }

    spawn(
      chromePath,
      [
        `--remote-debugging-port=${port}`,
        `--user-data-dir=${profileDir}`,
        '--no-first-run',
        '--disable-popup-blocking',
      ],
      {
        detached: true,
        stdio: 'ignore',
      },
    ).unref();

    let connected = false;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      try {
        const browser = await connectBrowser(port);
        await browser.disconnect();
        connected = true;
        break;
      } catch {
        await sleep(500);
      }
    }

    if (!connected) {
      console.error(`✗ Failed to start Chrome on port ${port}`);
      process.exitCode = 1;
      return;
    }
    console.log(
      `✓ Chrome listening on http://localhost:${port}${profile ? ' (profile copied)' : ''}`,
    );
  });

program
  .command('nav <url>')
  .description('Navigate the current tab or open a new tab.')
  .option(
    '--port <number>',
    'Debugger port (default: 9222)',
    (value) => Number.parseInt(value, 10),
    DEFAULT_PORT,
  )
  .option('--new', 'Open in a new tab.', false)
  .action(async (url: string, options: NavigationOptions) => {
    const port = options.port;
    const browser = await connectBrowser(port);
    try {
      if (options.new) {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        console.log('✓ Opened in new tab:', url);
      } else {
        const pages = await browser.pages();
        const page = pages.at(-1);
        if (!page) {
          throw new Error('No active tab found');
        }
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        console.log('✓ Navigated current tab to:', url);
      }
    } finally {
      await browser.disconnect();
    }
  });

program
  .command('eval <code...>')
  .description('Evaluate JavaScript in the active page context.')
  .option(
    '--port <number>',
    'Debugger port (default: 9222)',
    (value) => Number.parseInt(value, 10),
    DEFAULT_PORT,
  )
  .option('--pretty-print', 'Format array/object results with indentation.', false)
  .action(async (code: string[], options: EvalOptions) => {
    const snippet = code.join(' ');
    const port = options.port;
    const pretty = Boolean(options.prettyPrint);
    const useColor = process.stdout.isTTY;

    const printPretty = (value: unknown) => {
      console.log(
        inspect(value, {
          depth: 6,
          colors: useColor,
          maxArrayLength: 50,
          breakLength: 80,
          compact: false,
        }),
      );
    };

    const { browser, page } = await getActivePage(port);
    try {
      const result = await page.evaluate((body: string): Promise<unknown> => {
        const asyncProto = Object.getPrototypeOf(async function asyncNoop() {
          await Promise.resolve();
        }) as { constructor: AsyncFunctionCtor };
        const ASYNC_FN = asyncProto.constructor;
        return new ASYNC_FN(`return (${body})`)();
      }, snippet);

      if (pretty) {
        printPretty(result);
      } else if (Array.isArray(result)) {
        for (const [index, entry] of result.entries()) {
          if (index > 0) {
            console.log('');
          }
          if (entry && typeof entry === 'object') {
            for (const [key, value] of Object.entries(
              entry as Record<string, unknown> | unknown[],
            )) {
              console.log(`${key}: ${stringifyValue(value)}`);
            }
          } else {
            console.log(stringifyValue(entry));
          }
        }
      } else if (typeof result === 'object' && result !== null) {
        for (const [key, value] of Object.entries(result as Record<string, unknown>)) {
          console.log(`${key}: ${stringifyValue(value)}`);
        }
      } else {
        console.log(stringifyValue(result));
      }
    } finally {
      await browser.disconnect();
    }
  });

program
  .command('screenshot')
  .description('Capture the current viewport and print the temp PNG path.')
  .option(
    '--port <number>',
    'Debugger port (default: 9222)',
    (value) => Number.parseInt(value, 10),
    DEFAULT_PORT,
  )
  .action(async (options: ScreenshotOptions) => {
    const port = options.port;
    const { browser, page } = await getActivePage(port);
    const client: CDPSession = await page.createCDPSession();
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = path.join(os.tmpdir(), `screenshot-${timestamp}.png`);
      const layoutMetrics: Protocol.Page.GetLayoutMetricsResponse | undefined = await client
        .send('Page.getLayoutMetrics')
        .catch(() => undefined);
      const layoutViewport = layoutMetrics?.layoutViewport;

      let cssWidth = layoutViewport?.clientWidth;
      let cssHeight = layoutViewport?.clientHeight;
      const pageX = layoutViewport?.pageX ?? 0;
      const pageY = layoutViewport?.pageY ?? 0;

      if (!cssWidth || !cssHeight) {
        const viewport = page.viewport();
        cssWidth = viewport?.width;
        cssHeight = viewport?.height;
      }

      if (!cssWidth || !cssHeight) {
        const fallback = await page.evaluate(() => ({
          width: window.innerWidth,
          height: window.innerHeight,
        }));
        cssWidth = fallback.width;
        cssHeight = fallback.height;
      }

      const maxDimension = 2000;
      const scale =
        cssWidth && cssHeight
          ? Math.max(0.01, Math.min(1, maxDimension / Math.max(cssWidth, cssHeight)))
          : 1;

      if (!cssWidth || !cssHeight) {
        await page.screenshot({ path: filePath });
        console.log(filePath);
        return;
      }

      const screenshot = await client.send('Page.captureScreenshot', {
        format: 'png',
        fromSurface: true,
        captureBeyondViewport: false,
        clip: {
          x: pageX,
          y: pageY,
          width: cssWidth,
          height: cssHeight,
          scale,
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      await writeFile(filePath, Buffer.from(screenshot.data, 'base64') as any);
      console.log(filePath);
    } finally {
      try {
        await client.detach();
      } catch {
        // ignore
      }
      await browser.disconnect();
    }
  });

program
  .command('pick <message...>')
  .description('Interactive DOM picker that prints metadata for clicked elements.')
  .option(
    '--port <number>',
    'Debugger port (default: 9222)',
    (value) => Number.parseInt(value, 10),
    DEFAULT_PORT,
  )
  .action(async (messageParts: string[], options: PickOptions) => {
    const message = messageParts.join(' ');
    const port = options.port;
    const { browser, page } = await getActivePage(port);
    try {
      await page.evaluate(() => {
        const scope = globalThis as typeof globalThis & {
          pickOverlayInjected?: boolean;
          pick?: (prompt: string) => Promise<unknown>;
        };
        if (scope.pickOverlayInjected) {
          return;
        }
        scope.pickOverlayInjected = true;
        scope.pick = async (prompt: string) =>
          new Promise((resolve) => {
            const selections: unknown[] = [];
            const selectedElements = new Set<HTMLElement>();

            const overlay = document.createElement('div');
            overlay.style.cssText =
              'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;pointer-events:none';

            const highlight = document.createElement('div');
            highlight.style.cssText =
              'position:absolute;border:2px solid #3b82f6;background:rgba(59,130,246,0.1);transition:all 0.05s ease';
            overlay.append(highlight);

            const banner = document.createElement('div');
            banner.style.cssText =
              'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1f2937;color:#fff;padding:12px 24px;border-radius:8px;font:14px system-ui;box-shadow:0 4px 12px rgba(0,0,0,0.3);pointer-events:auto;z-index:2147483647';

            const updateBanner = () => {
              banner.textContent = `${prompt} (${selections.length} selected, Cmd/Ctrl+click to add, Enter to finish, ESC to cancel)`;
            };

            const cleanup = () => {
              document.removeEventListener('mousemove', onMove, true);
              document.removeEventListener('click', onClick, true);
              document.removeEventListener('keydown', onKey, true);
              overlay.remove();
              banner.remove();
              for (const el of selectedElements) {
                el.style.outline = '';
              }
            };

            const serialize = (el: HTMLElement) => {
              const parents: string[] = [];
              let current = el.parentElement;
              while (current && current !== document.body) {
                const id = current.id ? `#${current.id}` : '';
                const cls = current.className
                  ? `.${current.className.trim().split(/\s+/).join('.')}`
                  : '';
                parents.push(`${current.tagName.toLowerCase()}${id}${cls}`);
                current = current.parentElement;
              }
              const trimmedText = el.textContent?.trim();
              const idValue = el.id;
              const classValue = el.className;
              return {
                tag: el.tagName.toLowerCase(),
                id: idValue || null,
                class: classValue || null,
                text: trimmedText ? trimmedText.slice(0, 200) : null,
                html: el.outerHTML.slice(0, 500),
                parents: parents.join(' > '),
              };
            };

            const onMove = (event: MouseEvent) => {
              const node = document.elementFromPoint(
                event.clientX,
                event.clientY,
              ) as HTMLElement | null;
              if (!node || overlay.contains(node) || banner.contains(node)) {
                return;
              }
              const rect = node.getBoundingClientRect();
              highlight.style.cssText = `position:absolute;border:2px solid #3b82f6;background:rgba(59,130,246,0.1);top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px`;
            };
            const onClick = (event: MouseEvent) => {
              if (banner.contains(event.target as Node)) {
                return;
              }
              event.preventDefault();
              event.stopPropagation();
              const node = document.elementFromPoint(
                event.clientX,
                event.clientY,
              ) as HTMLElement | null;
              if (!node || overlay.contains(node) || banner.contains(node)) {
                return;
              }

              if (event.metaKey || event.ctrlKey) {
                if (!selectedElements.has(node)) {
                  selectedElements.add(node);
                  node.style.outline = '3px solid #10b981';
                  selections.push(serialize(node));
                  updateBanner();
                }
              } else {
                cleanup();
                const info = serialize(node);
                resolve(selections.length > 0 ? selections : info);
              }
            };

            const onKey = (event: KeyboardEvent) => {
              if (event.key === 'Escape') {
                cleanup();
                resolve(null);
              } else if (event.key === 'Enter' && selections.length > 0) {
                cleanup();
                resolve(selections);
              }
            };

            document.addEventListener('mousemove', onMove, true);
            document.addEventListener('click', onClick, true);
            document.addEventListener('keydown', onKey, true);

            document.body.append(overlay, banner);
            updateBanner();
          });
      });

      const result = await page.evaluate((msg) => {
        const pickFn = (window as Window & { pick?: (message: string) => Promise<unknown> }).pick;
        if (!pickFn) {
          return null;
        }
        return pickFn(msg);
      }, message);

      if (Array.isArray(result)) {
        for (const [index, entry] of result.entries()) {
          if (index > 0) {
            console.log('');
          }
          if (entry && typeof entry === 'object') {
            for (const [key, value] of Object.entries(entry as Record<string, unknown>)) {
              console.log(`${key}: ${stringifyValue(value)}`);
            }
          } else {
            console.log(stringifyValue(entry));
          }
        }
      } else if (result && typeof result === 'object') {
        for (const [key, value] of Object.entries(result as Record<string, unknown>)) {
          console.log(`${key}: ${stringifyValue(value)}`);
        }
      } else {
        console.log(stringifyValue(result));
      }
    } finally {
      await browser.disconnect();
    }
  });

program
  .command('console')
  .description('Capture and display console logs from the active tab.')
  .option(
    '--port <number>',
    'Debugger port (default: 9222)',
    (value) => Number.parseInt(value, 10),
    DEFAULT_PORT,
  )
  .option(
    '--types <list>',
    'Comma-separated log types to show (e.g., log,error,warn). Default: all types',
  )
  .option('--follow', 'Continuous monitoring mode (like tail -f)', false)
  .option(
    '--timeout <seconds>',
    'Capture duration in seconds (default: 5 for one-shot, infinite for --follow)',
    (value) => Number.parseInt(value, 10),
  )
  .option('--color', 'Force color output')
  .option('--no-color', 'Disable color output')
  .option('--no-serialize', 'Disable object serialization (show raw text only)', false)
  .action(async (options: ConsoleOptions) => {
    const port = options.port;
    const follow = Boolean(options.follow);
    const timeout = options.timeout;
    const typesFilter = options.types;
    const noSerialize = Boolean(options.noSerialize);
    const serialize = !noSerialize;

    const argv = new Set(process.argv.slice(2));
    const colorFlag = argv.has('--color') ? true : argv.has('--no-color') ? false : undefined;
    const useColor = colorFlag ?? process.stdout.isTTY;

    const normalizeType = (value: string) => {
      const lower = value.toLowerCase();
      if (lower === 'warning') {
        return 'warn';
      }
      return lower;
    };

    const allowedTypes = typesFilter
      ? new Set(typesFilter.split(',').map((t) => normalizeType(t.trim())))
      : null;

    const colorize = (text: string, colorCode: string) =>
      useColor ? `\u001B[${colorCode}m${text}\u001B[0m` : text;
    const red = (text: string) => colorize(text, '31');
    const yellow = (text: string) => colorize(text, '33');
    const cyan = (text: string) => colorize(text, '36');
    const gray = (text: string) => colorize(text, '90');
    const white = (text: string) => text;

    const typeColors: Record<string, (text: string) => string> = {
      error: red,
      warn: yellow,
      warning: yellow,
      info: cyan,
      debug: gray,
      log: white,
      pageerror: red,
    };

    const formatTimestamp = () => {
      const now = new Date();
      return `${now.toTimeString().split(' ')[0]}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    };

    const formatValue = (value: unknown, depth = 0, maxDepth = 10): string => {
      if (depth > maxDepth) {
        return '[Object]';
      }

      if (value === null) {
        return 'null';
      }
      if (value === undefined) {
        return 'undefined';
      }
      if (typeof value === 'string') {
        return `'${value}'`;
      }
      if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }
      if (typeof value === 'function') {
        return '[Function]';
      }

      if (Array.isArray(value)) {
        const items = value.map((entry) => formatValue(entry, depth + 1, maxDepth));
        return `[ ${items.join(', ')} ]`;
      }

      if (typeof value === 'object') {
        const entries = Object.entries(value).map(
          ([k, v]) => `${k}: ${formatValue(v, depth + 1, maxDepth)}`,
        );
        return entries.length > 0 ? `{ ${entries.join(', ')} }` : '{}';
      }

      if (typeof value === 'bigint' || typeof value === 'symbol') {
        return value.toString();
      }

      return '[Unknown]';
    };

    const serializeArgs = async (msg: ConsoleMessage): Promise<string> => {
      try {
        const args = msg.args();
        const values = await Promise.all(
          args.map(async (arg) => {
            try {
              const value = await arg.jsonValue();
              return formatValue(value);
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : String(error);
              if (errorMsg.includes('circular')) {
                return '[Circular]';
              }
              if (errorMsg.includes('reference chain')) {
                return '[DeepObject]';
              }
              return '[Unserializable]';
            }
          }),
        );
        return values.join(' ');
      } catch {
        return msg.text();
      }
    };

    const formatMessage = (type: string, text: string, location?: ConsoleLocation) => {
      const color = typeColors[type] ?? white;
      const timestamp = formatTimestamp();
      const loc =
        location?.url && location.lineNumber !== undefined
          ? ` ${location.url}:${location.lineNumber}`
          : '';
      return color(`[${type.toUpperCase()}] ${timestamp} ${text}${loc}`);
    };

    const { browser, page } = await getActivePage(port);

    try {
      page.on('console', (msg) => {
        void (async () => {
          const type = normalizeType(msg.type());
          if (allowedTypes && !allowedTypes.has(type)) {
            return;
          }

          const text = serialize ? await serializeArgs(msg) : msg.text();
          console.log(formatMessage(type, text, msg.location()));
        })();
      });

      page.on('pageerror', (error) => {
        if (allowedTypes && !allowedTypes.has('pageerror') && !allowedTypes.has('error')) {
          return;
        }
        console.log(formatMessage('pageerror', error.message));
      });

      if (follow) {
        console.log(gray('Monitoring console logs (Ctrl+C to stop)...'));
        const waitForExit = () =>
          new Promise<void>((resolve) => {
            const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGHUP'];
            const cleanup = () => {
              for (const signal of signals) {
                process.off(signal, onSignal);
              }
              process.off('beforeExit', onBeforeExit);
            };
            const onSignal = () => {
              cleanup();
              resolve();
            };
            const onBeforeExit = () => {
              cleanup();
              resolve();
            };
            for (const signal of signals) {
              process.on(signal, onSignal);
            }
            process.on('beforeExit', onBeforeExit);
          });

        await waitForExit();
      } else {
        const duration = timeout ?? 5;
        console.log(gray(`Capturing console logs for ${duration} seconds...`));
        await sleep(duration * 1000);
      }
    } finally {
      await browser.disconnect();
    }
  });

program
  .command('content <url>')
  .description('Extract readable content from a URL as markdown-like text.')
  .option(
    '--port <number>',
    'Debugger port (default: 9222)',
    (value) => Number.parseInt(value, 10),
    DEFAULT_PORT,
  )
  .option(
    '--timeout <seconds>',
    'Navigation timeout in seconds (default: 10).',
    (value) => Number.parseInt(value, 10),
    10,
  )
  .action(async (url: string, options: ContentOptions) => {
    const port = options.port;
    const timeoutMs = Math.max(3, options.timeout ?? 10) * 1000;
    const { browser, page } = await getActivePage(port);
    try {
      await page
        .goto(url, { waitUntil: 'networkidle2', timeout: timeoutMs })
        .catch(() => undefined);
      const article = await extractReadableContent(page);
      console.log(`URL: ${article.url}`);
      if (article.title) {
        console.log(`Title: ${article.title}`);
      }
      console.log('');
      console.log(article.content ?? '(No readable content)');
    } finally {
      await browser.disconnect();
    }
  });

program
  .command('cookies')
  .description('Dump cookies from the active tab as JSON.')
  .option(
    '--port <number>',
    'Debugger port (default: 9222)',
    (value) => Number.parseInt(value, 10),
    DEFAULT_PORT,
  )
  .action(async (options: CookiesOptions) => {
    const port = options.port;
    const { browser, page } = await getActivePage(port);
    try {
      const cookies = await page.browserContext().cookies();
      console.log(JSON.stringify(cookies, null, 2));
    } finally {
      await browser.disconnect();
    }
  });

program
  .command('inspect')
  .description(
    'List Chrome processes launched with --remote-debugging-port and show their open tabs.',
  )
  .option('--ports <list>', 'Comma-separated list of ports to include.', parseNumberListArg)
  .option('--pids <list>', 'Comma-separated list of PIDs to include.', parseNumberListArg)
  .option('--json', 'Emit machine-readable JSON output.', false)
  .action(async (options: InspectOptions) => {
    const ports = options.ports?.filter((entry) => Number.isFinite(entry) && entry > 0);
    const pids = options.pids?.filter((entry) => Number.isFinite(entry) && entry > 0);
    const sessions = await describeChromeSessions({
      ports,
      pids,
      includeAll: !ports?.length && !pids?.length,
    });
    if (options.json) {
      console.log(JSON.stringify(sessions, null, 2));
      return;
    }
    if (sessions.length === 0) {
      console.log('No Chrome instances with DevTools ports found.');
      return;
    }
    for (const [index, session] of sessions.entries()) {
      if (index > 0) {
        console.log('');
      }
      const transport =
        session.port !== undefined
          ? `port ${session.port}`
          : session.usesPipe
            ? 'debugging pipe'
            : 'unknown transport';
      const header = [`Chrome PID ${session.pid}`, `(${transport})`];
      if (session.version?.['Browser']) {
        header.push(`- ${session.version['Browser']}`);
      }
      console.log(header.join(' '));
      if (session.tabs.length === 0) {
        console.log('  (no tabs reported)');
        continue;
      }
      for (const [idx, tab] of session.tabs.entries()) {
        const title = tab.title ?? '(untitled)';
        const url = tab.url ?? '(no url)';
        console.log(`  Tab ${idx + 1}: ${title}`);
        console.log(`           ${url}`);
      }
    }
  });

program
  .command('kill')
  .description('Terminate Chrome instances that have DevTools ports open.')
  .option('--ports <list>', 'Comma-separated list of ports to target.', parseNumberListArg)
  .option('--pids <list>', 'Comma-separated list of PIDs to target.', parseNumberListArg)
  .option('--all', 'Kill every matching Chrome instance.', false)
  .option('--force', 'Skip the confirmation prompt.', false)
  .action(async (options: KillOptions) => {
    const ports = options.ports?.filter((entry) => Number.isFinite(entry) && entry > 0);
    const pids = options.pids?.filter((entry) => Number.isFinite(entry) && entry > 0);
    const killAll = Boolean(options.all);
    if (!killAll && !ports?.length && !pids?.length) {
      console.error('Specify --all, --ports <list>, or --pids <list> to select targets.');
      process.exitCode = 1;
      return;
    }
    const sessions = await describeChromeSessions({ ports, pids, includeAll: killAll });
    if (sessions.length === 0) {
      console.log('No matching Chrome instances found.');
      return;
    }
    if (!options.force) {
      console.log('About to terminate the following Chrome sessions:');
      for (const session of sessions) {
        const transport =
          session.port !== undefined
            ? `port ${session.port}`
            : session.usesPipe
              ? 'debugging pipe'
              : 'unknown transport';
        console.log(`  PID ${session.pid} (${transport})`);
      }
      const rl = readline.createInterface({ input, output });
      const answer = (await rl.question('Proceed? [y/N] ')).trim().toLowerCase();
      rl.close();
      if (answer !== 'y' && answer !== 'yes') {
        console.log('Aborted.');
        return;
      }
    }
    const failures: Array<{ pid: number; error: string }> = [];
    for (const session of sessions) {
      try {
        process.kill(session.pid);
        const transport =
          session.port !== undefined
            ? `port ${session.port}`
            : session.usesPipe
              ? 'debugging pipe'
              : 'unknown transport';
        console.log(`✓ Killed Chrome PID ${session.pid} (${transport})`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`✗ Failed to kill PID ${session.pid}: ${message}`);
        failures.push({ pid: session.pid, error: message });
      }
    }
    if (failures.length > 0) {
      process.exitCode = 1;
    }
  });

async function ensureReadability(page: Page) {
  try {
    await page.setBypassCSP(true);
  } catch {
    // ignore
  }
  const scripts = [
    'https://unpkg.com/@mozilla/readability@0.4.4/Readability.js',
    'https://unpkg.com/turndown@7.1.2/dist/turndown.js',
    'https://unpkg.com/turndown-plugin-gfm@1.0.2/dist/turndown-plugin-gfm.js',
  ];
  for (const src of scripts) {
    try {
      const alreadyLoaded = await page.evaluate((url) => {
        return Boolean(document.querySelector(`script[src="${url}"]`));
      }, src);
      if (!alreadyLoaded) {
        await page.addScriptTag({ url: src });
      }
    } catch {
      // best-effort; continue
    }
  }
}

async function extractReadableContent(page: Page): Promise<ReadableArticle> {
  await ensureReadability(page);
  const result = await page.evaluate((): ReadableArticle => {
    const asMarkdown = (html: string | null | undefined) => {
      if (!html) {
        return '';
      }
      const TurndownService = (window as typeof window & { TurndownService?: unknown })
        .TurndownService;
      const turndownPluginGfm = (
        window as typeof window & { turndownPluginGfm?: { gfm?: unknown } }
      ).turndownPluginGfm;
      if (!TurndownService || typeof TurndownService !== 'function') {
        return '';
      }
      const turndown = new (TurndownService as new (...args: unknown[]) => {
        use: (plugin: unknown) => void;
        turndown: (value: string) => string;
      })({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
      });
      if (turndownPluginGfm?.gfm) {
        turndown.use(turndownPluginGfm.gfm);
      }
      return turndown
        .turndown(html)
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    };

    const fallbackText = () => {
      const main =
        document.querySelector('main, article, [role="main"], .content, #content') ?? document.body;
      return main.textContent?.trim() ?? '';
    };

    let title = document.title;
    let content = '';

    try {
      const Readability = (
        window as typeof window & {
          Readability?: new (doc: Document) => {
            parse: () => { title?: string; content?: string; textContent?: string } | null;
          };
        }
      ).Readability;
      if (Readability) {
        const clone = document.cloneNode(true) as Document;
        const article = new Readability(clone).parse();
        if (article?.title) {
          title = article.title;
        }
        if (article?.content) {
          const markdown = asMarkdown(article.content);
          content = markdown.length > 0 ? markdown : (article.textContent ?? '');
        } else if (article?.textContent) {
          content = article.textContent;
        }
      }
    } catch {
      // ignore readability failures
    }

    if (!content) {
      content = fallbackText();
    }

    content = content.trim().slice(0, 8000);

    return { title, content, url: location.href };
  });
  return result;
}

function parseNumberListArg(value: string): number[] {
  return parseNumberList(value) ?? [];
}

function parseNumberList(inputValue: string | undefined): number[] | undefined {
  if (!inputValue) {
    return undefined;
  }
  const parsed = inputValue
    .split(',')
    .map((entry) => Number.parseInt(entry.trim(), 10))
    .filter((value) => Number.isFinite(value));
  return parsed.length > 0 ? parsed : undefined;
}

async function describeChromeSessions(options: {
  ports?: number[];
  pids?: number[];
  includeAll?: boolean;
}): Promise<ChromeSessionDescription[]> {
  const { ports, pids, includeAll } = options;
  const processes = await listDevtoolsChromes();
  const portSet = new Set(ports ?? []);
  const pidSet = new Set(pids ?? []);
  const candidates = processes.filter((proc) => {
    if (includeAll) {
      return true;
    }
    if (portSet.size > 0 && proc.port !== undefined && portSet.has(proc.port)) {
      return true;
    }
    if (pidSet.size > 0 && pidSet.has(proc.pid)) {
      return true;
    }
    return false;
  });
  const results: ChromeSessionDescription[] = [];
  for (const proc of candidates) {
    let version: ChromeVersionResponse | undefined;
    let filteredTabs: ChromeTabInfo[] = [];
    if (proc.port !== undefined) {
      const [versionResp, tabs] = await Promise.all([
        fetchJson<ChromeVersionResponse>(`http://localhost:${proc.port}/json/version`).catch(
          () => undefined,
        ),
        fetchJson<ChromeTabInfo[]>(`http://localhost:${proc.port}/json/list`).catch(() => []),
      ]);
      version = versionResp;
      filteredTabs = Array.isArray(tabs)
        ? tabs.filter((tab) => {
            const type = tab.type?.toLowerCase() ?? '';
            if (
              type &&
              type !== 'page' &&
              type !== 'app' &&
              (!tab.url ||
                tab.url.startsWith('devtools://') ||
                tab.url.startsWith('chrome-extension://'))
            ) {
              return false;
            }
            if (!tab.url || tab.url.trim().length === 0) {
              return false;
            }
            return true;
          })
        : [];
    }
    results.push({
      ...proc,
      version,
      tabs: filteredTabs,
    });
  }
  return results;
}

async function listDevtoolsChromes(): Promise<ChromeProcessInfo[]> {
  if (process.platform !== 'darwin' && process.platform !== 'linux') {
    console.warn('Chrome inspection is only supported on macOS and Linux for now.');
    return [];
  }
  const { stdout: output } = await exec('ps -ax -o pid=,command=').catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to enumerate processes: ${message}`);
  });
  const processes: ChromeProcessInfo[] = [];
  for (const rawLine of output.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    const firstSpace = line.search(/\s/);
    if (firstSpace === -1) {
      continue;
    }
    const pidText = line.slice(0, firstSpace).trim();
    const command = line.slice(firstSpace).trim();
    if (!pidText || !command) {
      continue;
    }
    const pid = Number.parseInt(pidText, 10);
    if (!Number.isFinite(pid) || pid <= 0) {
      continue;
    }
    if (
      !/chrome/i.test(command) ||
      (!command.includes('--remote-debugging-port') && !command.includes('--remote-debugging-pipe'))
    ) {
      continue;
    }
    const portMatch = /--remote-debugging-port(?:=|\s+)(\d+)/.exec(command);
    if (portMatch) {
      const portText = portMatch[1];
      if (!portText) {
        continue;
      }
      const port = Number.parseInt(portText, 10);
      if (!Number.isFinite(port)) {
        continue;
      }
      processes.push({ pid, port, usesPipe: false, command });
      continue;
    }
    if (command.includes('--remote-debugging-pipe')) {
      processes.push({ pid, usesPipe: true, command });
    }
  }
  return processes;
}

async function fetchJson<T>(url: string, timeoutMs = 2000): Promise<T | undefined> {
  return new Promise<T | undefined>((resolve, reject) => {
    const request = http.get(url, { timeout: timeoutMs }, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.on('end', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        const body = Buffer.concat(chunks as any).toString('utf8');
        if ((response.statusCode ?? 500) >= 400) {
          reject(new Error(`HTTP ${response.statusCode} for ${url}`));
          return;
        }
        try {
          resolve(JSON.parse(body) as T);
        } catch {
          resolve(undefined);
        }
      });
    });
    request.on('timeout', () => {
      request.destroy(new Error(`Request to ${url} timed out`));
    });
    request.on('error', (error) => {
      reject(error);
    });
  });
}

void program.parseAsync(process.argv);
