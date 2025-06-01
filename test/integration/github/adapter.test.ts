import { describe, expect, it, vi, afterEach, afterAll, beforeEach } from 'vitest';

import { GithubAdapter } from '../../../packages/github-adapter/src';

import { setup } from './setup';

import { type Record, BaseConfig, remoteDataFilePaths } from './constants';

beforeEach(async () => {
  await setup();
});

afterAll(async () => {
  await setup();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('read', () => {
  describe('error', () => {
    describe('github api request', () => {
      const baseMessage = 'An error occurred while making a request to the GitHub API:';

      it('should throw unauthorized error when invalid token', async () => {
        const adapter = GithubAdapter({
          ...BaseConfig,
          token: 'invalid',
        });

        const expectedMessage = `${baseMessage} Unauthorized (401)`;
        await expect(adapter.read<Record>({ filePath: remoteDataFilePaths.validEmpty })).rejects.toThrow(
          expectedMessage,
        );
      });

      it('should throw unauthorized error when missing token', async () => {
        const adapter = GithubAdapter({
          ...BaseConfig,
          token: undefined as unknown as string,
        });

        const expectedMessage = `${baseMessage} Unauthorized (401)`;
        await expect(adapter.read<Record>({ filePath: remoteDataFilePaths.validEmpty })).rejects.toThrow(
          expectedMessage,
        );
      });

      it('should throw not found error when insufficient permissions assigned to token', async () => {
        const adapter = GithubAdapter({
          ...BaseConfig,
          token: process.env.GITHUB_TOKEN_INSUFFICIENT!,
        });

        const expectedMessage = `${baseMessage} Not Found (404)`;
        await expect(adapter.read<Record>({ filePath: remoteDataFilePaths.validEmpty })).rejects.toThrow(
          expectedMessage,
        );
      });

      it('should throw server error when an github server error occurs', async () => {
        const adapter = GithubAdapter(BaseConfig);
        const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' });

        vi.stubGlobal('fetch', mockFetch);

        const expectedMessage = `${baseMessage} Internal Server Error (500)`;
        await expect(adapter.read<Record>({ filePath: remoteDataFilePaths.validEmpty })).rejects.toThrow(
          expectedMessage,
        );
      });
    });

    describe('response validation', () => {
      const baseMessage = 'An error occurred while validating the response from the GitHub API:';

      it('should throw error when no content is found', async () => {
        const adapter = GithubAdapter(BaseConfig);

        const expectedMessage = `${baseMessage} No content found in the response`;
        await expect(adapter.read<Record>({ filePath: remoteDataFilePaths.invalidEmpty })).rejects.toThrow(
          expectedMessage,
        );
      });

      it('should throw error when content is invalid JSON', async () => {
        const adapter = GithubAdapter(BaseConfig);

        const expectedMessage = `${baseMessage} Invalid JSON content`;
        await expect(adapter.read<Record>({ filePath: remoteDataFilePaths.invalid })).rejects.toThrow(expectedMessage);
      });

      it('should throw error when content is not an array', async () => {
        const adapter = GithubAdapter(BaseConfig);

        const expectedMessage = `${baseMessage} Content is not an array`;
        await expect(adapter.read<Record>({ filePath: remoteDataFilePaths.invalidArray })).rejects.toThrow(
          expectedMessage,
        );
      });

      it('should throw error when all records do not have an id', async () => {
        const adapter = GithubAdapter(BaseConfig);

        const expectedMessage = `${baseMessage} All records must have an id`;
        await expect(adapter.read<Record>({ filePath: remoteDataFilePaths.invalidId })).rejects.toThrow(
          expectedMessage,
        );
      });
    });
  });
});
