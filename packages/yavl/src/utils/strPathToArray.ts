const NUMBER_REGEX = /^\d+$/;
const isNumber = (value: string): boolean => NUMBER_REGEX.test(value);

const OPENING_BRACKET = '[';
const CLOSING_BRACKET = ']';
const DOT = '.';

export const strPathToArray = (path: string): Array<string | number> => {
  if (!path) {
    return [];
  }

  const pathLength = path.length;
  const result: Array<string | number> = [];
  let currentPart = '';
  let inBracket = false;

  for (let i = 0; i < pathLength; i++) {
    const char = path[i];

    if (char === DOT && !inBracket) {
      if (currentPart) {
        result.push(isNumber(currentPart) ? Number(currentPart) : currentPart);
        currentPart = '';
      }
    } else if (char === OPENING_BRACKET) {
      if (currentPart) {
        result.push(currentPart);
        currentPart = '';
      }
      inBracket = true;
    } else if (char === CLOSING_BRACKET && inBracket) {
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
