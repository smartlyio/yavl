import * as R from 'ramda';

const getIndicesFromStrPath = (path: string): Record<string, number> => {
  const indices: Record<string, number> = {};
  let searchFrom = 0;

  while (true) {
    const searchIndex = path.indexOf('[', searchFrom);
    if (searchIndex === -1) {
      break;
    }

    const [pathToArray, restOfThePath] = R.splitAt(searchIndex, path);
    const match = restOfThePath.match(/^\[(\d+)\]/);

    if (!match) {
      throw new Error('Invalid path, array not in correct format');
    }

    indices[pathToArray] = parseInt(match[1]);
    searchFrom = searchIndex + 1;
  }

  return indices;
};

export default getIndicesFromStrPath;
