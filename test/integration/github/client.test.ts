import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';

import { describe, expect, it } from 'vitest';

import { GithubAdapter } from '../../../packages/github-adapter/src';
import { createClient } from '../../../packages/client/src';

import { type Record, BaseConfig } from './constants';

import { cleanupTestFile, readLocalRecords, setupTestFile } from './helpers';

describe('records', () => {
  describe('getAll', () => {
    it('should return all records', async () => {
      const filePath = await setupTestFile();

      const client = createClient(GithubAdapter(BaseConfig));

      const records = await client.records.getAll<Record>({ filePath });

      const expectedRecords = await readLocalRecords();

      expect(records).toEqual(expectedRecords);

      await cleanupTestFile(filePath);
    });
  });

  describe('getById', () => {
    it('should return a record by id', async () => {
      const filePath = await setupTestFile();

      const client = createClient(GithubAdapter(BaseConfig));

      const record = await client.records.getById<Record>({ filePath }, '1');

      const [expectedRecord] = await readLocalRecords();

      expect(record).toEqual(expectedRecord);

      await cleanupTestFile(filePath);
    });

    it('should throw an error if the record does not exist', async () => {
      const filePath = await setupTestFile();

      const client = createClient(GithubAdapter(BaseConfig));

      await expect(client.records.getById<Record>({ filePath }, 'not_found')).rejects.toThrow('Record not found');

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

      await client.records.create<Record>({ filePath, commitMessage: 'records/create 3' }, newRecord);

      const expectedRecords = [...(await readLocalRecords()), newRecord];

      const records = await client.records.getAll<Record>({ filePath });

      expect(records).toEqual(expectedRecords);

      await cleanupTestFile(filePath);
    });

    it('should throw an error if the record already exists and not proceed to create the record', async () => {
      const filePath = await setupTestFile();

      const client = createClient(GithubAdapter(BaseConfig));

      const existingId = '1';

      await expect(
        client.records.create<Record>({ filePath, commitMessage: 'records/create existing 1' }, {
          id: existingId,
        } as Record),
      ).rejects.toThrow('Record already exists');

      const records = await client.records.getAll<Record>({ filePath });
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

      await client.records.update<Record>({ filePath, commitMessage: 'records/update 1' }, updatedRecord);

      const [record] = await client.records.getAll<Record>({ filePath });

      expect(record).toEqual(updatedRecord);

      await cleanupTestFile(filePath);
    });

    it('should throw an error if the record does not exist', async () => {
      const filePath = await setupTestFile();

      const client = createClient(GithubAdapter(BaseConfig));

      await expect(
        client.records.update<Record>({ filePath, commitMessage: 'records/update missing not_found' }, {
          id: 'not_found',
        } as Record),
      ).rejects.toThrow('Record not found');

      await cleanupTestFile(filePath);
    });
  });

  describe('delete', () => {
    it('should delete a record', async () => {
      const filePath = await setupTestFile();

      const id = '1';

      const client = createClient(GithubAdapter(BaseConfig));

      await client.records.delete({ filePath, commitMessage: 'records/delete 1' }, id);

      const records = await client.records.getAll<Record>({ filePath });

      const expectedRecords = (await readLocalRecords()).filter((record) => record.id !== id);

      expect(records).toEqual(expectedRecords);

      await cleanupTestFile(filePath);
    });

    it('should throw an error if the record does not exist', async () => {
      const filePath = await setupTestFile();

      const id = 'not_found';

      const client = createClient(GithubAdapter(BaseConfig));

      await expect(
        client.records.delete({ filePath, commitMessage: 'records/delete missing not_found' }, id),
      ).rejects.toThrow('Record not found');

      await cleanupTestFile(filePath);
    });
  });
});

describe('file', () => {
  describe('read', () => {
    it('should read an existing file', async () => {
      const filePath = `data/dynamic/${crypto.randomUUID()}.jpg` as const;

      const client = createClient(GithubAdapter(BaseConfig));

      const imagePath = path.join(__dirname, '..', '_images', 'cat.jpg');
      const imageBuffer = await fs.readFile(imagePath);

      await client.files.write({ filePath, commitMessage: 'files/setup file for read' }, imageBuffer);

      const readContent = await client.files.read<Buffer>({ filePath });

      expect(Buffer.isBuffer(readContent)).toBe(true);
      expect((readContent as Buffer).equals(imageBuffer)).toBe(true);

      await cleanupTestFile(filePath);
    });

    it('should read a text file as buffer and convert to string', async () => {
      const filePath = `data/dynamic/${crypto.randomUUID()}.txt` as const;
      const textContent = 'Hello, World! This is a test file.';

      const client = createClient(GithubAdapter(BaseConfig));

      await client.files.write({ filePath, commitMessage: 'files/setup text file for read' }, textContent);

      const readBuffer = await client.files.read<Buffer>({ filePath });

      expect(Buffer.isBuffer(readBuffer)).toBe(true);

      const readContent = readBuffer.toString('utf-8');
      expect(readContent).toBe(textContent);

      await cleanupTestFile(filePath);
    });

    it('should throw when reading a non-existing file', async () => {
      const filePath = `data/dynamic/${crypto.randomUUID()}.txt` as const;

      const client = createClient(GithubAdapter(BaseConfig));

      await expect(client.files.read<string>({ filePath })).rejects.toThrow();
    });
  });

  describe('write', () => {
    it('should write a new unique file', async () => {
      const filePath = `data/dynamic/${crypto.randomUUID()}.jpg` as const;

      const client = createClient(GithubAdapter(BaseConfig));

      const imagePath = path.join(__dirname, '..', '_images', 'cat.jpg');
      const imageBuffer = await fs.readFile(imagePath);

      await client.files.write({ filePath, commitMessage: 'files/write unique image' }, imageBuffer);

      // Verify content via GitHub API
      const { owner, repo, token } = BaseConfig;
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      expect(res.ok).toBe(true);

      const data = (await res.json()) as { content: string };
      const decoded = Buffer.from(data.content, 'base64');

      expect(decoded.equals(imageBuffer)).toBe(true);

      await cleanupTestFile(filePath);
    });

    it('should throw when writing to an existing path', async () => {
      const filePath = `data/dynamic/${crypto.randomUUID()}.jpg` as const;

      const client = createClient(GithubAdapter(BaseConfig));

      const imagePath = path.join(__dirname, '..', '_images', 'cat.jpg');
      const imageBuffer = await fs.readFile(imagePath);

      await client.files.write({ filePath, commitMessage: 'files/write first image' }, imageBuffer);

      await expect(
        client.files.write({ filePath, commitMessage: 'files/write duplicate image' }, imageBuffer),
      ).rejects.toThrow('File already exists');

      await cleanupTestFile(filePath);
    });
  });

  describe('delete', () => {
    it('should delete an existing file', async () => {
      const filePath = `data/dynamic/${crypto.randomUUID()}.jpg` as const;

      const client = createClient(GithubAdapter(BaseConfig));

      const imagePath = path.join(__dirname, '..', '_images', 'cat.jpg');
      const imageBuffer = await fs.readFile(imagePath);

      await client.files.write({ filePath, commitMessage: 'files/setup file for delete' }, imageBuffer);

      await client.files.delete({ filePath, commitMessage: 'files/delete file' });

      const { owner, repo, token } = BaseConfig;
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      expect(res.status).toBe(404);
    });

    it('should throw when deleting a non-existing file', async () => {
      const filePath = `data/dynamic/${crypto.randomUUID()}.jpg` as const;

      const client = createClient(GithubAdapter(BaseConfig));

      await expect(client.files.delete({ filePath, commitMessage: 'files/delete missing file' })).rejects.toThrow(
        'File not found',
      );
    });
  });
});
