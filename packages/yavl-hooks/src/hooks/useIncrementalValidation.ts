import { useMemo, useCallback } from 'react';
import {
  Model,
  ModelValidationContext,
  ModelValidationErrors,
  CompareFn,
  createValidationContext,
  validateModel,
} from '@smartlyio/yavl';

export const useIncrementalValidation = <Data, ExternalData, ErrorType>(
  model: Model<Data, ExternalData, ErrorType>,
  initialExternalData?: ExternalData,
  isEqualFn?: CompareFn,
) => {
  const modelContext = useMemo<ModelValidationContext<Data, ExternalData, ErrorType>>(
    () => createValidationContext(model, initialExternalData),
    [model], // eslint-disable-line
  );

  const validate = useCallback(
    (data: Data, externalData?: ExternalData): ModelValidationErrors<ErrorType> =>
      validateModel(modelContext, data, externalData, isEqualFn),
    [modelContext, isEqualFn],
  );

  return { modelContext, validate };
};
