import path from 'path';
import fs from 'fs/promises';

import { GithubAdapter } from '../../../packages/github-adapter/src';

import { BaseConfig } from './constants';

/**
 * Setup the remote test repo by commiting the records data file.
 */
export async function setup() {
  const adapter = GithubAdapter(BaseConfig);

  const testDataDir = path.join(__dirname, '..', '_data');
  const records = await fs.readFile(path.join(testDataDir, 'records.json'), 'utf-8');

  await adapter.write(JSON.parse(records), {
    filePath: `data/records.json` as `${string}.json`,
    commitMessage: `setup: records`,
  });
}

/**
 * Cleanup the remote test repo by commiting an empty records data file.
 */
export async function cleanup() {
  const adapter = GithubAdapter(BaseConfig);

  await adapter.write([], {
    filePath: `data/records.json` as `${string}.json`,
    commitMessage: `cleanup: records`,
  });
}
