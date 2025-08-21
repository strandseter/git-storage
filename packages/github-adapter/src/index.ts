import type { Adapter, RecordsOperationConfig, FilesOperationConfig } from '@git-storage/types';

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

function recordsAdapter(config: GithubAdapterConfig): Adapter['records'] {
  const read = async <TRecord extends { id: string }>({ filePath }: RecordsOperationConfig): Promise<TRecord[]> => {
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

    if (parsedContent.some((record) => !record.id)) {
      throw new GithubAdapterResponseError('All records must have an id', res);
    }

    return parsedContent;
  };

  const write = async <TRecord extends { id: string }>(
    records: TRecord[],
    { filePath, commitMessage }: RecordsOperationConfig,
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
      throw new GithubAdapterRequestError(getRes);
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
        message: commitMessage ?? 'git-storage',
        content: Buffer.from(JSON.stringify(records)).toString('base64'),
        sha,
      }),
    });

    if (!res.ok) {
      if (res.status === 409) {
        throw new GithubAdapterRequestError(res);
      }

      throw new GithubAdapterRequestError(res);
    }
  };

  return { read, write };
}

function filesAdapter(config: GithubAdapterConfig): Adapter['files'] {
  const write = async <TContent>(
    content: TContent,
    { filePath, commitMessage }: FilesOperationConfig,
  ): Promise<void> => {
    const { owner, repo, token } = config;

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`;

    // Ensure the path is unique: if a file already exists at the path, throw
    const headRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (headRes.ok) {
      throw new Error('File already exists');
    }

    if (!headRes.ok && headRes.status !== 404) {
      // If it's not a not-found, propagate the API error
      throw new GithubAdapterRequestError(headRes);
    }

    // Prepare base64 content depending on input type
    let base64Content: string;
    if (typeof content === 'string') {
      base64Content = Buffer.from(content, 'utf-8').toString('base64');
    } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(content)) {
      base64Content = (content as unknown as Buffer).toString('base64');
    } else if (content instanceof Uint8Array) {
      base64Content = Buffer.from(content).toString('base64');
    } else if (content instanceof ArrayBuffer) {
      base64Content = Buffer.from(new Uint8Array(content)).toString('base64');
    } else {
      // Fallback: serialize as JSON
      base64Content = Buffer.from(JSON.stringify(content)).toString('base64');
    }

    const createRes = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: commitMessage ?? 'git-storage',
        content: base64Content,
      }),
    });

    if (!createRes.ok) {
      throw new GithubAdapterRequestError(createRes);
    }
  };

  const read = async <TContent>({ filePath }: FilesOperationConfig): Promise<TContent> => {
    const { owner, repo, token } = config;

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('File not found');
      }
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

    const decodedBuffer = Buffer.from(data.content, 'base64');

    return decodedBuffer as unknown as TContent;
  };

  const del = async ({ filePath, commitMessage }: FilesOperationConfig): Promise<void> => {
    const { owner, repo, token } = config;

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`;

    // Fetch current file to obtain SHA
    const getRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!getRes.ok) {
      if (getRes.status === 404) {
        throw new Error('File not found');
      }
      throw new GithubAdapterRequestError(getRes);
    }

    const currentFile = (await getRes.json()) as { sha: string };

    const delRes = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: commitMessage ?? 'git-storage',
        sha: currentFile.sha,
      }),
    });

    if (!delRes.ok) {
      throw new GithubAdapterRequestError(delRes);
    }
  };

  return { read, write, delete: del };
}

export function GithubAdapter(config: GithubAdapterConfig): Adapter {
  return { records: recordsAdapter(config), files: filesAdapter(config) };
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
