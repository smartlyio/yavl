import {
  MutatingFieldProcessingCache,
  MutatingFieldProcessingCacheEntry
} from './types';

const getProcessingCacheForField = <ErrorType>(
  fieldProcessingCache: MutatingFieldProcessingCache<ErrorType>,
  pathToField: string
): MutatingFieldProcessingCacheEntry<ErrorType> => {
  if (!fieldProcessingCache[pathToField]) {
    fieldProcessingCache[pathToField] = {
      ranValidations: new Map(),
      conditionTestFnResults: new Map(),
      processedConditionDefinitions: new Map(),
      processedAnnotationDefinitions: new Map(),
      processedComputations: new Map()
    };
  }

  return fieldProcessingCache[pathToField];
};

export default getProcessingCacheForField;
