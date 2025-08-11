export type StorageOperationConfig = {
  filePath: `${string}.json`;
  commitMessage?: string;
};

type JsonAdapter = {
  read: <TRecord extends { id: string }>(config: StorageOperationConfig) => Promise<TRecord[]>;
  write: <TRecord extends { id: string }>(records: TRecord[], config: StorageOperationConfig) => Promise<void>;
};

export type Adapter = {
  json: JsonAdapter;
};
