export type AdapterConfig = {
  filePath: string;
};

export type Adapter = {
  read: <TRecord extends { id: string }>(config: AdapterConfig) => Promise<TRecord[]>;
  write: <TRecord extends { id: string }>(records: TRecord[], config: AdapterConfig) => Promise<void>;
};
