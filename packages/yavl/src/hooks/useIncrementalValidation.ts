import { useMemo, useCallback } from 'react';
import { Model } from '../types';
import {
  ModelValidationContext,
  ModelValidationErrors,
  CompareFn
} from '../validate/types';
import createValidationContext from '../validate/createValidationContext';
import validateModel from '../validate/validateModel';

export const useIncrementalValidation = <Data, ExternalData, ErrorType>(
  model: Model<Data, ExternalData, ErrorType>,
  initialExternalData?: ExternalData,
  isEqualFn?: CompareFn
) => {
  const modelContext = useMemo<
    ModelValidationContext<Data, ExternalData, ErrorType>
  >(
    () => createValidationContext(model, initialExternalData),
    [model] // eslint-disable-line
  );

  const validate = useCallback(
    (
      data: Data,
      externalData?: ExternalData
    ): ModelValidationErrors<ErrorType> =>
      validateModel(modelContext, data, externalData, isEqualFn),
    [modelContext, isEqualFn]
  );

  return { modelContext, validate };
};
