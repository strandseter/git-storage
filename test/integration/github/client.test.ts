import { describe, expect, it } from 'vitest';

import { GithubAdapter } from '../../../packages/github-adapter/src';
import { createClient } from '../../../packages/client/src';

import { type Record, BaseConfig } from './constants';

import { cleanupTestFile, readLocalRecords, setupTestFile } from './helpers';

describe('getAll', () => {
  it('should return all records', async () => {
    const filePath = await setupTestFile();

    const client = createClient(GithubAdapter(BaseConfig));

    const records = await client.getAll<Record>({ filePath });

    const expectedRecords = await readLocalRecords();

    expect(records).toEqual(expectedRecords);

    await cleanupTestFile(filePath);
  });
});

describe('getById', () => {
  it('should return a record by id', async () => {
    const filePath = await setupTestFile();

    const client = createClient(GithubAdapter(BaseConfig));

    const record = await client.getById<Record>({ filePath }, '1');

    const [expectedRecord] = await readLocalRecords();

    expect(record).toEqual(expectedRecord);

    await cleanupTestFile(filePath);
  });

  it('should throw an error if the record does not exist', async () => {
    const filePath = await setupTestFile();

    const client = createClient(GithubAdapter(BaseConfig));

    await expect(client.getById<Record>({ filePath }, 'not_found')).rejects.toThrow('Record not found');

    await cleanupTestFile(filePath);
  });
});

describe('create', () => {
  it('should create a new record', async () => {
    const filePath = await setupTestFile();

    const client = createClient(GithubAdapter(BaseConfig));

    const newRecord: Record = {
      id: '3',
      name: 'John Doe',
      some_object: { some_field: 'some value' },
      some_array: ['value1', 'value2', 'value3'],
    };

    await client.create<Record>({ filePath }, newRecord);

    const expectedRecords = [...(await readLocalRecords()), newRecord];

    const records = await client.getAll<Record>({ filePath });

    expect(records).toEqual(expectedRecords);

    await cleanupTestFile(filePath);
  });

  it('should throw an error if the record already exists and not proceed to create the record', async () => {
    const filePath = await setupTestFile();

    const client = createClient(GithubAdapter(BaseConfig));

    const existingId = '1';

    await expect(client.create<Record>({ filePath }, { id: existingId } as Record)).rejects.toThrow(
      'Record already exists',
    );

    const records = await client.getAll<Record>({ filePath });
    const expectedRecords = await readLocalRecords();

    expect(records).toEqual(expectedRecords);

    await cleanupTestFile(filePath);
  });
});

describe('update', () => {
  it('should update a record', async () => {
    const filePath = await setupTestFile();

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

    await cleanupTestFile(filePath);
  });

  it('should throw an error if the record does not exist', async () => {
    const filePath = await setupTestFile();

    const client = createClient(GithubAdapter(BaseConfig));

    await expect(client.update<Record>({ filePath }, { id: 'not_found' } as Record)).rejects.toThrow(
      'Record not found',
    );

    await cleanupTestFile(filePath);
  });
});

describe('delete', () => {
  it('should delete a record', async () => {
    const filePath = await setupTestFile();

    const id = '1';

    const client = createClient(GithubAdapter(BaseConfig));

    await client.delete({ filePath }, id);

    const records = await client.getAll<Record>({ filePath });

    const expectedRecords = (await readLocalRecords()).filter((record) => record.id !== id);

    expect(records).toEqual(expectedRecords);

    await cleanupTestFile(filePath);
  });

  it('should throw an error if the record does not exist', async () => {
    const filePath = await setupTestFile();

    const id = 'not_found';

    const client = createClient(GithubAdapter(BaseConfig));

    await expect(client.delete({ filePath }, id)).rejects.toThrow('Record not found');

    await cleanupTestFile(filePath);
  });
});
