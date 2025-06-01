import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { GithubAdapter } from '../../../packages/github-adapter/src';
import { createClient } from '../../../packages/client/src';

import { type Record, BaseConfig, remoteDataFilePaths } from './constants';
import path from 'path';
import fs from 'fs/promises';
import { setup, cleanup } from './setup';

beforeAll(async () => {
  await setup();
});

afterAll(async () => {
  await cleanup();
});

describe('getAll', () => {
  it('should return all records', async () => {
    const client = createClient(GithubAdapter(BaseConfig));

    const records = await client.getAll<Record>({ filePath: remoteDataFilePaths.records });

    const expectedRecords = await fs.readFile(path.join(__dirname, '..', '_data', 'records.json'), 'utf-8');

    expect(records).toEqual(JSON.parse(expectedRecords));
  });
});

describe('create', () => {
  it('should create a new record', async () => {});
});
