import type { Adapter, StorageOperationConfig } from '@git-storage/types';

type GitHubContentResponse = {
  sha: string;
  content: string;
  encoding: string;
};

export type GithubAdapterConfig = {
  owner: string;
  repo: string;
  token: string;
};

export function GithubAdapter(config: GithubAdapterConfig): Adapter {
  const read = async <TRecord extends { id: string }>({ filePath }: StorageOperationConfig): Promise<TRecord[]> => {
    // TODO: Throw if not .json file

    const { owner, repo, token } = config;

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      throw new GithubAdapterRequestError(res);
    }

    let data: GitHubContentResponse;
    try {
      data = (await res.json()) as GitHubContentResponse;
    } catch (cause) {
      throw new GithubAdapterResponseError('Failed to parse response as JSON', res, cause as Error);
    }

    if (!data.content) {
      throw new GithubAdapterResponseError('No content found in the response', res);
    }

    let parsedContent: TRecord[];
    try {
      const decodedContent = Buffer.from(data.content, 'base64').toString('utf-8');
      parsedContent = JSON.parse(decodedContent);
    } catch (cause) {
      throw new GithubAdapterResponseError('Invalid JSON content', res, cause as Error);
    }

    if (!Array.isArray(parsedContent)) {
      throw new GithubAdapterResponseError('Content is not an array', res);
    }

    return parsedContent;
  };

  const write = async <TRecord extends { id: string }>(
    records: TRecord[],
    { filePath }: StorageOperationConfig,
  ): Promise<void> => {
    const { owner, repo, token } = config;

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`;

    const getRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!getRes.ok) {
      throw new Error(`Failed to fetch current file: ${getRes.statusText}`);
    }

    const currentFile = (await getRes.json()) as GitHubContentResponse;
    const sha = currentFile.sha;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: 'gitstore: update',
        content: Buffer.from(JSON.stringify(records)).toString('base64'),
        sha,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to update content: ${res.statusText}`);
    }
  };

  return { read, write };
}

export class GithubAdapterRequestError extends Error {
  response: Response;
  constructor(response: Response) {
    super(`An error occurred while making a request to the GitHub API: ${response.statusText} (${response.status})`);
    this.name = 'GithubAdapterError';
    this.response = response;
  }
}

export class GithubAdapterResponseError extends Error {
  response: Response;
  override cause?: Error;
  constructor(message: string, response: Response, cause?: Error) {
    super(`An error occurred while validating the response from the GitHub API: ${message}`, { cause });
    this.name = 'GithubAdapterError';
    this.cause = cause;
    this.response = response;
  }
}
