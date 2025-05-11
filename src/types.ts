export type Options = {
  owner: string;
  repo: string;
  token: string;
  filePath: string;
};

export type Adapter = {
  read: <TRecord extends { id: string }>(options: Options) => Promise<TRecord[]>;
  write: <TRecord extends { id: string }>(records: TRecord[], options: Options) => Promise<void>;
};
