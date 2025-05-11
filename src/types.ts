export type Config = {
  owner: string;
  repo: string;
  token: string;
  filePath: string;
};

export type Adapter = {
  read: <TRecord extends { id: string }>(options: Config) => Promise<TRecord[]>;
  write: <TRecord extends { id: string }>(records: TRecord[], options: Config) => Promise<void>;
};
