import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { check } from '@patricktree/commons-ecma/util/assert';

export const fsUtils = {
  createTemporaryDirectory,
  existsPath,
};

async function createTemporaryDirectory(opts?: { withinDirectory: string }): Promise<string> {
  const withinDirectory = opts?.withinDirectory ?? os.tmpdir();
  return fs.promises.mkdtemp(path.join(withinDirectory, 'tmp-dir-'));
}

async function existsPath(path: string): Promise<boolean> {
  try {
    await fs.promises.access(path);
    return true;
  } catch (error) {
    if (check.isNotNullish(error) && error['code'] === 'ENOENT') {
      return false;
    }

    throw error;
  }
}
