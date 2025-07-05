import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

import { BaseConfig } from './constants';

const basePath = 'data/dynamic';

/**
 * Setup the remote test repo by commiting the records data file.
 */
export async function setup() {
  const { owner, repo, token } = BaseConfig;

  const testDataDir = path.join(__dirname, '..', '_data');
  const testData = await fs.readFile(path.join(testDataDir, 'records.json'), 'utf-8');

  const filePath = `${basePath}/${crypto.randomUUID()}.json` as const;

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `setup: ${filePath}`,
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
 * Teardown the remote test repo by deleting all dynamic files created during the tests.
 */
export async function teardown() {
  const { owner, repo, token } = BaseConfig;

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${basePath}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  const tree = (await response.json()) as { name: string }[];

  for (const file of tree) {
    const filePath = `${basePath}/${file.name}`;

    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const getResponse = await fetch(getUrl, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!getResponse.ok) {
      console.log(`Failed to get file ${filePath}: ${getResponse.status} ${getResponse.statusText}`);
      continue;
    }

    const fileData = (await getResponse.json()) as { sha: string };

    const deleteUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const deleteResponse = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `teardown: ${filePath}`,
        sha: fileData.sha,
      }),
    });

    if (!deleteResponse.ok) {
      throw new Error(`Failed to delete file ${filePath}: ${deleteResponse.status} ${deleteResponse.statusText}`);
    }
  }
}
