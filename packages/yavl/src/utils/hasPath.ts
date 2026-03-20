const hasPath = (path: (string | number)[], obj: any): boolean => {
  let current = obj;
  for (const key of path) {
    if (current == null || typeof current !== 'object') {
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
