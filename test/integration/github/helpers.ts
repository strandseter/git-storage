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
 * Teardown the remote test repo by deleting all files in a single commit.
 */
export async function teardown(filePaths: string[]) {
  const { owner, repo, token } = BaseConfig;

  // Get the current commit SHA of the main branch
  const branchUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`;
  const branchResponse = await fetch(branchUrl, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!branchResponse.ok) {
    throw new Error(`Failed to get branch info: ${branchResponse.status} ${branchResponse.statusText}`);
  }

  const branchData = (await branchResponse.json()) as { object: { sha: string } };
  const currentCommitSha = branchData.object.sha;

  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${currentCommitSha}?recursive=1`;
  const treeResponse = await fetch(treeUrl, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!treeResponse.ok) {
    throw new Error(`Failed to get tree: ${treeResponse.status} ${treeResponse.statusText}`);
  }

  const treeData = (await treeResponse.json()) as { tree: { path: string }[] };

  // Filter out the files we want to delete
  const filteredTree = treeData.tree.filter((item) => !filePaths.includes(item.path));

  // Create a new tree without the deleted files
  const newTreeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees`;
  const newTreeResponse = await fetch(newTreeUrl, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tree: filteredTree.map((item: any) => ({
        path: item.path,
        mode: item.mode,
        type: item.type,
        sha: item.sha,
      })),
    }),
  });

  if (!newTreeResponse.ok) {
    throw new Error(`Failed to create new tree: ${newTreeResponse.status} ${newTreeResponse.statusText}`);
  }

  const newTreeData = await newTreeResponse.json();

  // Create a new commit
  const commitUrl = `https://api.github.com/repos/${owner}/${repo}/git/commits`;
  const commitResponse = await fetch(commitUrl, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'teardown',
      tree: newTreeData.sha,
      parents: [currentCommitSha],
    }),
  });

  if (!commitResponse.ok) {
    throw new Error(`Failed to create commit: ${commitResponse.status} ${commitResponse.statusText}`);
  }

  const commitData = await commitResponse.json();

  // Update the main branch to point to the new commit
  const updateRefUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`;
  const updateRefResponse = await fetch(updateRefUrl, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sha: commitData.sha,
    }),
  });

  if (!updateRefResponse.ok) {
    throw new Error(`Failed to update branch: ${updateRefResponse.status} ${updateRefResponse.statusText}`);
  }
}
