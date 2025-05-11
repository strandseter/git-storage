import path from 'path';
import { promises as fs } from 'fs';

import { simpleGit } from 'simple-git';

import type { Adapter, AdapterConfig } from '../types';

export function GitAdapter(): Adapter {
  const git = simpleGit();

  const read = async <TRecord extends { id: string }>({ filePath }: AdapterConfig): Promise<TRecord[]> => {
    const fullPath = path.join(process.cwd(), filePath);

    const content = await fs.readFile(fullPath, 'utf-8');

    return JSON.parse(content) as TRecord[];
  };

  const write = async <TRecord extends { id: string }>(
    records: TRecord[],
    { filePath }: AdapterConfig,
  ): Promise<void> => {
    const fullPath = path.join(process.cwd(), filePath);

    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    await fs.writeFile(fullPath, JSON.stringify(records, null, 2), 'utf-8');

    await git.add(filePath);
    await git.commit('gitstore: update');
    await git.push('origin');
  };

  return { read, write };
}
