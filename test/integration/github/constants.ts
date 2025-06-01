import type { GithubAdapterConfig } from '../../../packages/github-adapter/src';

export const BaseConfig: GithubAdapterConfig = {
  owner: process.env.GITHUB_OWNER!,
  repo: process.env.GITHUB_REPO!,
  token: process.env.GITHUB_TOKEN_VALID!,
};

export type Record = {
  id: string;
  name: string;
  some_object: {
    some_field: string;
  };
  some_array: string[];
};

export const filePaths = {
  valid: 'data/valid.json',
  validEmpty: 'data/valid-empty.json',
  invalidEmpty: 'data/invalid-empty.json',
  invalid: 'data/invalid.json',
  invalidArray: 'data/invalid-array.json',
  invalidId: 'data/invalid-id.json',
};
