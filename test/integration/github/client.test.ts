import path from 'path';
import fs from 'fs/promises';

import { afterAll, describe, expect, it } from 'vitest';

import { GithubAdapter } from '../../../packages/github-adapter/src';
import { createClient } from '../../../packages/client/src';

import { type Record, BaseConfig } from './constants';

import { setup, teardown } from './helpers';

afterAll(async () => {
  await teardown();
});

async function readRecords() {
  const records = await fs.readFile(path.join(__dirname, '..', '_data', 'records.json'), 'utf-8');
  return JSON.parse(records) as Record[];
}

describe('getAll', () => {
  it('should return all records', async () => {
    const filePath = await setup();

    const client = createClient(GithubAdapter(BaseConfig));

    const records = await client.getAll<Record>({ filePath });

    const expectedRecords = await readRecords();

    expect(records).toEqual(expectedRecords);
  });
});

describe('getById', () => {
  it('should return a record by id', async () => {
    const filePath = await setup();

    const client = createClient(GithubAdapter(BaseConfig));

    const record = await client.getById<Record>({ filePath }, '1');

    const [expectedRecord] = await readRecords();

    expect(record).toEqual(expectedRecord);
  });

  it('should throw an error if the record does not exist', async () => {
    const filePath = await setup();

    const client = createClient(GithubAdapter(BaseConfig));

    await expect(client.getById<Record>({ filePath }, 'not_found')).rejects.toThrow('Record not found');
  });
});

describe('create', () => {
  it('should create a new record', async () => {
    const filePath = await setup();

    const client = createClient(GithubAdapter(BaseConfig));

    const newRecord: Record = {
      id: '3',
      name: 'John Doe',
      some_object: { some_field: 'some value' },
      some_array: ['value1', 'value2', 'value3'],
    };

    await client.create<Record>({ filePath }, newRecord);

    const expectedRecords = [...(await readRecords()), newRecord];

    const records = await client.getAll<Record>({ filePath });

    expect(records).toEqual(expectedRecords);
  });

  it('should throw an error if the record already exists and not proceed to create the record', async () => {
    const filePath = await setup();

    const client = createClient(GithubAdapter(BaseConfig));

    const existingId = '1';

    await expect(client.create<Record>({ filePath }, { id: existingId } as Record)).rejects.toThrow(
      'Record already exists',
    );

    const records = await client.getAll<Record>({ filePath });
    const expectedRecords = await readRecords();

    expect(records).toEqual(expectedRecords);
  });
});

describe('update', () => {
  it('should update a record', async () => {
    const filePath = await setup();

    const client = createClient(GithubAdapter(BaseConfig));

    const updatedRecord: Record = {
      id: '1',
      name: 'John Doe',
      some_object: { some_field: 'UPDATED' },
      some_array: ['UPDATED'],
    };

    await client.update<Record>({ filePath }, updatedRecord);

    const [record] = await client.getAll<Record>({ filePath });

    expect(record).toEqual(updatedRecord);
  });

  it('should throw an error if the record does not exist', async () => {
    const filePath = await setup();

    const client = createClient(GithubAdapter(BaseConfig));

    await expect(client.update<Record>({ filePath }, { id: 'not_found' } as Record)).rejects.toThrow(
      'Record not found',
    );
  });
});

describe('delete', () => {
  it('should delete a record', async () => {
    const filePath = await setup();

    const client = createClient(GithubAdapter(BaseConfig));

    await client.delete({ filePath }, '1');

    const records = await client.getAll<Record>({ filePath });

    const expectedRecords = (await readRecords()).filter((record) => record.id !== '1');

    expect(records).toEqual(expectedRecords);
  });

  it('should throw an error if the record does not exist', async () => {
    const filePath = await setup();

    const client = createClient(GithubAdapter(BaseConfig));

    await expect(client.delete({ filePath }, 'not_found')).rejects.toThrow('Record not found');
  });
});
