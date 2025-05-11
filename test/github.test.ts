import { describe, expect, it } from 'vitest';

import { GithubAdapter, type GithubAdapterConfig } from '../src/adapters/github';

const AdapterConfig: GithubAdapterConfig = {
  owner: process.env.GITHUB_OWNER!,
  repo: process.env.GITHUB_REPO!,
  token: process.env.GITHUB_TOKEN!,
};

describe('GithubAdapter', () => {
  describe('read', () => {
    it('should return the content of the file', async () => {
      const adapter = await GithubAdapter(AdapterConfig);

      const content = await adapter.read<{ id: string; name: string }>({
        filePath: 'src/data/projects.json',
      });

      expect(content).toBeDefined();
    });
  });

  describe('write', () => {
    it('should update the content of the file', async () => {
      const adapter = await GithubAdapter(AdapterConfig);

      const record = {
        id: '1',
        name: 'test',
      };

      await adapter.write([record], {
        filePath: 'src/data/projects.json',
      });
    });
  });
});
