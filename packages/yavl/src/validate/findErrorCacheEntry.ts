import * as R from 'ramda';
import { ModelValidationCache, MutatingErrorCacheKey } from './types';
import createErrorCacheEntry from './createErrorCacheEntry';
import { RecursiveDefinition } from '../types';
import resolveCurrentIndex from '../utils/resolveCurrentIndex';
import resolveModelPathStr from './resolveModelPathStr';

export const getOrCreateErrorCacheEntry = <ErrorType>(
  currentCacheEntry: ModelValidationCache<ErrorType>,
  cacheKey: MutatingErrorCacheKey<ErrorType>,
) => {
  const existingEntry = currentCacheEntry.children.get(cacheKey);
  if (existingEntry !== undefined) {
    return existingEntry;
  }

  // if the path does not yet exist in the errors cache, create a new entry
  // and copy whether the path is active from the parent definition
  const newEntry = createErrorCacheEntry<ErrorType>();

  currentCacheEntry.children.set(cacheKey, newEntry);

  return newEntry;
};

const findErrorCacheEntry = <ErrorType>(
  validateDiffCache: ModelValidationCache<ErrorType>,
  definitions: readonly RecursiveDefinition<ErrorType>[],
  currentIndices: Record<string, number>,
  resolveLastEntryIfArray = true,
  followInactivePath = true,
): ModelValidationCache<ErrorType> => {
  const lastItem = R.last(definitions);
  const cacheEntry = R.reduceWhile<RecursiveDefinition<ErrorType>, ModelValidationCache<ErrorType>>(
    currentCache => currentCache.isPathActive || followInactivePath,
    (currentCache, definition) => {
      const cacheForDefinition = getOrCreateErrorCacheEntry(currentCache, definition);

      if (definition.type === 'array' && (resolveLastEntryIfArray || definition !== lastItem)) {
        const pathToField = resolveModelPathStr(R.dropLast(1, definition.context.pathToField), currentIndices);
        const index = resolveCurrentIndex(pathToField, currentIndices);
        const cacheForArrayElem = getOrCreateErrorCacheEntry(cacheForDefinition, index);

        return cacheForArrayElem;
      } else {
        return cacheForDefinition;
      }
    },
    validateDiffCache,
    definitions,
  );

  return cacheEntry;
};

export default findErrorCacheEntry;
