import * as R from 'ramda';

// Original implementation
export const getIndicesFromStrPath_original = (path: string): Record<string, number> => {
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

// Optimized implementation
export const getIndicesFromStrPath_optimized = (path: string): Record<string, number> => {
  const indices: Record<string, number> = {};
  let currentPath = '';
  let inBracket = false;
  let bracketContent = '';

  for (let i = 0; i < path.length; i++) {
    const char = path[i];

    if (char === '[' && !inBracket) {
      inBracket = true;
      bracketContent = '';
    } else if (char === ']' && inBracket) {
      // Only store numeric indices, skip property access
      const num = parseInt(bracketContent, 10);
      if (!Number.isNaN(num)) {
        indices[currentPath] = num;
      }
      inBracket = false;
      // Add the array access to the current path
      currentPath += `[${bracketContent}]`;
    } else if (inBracket) {
      bracketContent += char;
    } else {
      currentPath += char;
    }
  }

  if (inBracket) {
    throw new Error('Invalid path, unmatched bracket');
  }

  return indices;
};

// Export the optimized version as default
export default getIndicesFromStrPath_optimized;
