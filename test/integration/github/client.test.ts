import { describe, expect, it } from 'vitest';

import { GithubAdapter } from '../../../packages/github-adapter/src';
import { createClient } from '../../../packages/client/src';

import { type Record, filePaths } from '../_data';

import { BaseConfig } from './constants';

describe('getAll', () => {
  it('should return all records', async () => {
    const client = createClient(GithubAdapter(BaseConfig));

    const records = await client.getAll<Record>({ filePath: filePaths.records });

    expect(records).toEqual([
      {
        id: '1',
        name: 'John Doe',
        some_object: { field: 'some value' },
        some_array: ['value1', 'value2', 'value3'],
      },
      {
        id: '2',
        name: 'Jane Doe',
        some_object: { field: 'some value' },
        some_array: ['value1'],
      },
    ]);
  });
});
