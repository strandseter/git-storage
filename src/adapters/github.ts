import type { Adapter, Config } from '../types';

type GitHubContentResponse = {
  content: string;
  encoding: string;
};

type GitHubFileResponse = {
  sha: string;
  content: string;
  encoding: string;
};

export async function GithubAdapter(): Promise<Adapter> {
  const read = async <TRecord extends { id: string }>(config: Config): Promise<TRecord[]> => {
    const { owner, repo, token, filePath } = config;

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch content: ${res.statusText}`);
    }

    const data = (await res.json()) as Partial<GitHubContentResponse>;

    if (!data.content) {
      throw new Error('No content found in the response');
    }

    if (data.encoding !== 'base64') {
      throw new Error('Unsupported encoding');
    }

    const decodedContent = Buffer.from(data.content, 'base64').toString('utf-8');
    const parsedContent = JSON.parse(decodedContent);

    return parsedContent as TRecord[];
  };

  const write = async <TRecord extends { id: string }>(records: TRecord[], config: Config): Promise<void> => {
    const { owner, repo, token, filePath } = config;

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

    const currentFile = (await getRes.json()) as GitHubFileResponse;
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
