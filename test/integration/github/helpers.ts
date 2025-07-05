import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

import { GithubAdapter } from '../../../packages/github-adapter/src';

import { BaseConfig } from './constants';

/**
 * Setup the remote test repo by commiting the records data file.
 */
export async function setup() {
  const { owner, repo, token } = BaseConfig;

  const testDataDir = path.join(__dirname, '..', '_data');
  const testData = await fs.readFile(path.join(testDataDir, 'records.json'), 'utf-8');

  const filePath = `data/records-${crypto.randomUUID()}.json` as const;

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `setup`,
      content: Buffer.from(testData).toString('base64'),
      branch: 'main',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create file ${filePath}: ${response.status} ${response.statusText}`);
  }

  return filePath;
}

/**
 * Teardown the remote test repo by commiting an empty records data file.
 */
export async function teardown(filePaths: string[]) {
  const adapter = GithubAdapter(BaseConfig);

  for (const filePath of filePaths) {
    await adapter.write([], {
      filePath: filePath as `${string}.json`,
      commitMessage: 'teardown',
    });
  }
}
