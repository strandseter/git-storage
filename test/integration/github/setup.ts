import path from 'path';
import fs from 'fs/promises';

import { GithubAdapter } from '../../../packages/github-adapter/src';

import { BaseConfig } from './constants';

export async function setup() {
  const adapter = GithubAdapter(BaseConfig);

  const testDataDir = path.join(__dirname, '..', '_data');
  const records = await fs.readFile(path.join(testDataDir, 'records.json'), 'utf-8');

  await adapter.write(JSON.parse(records), {
    filePath: `data/records.json` as `${string}.json`,
    commitMessage: `setup: records`,
  });
}

export async function cleanup() {
  const adapter = GithubAdapter(BaseConfig);

  await adapter.write([], {
    filePath: `data/records.json` as `${string}.json`,
    commitMessage: `cleanup: records`,
  });
}
