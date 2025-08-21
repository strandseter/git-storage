import type { Adapter, RecordsOperationConfig, FilesOperationConfig } from '@git-storage/types';

// Note: Intentionally not re-exporting adapter-level types to avoid exposing
// internal details. Consumers should use the high-level client API only.
export type RecordsReadConfig = Omit<RecordsOperationConfig, 'commitMessage'>;
export type RecordsWriteConfig = RecordsOperationConfig;
export type FilesReadConfig = Omit<FilesOperationConfig, 'commitMessage'>;
export type FilesWriteConfig = FilesOperationConfig;

export function createClient(adapter: Adapter) {
  const records = {
    getAll: async <TRecord extends { id: string }>(config: RecordsReadConfig): Promise<TRecord[]> => {
      const records = (await adapter.records.read(config)) as TRecord[];

      return records;
    },

    getById: async <TRecord extends { id: string }>(config: RecordsReadConfig, id: string): Promise<TRecord> => {
      const records = (await adapter.records.read(config)) as TRecord[];

      const record = records.find((r) => r.id === id);

      if (!record) {
        throw new Error('Record not found');
      }

      return record as TRecord;
    },

    create: async <TRecord extends { id: string }>(config: RecordsWriteConfig, data: TRecord): Promise<TRecord> => {
      const records = (await adapter.records.read(config)) as TRecord[];

      const exists = records.find((r) => r.id === data.id);

      if (exists) {
        throw new Error('Record already exists');
      }

      await adapter.records.write([...records, data], config);

      return data;
    },

    update: async <TRecord extends { id: string }>(config: RecordsWriteConfig, data: TRecord): Promise<TRecord> => {
      const records = (await adapter.records.read(config)) as TRecord[];

      const exists = records.find((r) => r.id === data.id);

      if (!exists) {
        throw new Error('Record not found');
      }

      const updated = records.map((r) => (r.id === data.id ? data : r));

      await adapter.records.write(updated, config);

      return data;
    },

    delete: async (config: RecordsWriteConfig, id: string): Promise<boolean> => {
      const records = await adapter.records.read(config);

      const exists = records.find((r: { id: string }) => r.id === id);

      if (!exists) {
        throw new Error('Record not found');
      }

      const deleted = records.filter((r: { id: string }) => r.id !== id);

      await adapter.records.write(deleted, config);

      return true;
    },

    exists: async (config: RecordsReadConfig, id: string): Promise<boolean> => {
      const records = await adapter.records.read(config);

      return records.some((r: { id: string }) => r.id === id);
    },

    count: async (config: RecordsReadConfig): Promise<number> => {
      const records = await adapter.records.read(config);

      return records.length;
    },
  } as const;

  const files = {
    read: async <TContent>(config: FilesReadConfig): Promise<TContent> => {
      return (await adapter.files.read<Buffer>(config)) as TContent;
    },

    write: async <TContent>(config: FilesWriteConfig, content: TContent): Promise<void> => {
      await adapter.files.write(content, config);
    },

    delete: async (config: FilesWriteConfig): Promise<void> => {
      await adapter.files.delete(config);
    },
  } as const;

  return {
    records,
    files,
  };
}
