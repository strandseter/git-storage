import { describe, expect, it, vi } from 'vitest';

import { GithubAdapter, type GithubAdapterConfig } from '../../../packages/github-adapter/src';

const AdapterConfig: GithubAdapterConfig = {
  owner: process.env.GITHUB_OWNER!,
  repo: process.env.GITHUB_REPO!,
  token: process.env.GITHUB_TOKEN!,
};

const adapter = GithubAdapter(AdapterConfig);

describe('read', () => {
  const filePath = 'data/test.json';

  it('should find the file', async () => {
    const content = await adapter.read<{ id: string; name: string }>({ filePath });
    expect(content).toBeDefined();
  });

  describe('error', () => {
    it('should throw error when unauthorized', async () => {
      const adapter = GithubAdapter({
        ...AdapterConfig,
        token: 'invalid',
      });

      const message = 'Unathorized to access github repository';
      await expect(adapter.read<{ id: string; name: string }>({ filePath })).rejects.toThrow(message);
    });

    it('should throw an error when the file is not found', async () => {
      const filePath = 'data/not-found.json';

      const message = 'File not found';
      await expect(adapter.read<{ id: string; name: string }>({ filePath })).rejects.toThrow(message);
    });

    it('should throw an error when an unknown error occurs', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      vi.stubGlobal('fetch', mockFetch);

      const message = 'An unknown error occurred: Internal Server Error (500)';
      await expect(adapter.read<{ id: string; name: string }>({ filePath })).rejects.toThrow(message);
    });
  });
});
