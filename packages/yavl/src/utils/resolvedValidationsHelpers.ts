import * as R from 'ramda';
import { ResolvedValidations } from '../validate/types';

export const getResolvedValidationErrors = <ErrorType>(
  resolvedValidations: ResolvedValidations<ErrorType>['current'],
  field: string
): ErrorType[] | undefined => {
  if (!(field in resolvedValidations)) {
    return undefined;
  }

  return resolvedValidations[field];
};

export const updateResolvedValidationErrors = <ErrorType>(
  resolvedValidations: ResolvedValidations<ErrorType>,
  field: string,
  errors: ErrorType[] | undefined
): void => {
  if (errors !== undefined) {
    resolvedValidations.current = R.assoc(
      field,
      R.uniq(errors),
      resolvedValidations.current
    );
  } else {
    // delete errors from field
    resolvedValidations.current = R.dissoc(field, resolvedValidations.current);
  }
};
