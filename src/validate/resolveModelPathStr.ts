import dataPathToStr from '../utils/dataPathToStr';
import { PathToField } from '../types';
import resolveModelPath from './resolveModelPath';

/**
 * Resolves path in model path format into a string where
 * the [current] index is replaced with actual index.
 *
 * Trying to pass a model path with [all] indices will
 * cause an error to be thrown.
 */
const resolveModelPathStr = (
  path: PathToField,
  currentIndices: Record<string, number>
): string => {
  const resolvedPath = resolveModelPath(path, currentIndices);
  return dataPathToStr(resolvedPath);
};

export default resolveModelPathStr;
