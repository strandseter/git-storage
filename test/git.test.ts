import { describe, expect, it } from 'vitest';

import { GitAdapter } from '../src/adapters/git';

describe('GitAdapter', () => {
  describe('read', () => {
    it('should return the content of the file', async () => {
      const adapter = GitAdapter();

      const content = await adapter.read<{ id: string; name: string }>({ filePath: 'test/data/data.json' });

      expect(content).toBeDefined();
    });
  });

  describe('write', () => {
    it('should update the content of the file', async () => {
      const adapter = GitAdapter();

      const record = {
        id: '1',
        name: 'test',
      };

      await adapter.write([record], { filePath: 'test/data/data.json' });
    });
  });
});
