import fs from 'fs';

type Options = {
  filePath: string;
};

export function getAll(options: Options) {
  const records = fs.readFileSync(options.filePath, 'utf8');

  const obj = JSON.parse(records);

  return obj;
}
