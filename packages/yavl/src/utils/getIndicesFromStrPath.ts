export const getIndicesFromStrPath = (path: string): Record<string, number> => {
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
    throw new Error('Invalid path, array not in correct format');
  }

  return indices;
};
