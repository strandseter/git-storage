export type RecordsOperationConfig = {
  filePath: `${string}.json`;
  commitMessage?: string;
};

export type FilesOperationConfig = {
  filePath: string;
  commitMessage?: string;
};

type RecordsAdapter = {
  read: <TRecord extends { id: string }>(config: RecordsOperationConfig) => Promise<TRecord[]>;
  write: <TRecord extends { id: string }>(records: TRecord[], config: RecordsOperationConfig) => Promise<void>;
};

type FileAdapter = {
  read: <TContent>(config: FilesOperationConfig) => Promise<TContent>;
  write: <TContent>(content: TContent, config: FilesOperationConfig) => Promise<void>;
  delete: (config: FilesOperationConfig) => Promise<void>;
};

export type Adapter = {
  records: RecordsAdapter;
  files: FileAdapter;
};
