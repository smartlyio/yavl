import createErrorCacheEntry from '../../src/validate/createErrorCacheEntry';
import { ProcessingContext } from '../../src/validate/types';

export const getMockProcessingContext = (
  overwrites?: Partial<ProcessingContext<any, any, any>>
): ProcessingContext<any, any, any> => ({
  isInitialValidation: true,
  data: { mock: 'data' },
  externalData: { mock: 'external data' },
  previousDataAtStartOfUpdate: { mock: 'previous data' },
  previousExternalDataAtStartOfUpdate: { mock: 'previous external data' },
  dataAtStartOfPass: { mock: 'data' },
  validateDiffCache: createErrorCacheEntry<any>(),
  resolvedAnnotations: { current: {} },
  resolvedValidations: { current: {} },
  annotationBeingResolved: undefined,
  fieldDependencyCache: {},
  fieldProcessingCache: {},
  changedAnnotationsCache: new Map(),
  unprocessedValidationsForConditons: [],
  isEqualFn: Object.is,
  ...overwrites
});
