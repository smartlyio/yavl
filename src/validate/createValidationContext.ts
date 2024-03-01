import { ModelValidationContext } from './types';
import { Model } from '../types';
import createErrorCacheEntry from './createErrorCacheEntry';

const createValidationContext = <FormData, ExternalData, ErrorType>(
  model: Model<FormData, ExternalData, ErrorType>,
  externalData?: ExternalData
): ModelValidationContext<FormData, ExternalData, ErrorType> => {
  return {
    model,
    previousData: undefined,
    previousExternalData: externalData,
    cache: createErrorCacheEntry<ErrorType>(),
    resolvedAnnotations: { current: {} },
    resolvedValidations: { current: {} },
    subscriptions: {
      fieldAnnotation: new Map(),
      annotations: new Set()
    },
    pendingChangedAnnotations: new Map(),
    transactionCounter: 0
  };
};

export default createValidationContext;
