import type { Adapter, Options } from '../types';

type GitHubContentResponse = {
  content: string;
  encoding: string;
};

export async function GithubAdapter(): Promise<Adapter> {
  const getAll: Adapter['getAll'] = async <TRecord extends { id: string }>(options: Options) => {
    const { owner, repo, token, filePath } = options;

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

  return { getAll };
}
