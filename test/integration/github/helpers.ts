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

  await retryOperation(async () => {
    await adapter.write(JSON.parse(records), {
      filePath: `data/records.json` as `${string}.json`,
      commitMessage: `setup`,
    });
  });
}

/**
 * Teardown the remote test repo by commiting an empty records data file.
 */
export async function teardown() {
  const adapter = GithubAdapter(BaseConfig);

  await retryOperation(async () => {
    await adapter.write([], {
      filePath: `data/records.json` as `${string}.json`,
      commitMessage: `teardown`,
    });
  });
}

// TODO: Implement more robust way to handle race conditions.
// TODO: Consider using different files for each test to avoid conflicts.
const MAX_RETRIES = 10;
const RETRY_DELAY = 1000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryOperation<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (i < MAX_RETRIES - 1) {
        await sleep(RETRY_DELAY);
      }
    }
  }

  throw lastError;
}
