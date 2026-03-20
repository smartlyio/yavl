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
  const lastItem = definitions[definitions.length - 1];
  let cacheEntry = validateDiffCache;
  for (const definition of definitions) {
    if (!(cacheEntry.isPathActive || followInactivePath)) {
      break;
    }
    const cacheForDefinition = getOrCreateErrorCacheEntry(cacheEntry, definition);
    if (definition.type === 'array' && (resolveLastEntryIfArray || definition !== lastItem)) {
      const pathToField = resolveModelPathStr(definition.context.pathToField.slice(0, -1), currentIndices);
      const index = resolveCurrentIndex(pathToField, currentIndices);
      cacheEntry = getOrCreateErrorCacheEntry(cacheForDefinition, index);
    } else {
      cacheEntry = cacheForDefinition;
    }
  }

  return cacheEntry;
};

export default findErrorCacheEntry;
