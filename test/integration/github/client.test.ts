import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';

import { describe, expect, it } from 'vitest';

import { GithubAdapter } from '../../../packages/github-adapter/src';
import { createClient } from '../../../packages/client/src';

import { type Record, BaseConfig } from './constants';

import { cleanupTestFile, readLocalRecords, setupTestFile } from './helpers';

describe('json', () => {
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
});

describe('file', () => {
  describe('write', () => {
    it('should write a new unique file', async () => {
      const filePath = `data/dynamic/${crypto.randomUUID()}.jpg` as const;

      const client = createClient(GithubAdapter(BaseConfig));

      const imagePath = path.join(__dirname, '..', '_images', 'cat.jpg');
      const imageBuffer = await fs.readFile(imagePath);

      await client.writeFile({ filePath, commitMessage: 'test: write unique file (image bytes)' }, imageBuffer);

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

      await client.writeFile({ filePath, commitMessage: 'test: write first (image bytes)' }, imageBuffer);

      await expect(
        client.writeFile({ filePath, commitMessage: 'test: write duplicate (image bytes)' }, imageBuffer),
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

      await client.writeFile({ filePath, commitMessage: 'test: setup file for delete' }, imageBuffer);

      await client.deleteFile({ filePath, commitMessage: 'test: delete file' });

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

      await expect(client.deleteFile({ filePath, commitMessage: 'test: delete missing file' })).rejects.toThrow(
        'File not found',
      );
    });
  });
});
