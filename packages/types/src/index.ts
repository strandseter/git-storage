export type StorageOperationConfig = {
  filePath: `${string}.json`;
  commitMessage?: string;
};

export type FileStorageOperationConfig = {
  filePath: string;
  commitMessage?: string;
};

type JsonAdapter = {
  read: <TRecord extends { id: string }>(config: StorageOperationConfig) => Promise<TRecord[]>;
  write: <TRecord extends { id: string }>(records: TRecord[], config: StorageOperationConfig) => Promise<void>;
};

type FileAdapter = {
  read: <TContent>(config: FileStorageOperationConfig) => Promise<TContent>;
  write: <TContent>(content: TContent, config: FileStorageOperationConfig) => Promise<void>;
  delete: (config: FileStorageOperationConfig) => Promise<void>;
};

export type Adapter = {
  json: JsonAdapter;
  file: FileAdapter;
};
