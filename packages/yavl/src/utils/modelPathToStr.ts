import { PathToField } from '../types';

/**
 * Converts path in model path format into a string with
 * array indices being [all] or [current]
 */
const modelPathToStr = (
  type: 'internal' | 'external',
  path: PathToField
): string => {
  const modelPath = path.reduce<string>((acc, pathPart) => {
    if (pathPart.type === 'field') {
      if (acc.length > 0) {
        return `${acc}.${pathPart.name}`;
      } else {
        return pathPart.name;
      }
    } else if (
      pathPart.type === 'pick' ||
      pathPart.type === 'filter' ||
      pathPart.type === 'path' ||
      pathPart.type === 'index'
    ) {
      // these don't change the path in anyway
      return acc;
    } else if (pathPart.type === 'annotation') {
      return `${acc}/${pathPart.annotation}`;
    } else {
      if (pathPart.focus === 'all') {
        return `${acc}[all]`;
      } else if (pathPart.focus === 'current') {
        return `${acc}[current]`;
      } else if (pathPart.multiToSingleFocus) {
        // in case we're switching from multi to single focus, we don't want to add anything to the path
        // because we already have [all] in the part in the correct place. The at(N) only affects the
        // resolving of the dependency
        return acc;
      } else {
        return `${acc}[${pathPart.index}]`;
      }
    }
  }, '');

  return `${type}:${modelPath}`;
};

export default modelPathToStr;
