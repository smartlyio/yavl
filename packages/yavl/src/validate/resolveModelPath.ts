import { PathToField } from '../types';
import dataPathToStr from '../utils/dataPathToStr';
import { assertUnreachable } from '../utils/typeUtils';

/**
 * Resolves path in model path format into a string where
 * the [current] index is replaced with actual index.
 *
 * Trying to pass a model path with [all] indices will
 * cause an error to be thrown.
 */
const resolveModelPath = (path: PathToField, currentIndices: Record<string, number>): (string | number)[] => {
  return path.reduce<(string | number)[]>((path, arrayOrField) => {
    if (arrayOrField.type === 'field') {
      path.push(arrayOrField.name);
      return path;
    } else if (
      arrayOrField.type === 'pick' ||
      arrayOrField.type === 'filter' ||
      arrayOrField.type === 'path' ||
      arrayOrField.type === 'index'
    ) {
      // these don't affect the model path at all
      return path;
    } else if (arrayOrField.type === 'annotation') {
      throw new Error('resolveModelPath should never be called for paths that have annotation in them');
    } else if (arrayOrField.type === 'array') {
      if (arrayOrField.focus === 'index') {
        if (arrayOrField.multiToSingleFocus) {
          // TODO: this can be removed once we improve the model context types
          throw new Error('Using a model context that was derived from array.all is not supported');
        }
        path.push(arrayOrField.index);
        return path;
      } else if (arrayOrField.focus === 'current') {
        const pathStr = dataPathToStr(path);
        const currentIndex = currentIndices[pathStr];

        if (currentIndex === undefined) {
          throw new Error(`Trying to access current index of ${pathStr}, but current index missing for the path`);
        }

        path.push(currentIndex);
        return path;
      } else if (arrayOrField.focus === 'all') {
        throw new Error('All array focus is not supported in resolveModelPath');
      } else {
        return assertUnreachable(arrayOrField);
      }
    } else {
      return assertUnreachable(arrayOrField);
    }
  }, []);
};

export default resolveModelPath;
