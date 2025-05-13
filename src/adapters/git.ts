import path from 'path';
import { promises as fs } from 'fs';
import { simpleGit } from 'simple-git';
import type { SimpleGit } from 'simple-git';

import type { Adapter, AdapterConfig } from '../types';

class GitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitError';
  }
}

export function GitAdapter(): Adapter {
  let git: SimpleGit;

  const initializeGit = async (): Promise<void> => {
    try {
      git = simpleGit();

      const version = await git.version();
      if (!version) {
        throw new GitError('Git is not installed on the system');
      }

      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        throw new GitError('Current directory is not a git repository');
      }

      const remotes = await git.getRemotes();
      if (remotes.length === 0) {
        throw new GitError('No git remote configured');
      }

      try {
        await git.raw(['config', '--get', 'user.name']);
        await git.raw(['config', '--get', 'user.email']);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        throw new GitError('Git credentials not configured. Please set user.name and user.email');
      }
    } catch (err) {
      if (err instanceof GitError) {
        throw err;
      }
      throw new GitError(`Failed to initialize git: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const read = async <TRecord extends { id: string }>({ filePath }: AdapterConfig): Promise<TRecord[]> => {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      return JSON.parse(content) as TRecord[];
    } catch (err) {
      if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
      throw new Error(`Failed to read file: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const write = async <TRecord extends { id: string }>(
    records: TRecord[],
    { filePath }: AdapterConfig,
  ): Promise<void> => {
    try {
      if (!git) {
        await initializeGit();
      }

      const fullPath = path.join(process.cwd(), filePath);

      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      await fs.writeFile(fullPath, JSON.stringify(records, null, 2), 'utf-8');

      try {
        await git.add(filePath);
        await git.commit('gitstore: update');

        let retries = 3;
        while (retries > 0) {
          try {
            await git.push('origin');
            break;
          } catch (err) {
            retries--;
            if (retries === 0) {
              throw new GitError(
                `Failed to push changes after 3 attempts: ${err instanceof Error ? err.message : String(err)}`,
              );
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      } catch (err) {
        throw new GitError(`Git operation failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    } catch (err) {
      if (err instanceof GitError) {
        throw err;
      }
      throw new Error(`Failed to write file: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return { read, write };
}
