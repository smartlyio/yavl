import { getResolvedValidationErrors, updateResolvedValidationErrors } from '../utils/resolvedValidationsHelpers';
import { getFieldValidationErrors } from './getFieldValidationErrors';
import { ProcessingContext } from './types';
import { deepEqual } from '../utils/deepEqual';

export const updateChangedValidation = <Data, ExternalData, ErrorType>(
  processingContext: ProcessingContext<Data, ExternalData, ErrorType>,
  pathToFieldStr: string,
): void => {
  const previousErrors = getResolvedValidationErrors(processingContext.resolvedValidations.current, pathToFieldStr);

  const nextErrors = getFieldValidationErrors(processingContext, pathToFieldStr);

  if (!deepEqual(nextErrors, previousErrors)) {
    updateResolvedValidationErrors(processingContext.resolvedValidations, pathToFieldStr, nextErrors);
  }
};

export const removeValidationsForField = <Data, ExternalData, ErrorType>(
  processingContext: ProcessingContext<Data, ExternalData, ErrorType>,
  pathToFieldStr: string,
): void => {
  const previousErrors = getResolvedValidationErrors(processingContext.resolvedValidations.current, pathToFieldStr);

  if (previousErrors !== undefined) {
    updateResolvedValidationErrors(processingContext.resolvedValidations, pathToFieldStr, undefined);
  }
};
