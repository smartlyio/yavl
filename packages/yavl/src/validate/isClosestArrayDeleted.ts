import { strPathToArray } from '../utils/strPathToArray';

export const isClosestArrayDeleted = (data: any, field: string) => {
  const path = strPathToArray(field);
  const indexOfLastArray = path.findLastIndex(p => typeof p === 'number');
  if (indexOfLastArray === -1) {
    return false;
  }

  const pathToArray = path.slice(0, indexOfLastArray + 1);
  let pathExists = true;
  let current: any = data;
  for (const key of pathToArray) {
    if (current == null || typeof current !== 'object' || !(key in current)) {
      pathExists = false;
      break;
    }
    current = current[key];
  }

  return !pathExists;
};
