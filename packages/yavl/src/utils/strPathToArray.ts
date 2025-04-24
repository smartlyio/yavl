const NUMBER_REGEX = /^\d+$/;
const isNumber = (value: string): boolean => NUMBER_REGEX.test(value);

export const strPathToArray_stack = (path: string): Array<string | number> => {
  if (!path) {
    return [];
  }

  const result: Array<string | number> = [];
  let currentPart = '';
  let inBracket = false;

  for (let i = 0; i < path.length; i++) {
    const char = path[i];

    if (char === '.' && !inBracket) {
      if (currentPart) {
        // Convert to number if it's a numeric string
        result.push(isNumber(currentPart) ? Number(currentPart) : currentPart);
        currentPart = '';
      }
    } else if (char === '[') {
      if (currentPart) {
        result.push(currentPart);
        currentPart = '';
      }
      inBracket = true;
    } else if (char === ']' && inBracket) {
      if (currentPart && isNumber(currentPart)) {
        result.push(Number(currentPart));
      } else if (currentPart) {
        result.push(currentPart);
      }
      currentPart = '';
      inBracket = false;
    } else {
      currentPart += char;
    }
  }

  // Handle any remaining part
  if (currentPart) {
    result.push(isNumber(currentPart) ? Number(currentPart) : currentPart);
  }

  return result;
};

const integerStringsToNumber = (arr: string[]): Array<string | number> =>
  arr.map(it => (isNumber(it) ? Number(it) : it));

export const strPathToArray = (path: string): Array<string | number> =>
  integerStringsToNumber(path.split(/\.|\[(\d+)\]/).filter(Boolean));
