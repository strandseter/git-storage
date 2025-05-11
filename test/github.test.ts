import { describe, expect, it } from 'vitest';

import { GithubAdapter } from '../src/adapters/github';

const CREDENTIALS = {
  owner: process.env.GITHUB_OWNER!,
  repo: process.env.GITHUB_REPO!,
  filePath: process.env.GITHUB_FILE_PATH!,
  token: process.env.GITHUB_TOKEN!,
};

describe('GithubAdapter', () => {
  describe('read', () => {
    it('should return the content of the file', async () => {
      const adapter = await GithubAdapter();

      const content = await adapter.read<{ id: string; name: string }>(CREDENTIALS);

      expect(content).toBeDefined();
    });
  });

  describe('write', () => {
    it('should update the content of the file', async () => {
      const adapter = await GithubAdapter();

      const record = {
        id: '1',
        name: 'test',
      };

      await adapter.write([record], CREDENTIALS);
    });
  });
});
