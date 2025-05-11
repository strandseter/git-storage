import { describe, expect, it } from 'vitest';

import { GithubAdapter } from '../src/adapters/github';

const CREDENTIALS = {
  owner: process.env.GITHUB_OWNER!,
  repo: process.env.GITHUB_REPO!,
  filePath: process.env.GITHUB_FILE_PATH!,
  token: process.env.GITHUB_TOKEN!,
};

describe('GithubAdapter', () => {
  it('should return the content of the file', async () => {
    const adapter = await GithubAdapter();

    const content = await adapter.getAll(CREDENTIALS);

    expect(content).toBe('content');
  });
});
