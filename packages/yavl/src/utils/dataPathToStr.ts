const dataPathToStr = (path: ReadonlyArray<string | number>): string => {
  return path.reduce<string>((acc, propOrIndex) => {
    if (typeof propOrIndex === 'string') {
      if (acc.length > 0) {
        return `${acc}.${propOrIndex}`;
      } else {
        return propOrIndex;
      }
    } else {
      return `${acc}[${propOrIndex}]`;
    }
  }, '');
};

export default dataPathToStr;
