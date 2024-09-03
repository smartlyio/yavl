const integerStringsToNumber = (arr: string[]): Array<string | number> =>
  arr.map(it => (/^\d+$/.test(it) ? Number(it) : it));

export const strPathToArray = (path: string): Array<string | number> =>
  integerStringsToNumber(path.split(/\.|\[(\d+)\]/).filter(Boolean));
