import * as exitHook from 'exit-hook';

export const processUtil = {
  gracefulExit,
  asyncExitHook,
};

/**
 * Exit the process and make a best-effort to complete all asynchronous hooks.
 *
 * If you are using `asyncExitHook`, consider using `gracefulExit()` instead of `process.exit()` to
 * ensure all asynchronous tasks are given an opportunity to run.
 * @example
 * 	import { processUtil } from '@patricktree/commons-node';
 *
 * 	processUtil.asyncExitHook(() => {
 * 		console.log('Exiting');
 * 	});
 *
 * 	// Instead of `process.exit()`
 * 	processUtil.gracefulExit();
 * @param signal - The exit code to use. Same as the argument to `process.exit()`.
 * @see https://github.com/sindresorhus/exit-hook/blob/main/readme.md#asynchronous-exit-notes
 */
function gracefulExit(signal?: number): void {
  let signalToUse;
  if (signal !== undefined) {
    signalToUse = signal;
  }

  return exitHook.gracefulExit(signalToUse);
}

/**
 * Run code asynchronously when the process exits.
 * @example
 * 	import { processUtil } from '@patricktree/commons-node';
 *
 * 	processUtil.asyncExitHook(() => {
 * 		console.log('Exiting');
 * 	});
 *
 * 	throw new Error('🦄');
 *
 * 	//=> 'Exiting'
 *
 * 	// Removing an exit hook:
 * 	const unsubscribe = processUtil.asyncExitHook(() => {});
 *
 * 	unsubscribe();
 * @param onExit - The callback function to execute when the process exits via
 *   `gracefulExit`, and will be wrapped in `Promise.resolve`.
 * @param wait - The amount of time in milliseconds that the `onExit` function is expected to take. When multiple async handlers are registered, the longest `wait` time will be used.
 * @returns A function that removes the hook when called.
 * @see https://github.com/sindresorhus/exit-hook/blob/main/readme.md#asynchronous-exit-notes
 */
function asyncExitHook(onExit: (signal: number) => void | Promise<void>, wait: number): () => void {
  return exitHook.asyncExitHook(onExit, { wait });
}
