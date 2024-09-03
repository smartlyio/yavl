import { ModelValidationCache } from './types';

const createErrorCacheEntry = <ErrorType>() => {
  const newEntry: ModelValidationCache<ErrorType> = {
    isPathActive: true,
    annotations: new Map(),
    errors: new Map(),
    children: new Map(),
  };

  return newEntry;
};

export default createErrorCacheEntry;
