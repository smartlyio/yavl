import { RecursiveDefinition } from '../types';
import findErrorCacheEntry from './findErrorCacheEntry';
import { ModelValidationCache } from './types';

// TODO: add tests, make sure to test the array as last definition case
export const getIsPathActive = (
  validateDiffCache: ModelValidationCache<any>,
  parentDefinitions: readonly RecursiveDefinition<any>[],
  indices: Record<string, number>,
) => {
  const { isPathActive } = findErrorCacheEntry(
    validateDiffCache,
    parentDefinitions,
    indices,
    true, // TODO: add test for this
    false,
  );

  return isPathActive;
};
