import * as R from 'ramda';
import { ResolvedValidations } from '../validate/types';

export const getResolvedValidationErrors = <ErrorType>(
  resolvedValidations: ResolvedValidations<ErrorType>['current'],
  field: string,
): ErrorType[] | undefined => {
  if (!(field in resolvedValidations)) {
    return undefined;
  }

  return resolvedValidations[field];
};

export const updateResolvedValidationErrors = <ErrorType>(
  resolvedValidations: ResolvedValidations<ErrorType>,
  field: string,
  errors: ErrorType[] | undefined,
): void => {
  resolvedValidations.current = { ...resolvedValidations.current };
  if (errors !== undefined) {
    resolvedValidations.current[field] = R.uniq(errors);
  } else {
    // delete errors from field
    delete resolvedValidations.current[field];
  }
};
