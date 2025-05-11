export type Options = {
  owner: string;
  repo: string;
  token: string;
  filePath: string;
};

export type Adapter = {
  getAll: <TRecord extends { id: string }>(options: Options) => Promise<TRecord[]>;
  //create: <TRecord extends { id: string }>(filePath: string, record: TRecord) => void;
};
