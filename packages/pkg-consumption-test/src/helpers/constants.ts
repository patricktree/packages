import path from 'node:path';

import { fsUtils } from '@patricktree/commons-node/utils/fs';

const [VERDACCIO_TEMP_FOLDER, TEMP_FOLDER] = await Promise.all([
  fsUtils.createTemporaryDirectory(),
  fsUtils.createTemporaryDirectory(),
]);

export const PATHS = {
  VERDACCIO_TEMP_FOLDER,
  VERDACCIO_TEMP_FOLDER_CACHE: path.join(VERDACCIO_TEMP_FOLDER, 'cache'),
  VERDACCIO_TEMP_FOLDER_STORAGE: path.join(VERDACCIO_TEMP_FOLDER, 'storage'),
  TEMP_FOLDER,
  TEMP_NPMRC: path.join(TEMP_FOLDER, '.npmrc'),
} as const;
