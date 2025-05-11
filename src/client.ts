import type { Adapter, AdapterConfig } from './types';

type Config = AdapterConfig;

export class GitStorageClient {
  private adapter: Adapter;

  constructor(adapter: Adapter) {
    this.adapter = adapter;
  }

  async getAll<TRecord extends { id: string }>(config: Config): Promise<TRecord[]> {
    const records = await this.adapter.read(config);
    return records as TRecord[];
  }

  async create<TRecord extends { id: string }>(config: Config, data: TRecord): Promise<TRecord> {
    const records = await this.adapter.read(config);

    const exists = records.find((record) => record.id === data.id);

    if (exists) {
      throw new Error('Record already exists');
    }

    await this.adapter.write([...records, data], config);

    return data;
  }

  async update<TRecord extends { id: string }>(config: Config, data: TRecord): Promise<TRecord> {
    const records = await this.adapter.read({ ...config });

    const exists = records.find((record) => record.id === data.id);

    if (!exists) {
      throw new Error('Record not found');
    }

    await this.adapter.write([...records, data], config);

    return data;
  }

  async findById<TRecord extends { id: string }>(config: Config, id: string): Promise<TRecord | null> {
    const records = await this.adapter.read(config);

    const record = records.find((record) => record.id === id) as TRecord;

    return record || null;
  }

  async delete(config: Config, id: string): Promise<boolean> {
    const records = await this.adapter.read(config);

    if (!(await this.exists(config, id))) {
      throw new Error('Record not found');
    }

    const deleted = records.filter((record) => record.id !== id);

    await this.adapter.write(deleted, config);

    return true;
  }

  async exists(config: Config, id: string): Promise<boolean> {
    const records = await this.adapter.read(config);

    const record = records.find((record) => record.id === id);

    const exists = record !== undefined;

    return exists;
  }

  async count(config: Config): Promise<number> {
    const records = await this.adapter.read(config);
    return records.length;
  }
}
