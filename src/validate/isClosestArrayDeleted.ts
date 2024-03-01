import * as R from 'ramda';
import { strPathToArray } from '../utils/strPathToArray';

export const isClosestArrayDeleted = (data: any, field: string) => {
  const path = strPathToArray(field);
  const indexOfLastArray = R.findLastIndex(R.is(Number), path);
  if (indexOfLastArray === -1) {
    return false;
  }

  const pathToArray = path.slice(0, indexOfLastArray + 1);
  const pathExists = R.hasPath(
    // @ts-expect-error - hasPath works with (string|number)[] but ramda typings are wrong
    pathToArray,
    data
  );

  return !pathExists;
};
