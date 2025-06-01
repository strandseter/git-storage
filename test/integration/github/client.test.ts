import path from 'path';
import fs from 'fs/promises';

import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { GithubAdapter } from '../../../packages/github-adapter/src';
import { createClient } from '../../../packages/client/src';

import { type Record, BaseConfig, remoteDataFilePaths } from './constants';

import { setup } from './setup';

beforeEach(async () => {
  await setup();
});

afterAll(async () => {
  await setup();
});

async function readRecords() {
  const records = await fs.readFile(path.join(__dirname, '..', '_data', 'records.json'), 'utf-8');
  return JSON.parse(records) as Record[];
}

describe('getAll', () => {
  it('should return all records', async () => {
    const client = createClient(GithubAdapter(BaseConfig));

    const records = await client.getAll<Record>({ filePath: remoteDataFilePaths.records });

    const expectedRecords = await readRecords();

    expect(records).toEqual(expectedRecords);
  });
});

describe('create', () => {
  it('should create a new record', async () => {
    const client = createClient(GithubAdapter(BaseConfig));

    const record = await client.create<Record>(
      { filePath: remoteDataFilePaths.records, commitMessage: 'create: test' },
      {
        id: '3',
        name: 'John Doe',
        some_object: { some_field: 'some value' },
        some_array: ['value1', 'value2', 'value3'],
      },
    );

    const expectedRecords = [...(await readRecords()), record];

    const records = await client.getAll<Record>({ filePath: remoteDataFilePaths.records });

    expect(records).toEqual(expectedRecords);
  });

  it('should throw an error if the record already exists and not proceed to create the record', async () => {
    const client = createClient(GithubAdapter(BaseConfig));

    const existingId = '1';

    await expect(
      client.create<Record>({ filePath: remoteDataFilePaths.records, commitMessage: 'create: test' }, {
        id: existingId,
      } as Record),
    ).rejects.toThrow('Record already exists');

    const records = await client.getAll<Record>({ filePath: remoteDataFilePaths.records });
    const expectedRecords = await readRecords();

    expect(records).toEqual(expectedRecords);
  });
});
