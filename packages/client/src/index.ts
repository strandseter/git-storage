import type { Adapter, StorageOperationConfig } from '@git-storage/types';

export * from '@git-storage/types';

type Config = StorageOperationConfig;

export function createClient(adapter: Adapter) {
  const getAll = async <TRecord extends { id: string }>(config: Config): Promise<TRecord[]> => {
    const records = await adapter.json.read(config);
    return records as TRecord[];
  };

  const getById = async <TRecord extends { id: string }>(config: Config, id: string): Promise<TRecord | null> => {
    const records = await adapter.json.read(config);
    const record = records.find((record) => record.id === id) as TRecord;

    if (!record) {
      throw new Error('Record not found');
    }

    return record;
  };

  const create = async <TRecord extends { id: string }>(config: Config, data: TRecord): Promise<TRecord> => {
    const records = await adapter.json.read(config);

    const exists = records.find((record) => record.id === data.id);

    if (exists) {
      throw new Error('Record already exists');
    }

    await adapter.json.write([...records, data], config);

    return data;
  };

  const update = async <TRecord extends { id: string }>(config: Config, data: TRecord): Promise<TRecord> => {
    const records = await adapter.json.read({ ...config });

    const exists = records.find((record: { id: string }) => record.id === data.id);

    if (!exists) {
      throw new Error('Record not found');
    }

    const updatedRecords = records.map((record) => (record.id === data.id ? data : record));

    await adapter.json.write(updatedRecords, config);

    return data;
  };

  const delete_ = async (config: Config, id: string): Promise<boolean> => {
    const records = await adapter.json.read(config);

    const exists = records.find((record: { id: string }) => record.id === id);

    if (!exists) {
      throw new Error('Record not found');
    }

    const deleted = records.filter((record: { id: string }) => record.id !== id);

    await adapter.json.write(deleted, config);

    return true;
  };

  const exists = async (config: Config, id: string): Promise<boolean> => {
    const records = await adapter.json.read(config);

    const record = records.find((record: { id: string }) => record.id === id);

    const exists = record !== undefined;

    return exists;
  };

  const count = async (config: Config): Promise<number> => {
    const records = await adapter.json.read(config);
    return records.length;
  };

  return {
    getAll,
    getById,
    create,
    update,
    delete: delete_,
    exists,
    count,
  };
}
