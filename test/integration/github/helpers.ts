import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

import { BaseConfig, type Record } from './constants';

/**
 * Create a test file in the remote test repo.
 */
export async function setupTestFile() {
  const { owner, repo, token } = BaseConfig;

  const testDataDir = path.join(__dirname, '..', '_data');
  const testData = await fs.readFile(path.join(testDataDir, 'records.json'), 'utf-8');

  const filePath = `data/dynamic/${crypto.randomUUID()}.json` as const;

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
 * Cleanup a test file in the remote test repo.
 * Should always be called if setupTestFile is called.
 */
export async function cleanupTestFile(filePath: string) {
  const { owner, repo, token } = BaseConfig;

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  const getResponse = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!getResponse.ok) {
    throw new Error(`Failed to get file ${filePath}: ${getResponse.status} ${getResponse.statusText}`);
  }

  const fileData = (await getResponse.json()) as { sha: string };

  const deleteResponse = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `cleanup: ${filePath}`,
      sha: fileData.sha,
    }),
  });

  if (!deleteResponse.ok) {
    throw new Error(`Failed to delete file ${filePath}: ${deleteResponse.status} ${deleteResponse.statusText}`);
  }
}

export async function readLocalRecords() {
  const records = await fs.readFile(path.join(__dirname, '..', '_data', 'records.json'), 'utf-8');
  return JSON.parse(records) as Record[];
}
