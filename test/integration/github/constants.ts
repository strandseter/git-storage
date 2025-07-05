import type { GithubAdapterConfig } from '../../../packages/github-adapter/src';

/**
 * Base configuration for the GitHub adapter.
 */
export const BaseConfig: GithubAdapterConfig = {
  owner: process.env.GITHUB_OWNER!,
  repo: process.env.GITHUB_REPO!,
  token: process.env.GITHUB_TOKEN_VALID!,
};

/**
 * Shape of the data used for testing.
 */
export type Record = {
  id: string;
  name: string;
  some_object: {
    some_field: string;
  };
  some_array: string[];
};

/**
 * Static file paths to test data in the remote test repo.
 */
export const staticRemoteDataFilePaths = {
  validEmpty: 'data/static/valid-empty.json',
  invalidEmpty: 'data/static/invalid-empty.json',
  invalid: 'data/static/invalid.json',
  invalidArray: 'data/static/invalid-array.json',
  invalidId: 'data/static/invalid-id.json',
} as const;
