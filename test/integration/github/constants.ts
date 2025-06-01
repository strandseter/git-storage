import type { GithubAdapterConfig } from '../../../packages/github-adapter/src';

export const BaseConfig: GithubAdapterConfig = {
  owner: process.env.GITHUB_OWNER!,
  repo: process.env.GITHUB_REPO!,
  token: process.env.GITHUB_TOKEN_VALID!,
};
