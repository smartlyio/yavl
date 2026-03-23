import isObject from './isObject';

const hasPath = (path: (string | number)[], obj: unknown): boolean => {
  let current: unknown = obj;
  for (const key of path) {
    if (!isObject(current)) {
      return false;
    }
    if (!(key in current)) {
      return false;
    }
    current = current[key];
  }
  return true;
};

export default hasPath;
