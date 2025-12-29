import fs from 'node:fs';

import { constants } from '#pkg/constants.js';

export function getRules() {
  // eslint-disable-next-line n/no-sync
  return JSON.parse(fs.readFileSync(constants.RULES_PATH, { encoding: 'utf8' })) as string[];
}
