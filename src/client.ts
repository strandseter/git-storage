import type { Adapter, AdapterConfig } from './types';

type Config = AdapterConfig;

export function createClient(adapter: Adapter) {
  const getAll = async <TRecord extends { id: string }>(config: Config): Promise<TRecord[]> => {
    const records = await adapter.read(config);
    return records as TRecord[];
  };

  const create = async <TRecord extends { id: string }>(config: Config, data: TRecord): Promise<TRecord> => {
    const records = await adapter.read(config);

    const exists = records.find((record) => record.id === data.id);

    if (exists) {
      throw new Error('Record already exists');
    }

    await adapter.write([...records, data], config);

    return data;
  };

  const update = async <TRecord extends { id: string }>(config: Config, data: TRecord): Promise<TRecord> => {
    const records = await adapter.read({ ...config });

    const exists = records.find((record) => record.id === data.id);

    if (!exists) {
      throw new Error('Record not found');
    }

    await adapter.write([...records, data], config);

    return data;
  };

  const findById = async <TRecord extends { id: string }>(config: Config, id: string): Promise<TRecord | null> => {
    const records = await adapter.read(config);

    const record = records.find((record) => record.id === id) as TRecord;

    return record || null;
  };

  const delete_ = async (config: Config, id: string): Promise<boolean> => {
    const records = await adapter.read(config);

    const exists = records.find((record) => record.id === id);

    if (!exists) {
      throw new Error('Record not found');
    }

    const deleted = records.filter((record) => record.id !== id);

    await adapter.write(deleted, config);

    return true;
  };

  const exists = async (config: Config, id: string): Promise<boolean> => {
    const records = await adapter.read(config);

    const record = records.find((record) => record.id === id);

    const exists = record !== undefined;

    return exists;
  };

  const count = async (config: Config): Promise<number> => {
    const records = await adapter.read(config);
    return records.length;
  };

  return {
    getAll,
    create,
    update,
    findById,
    delete: delete_,
    exists,
    count,
  };
}
