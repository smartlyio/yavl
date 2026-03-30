import { deepEqual } from 'fast-equals';
import { ResolvedValidations } from '../validate/types';

const uniqDeep = <T>(items: T[]): T[] => {
  const result: T[] = [];
  for (const item of items) {
    if (!result.some(existing => deepEqual(existing, item))) {
      result.push(item);
    }
  }
  return result;
};

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
    resolvedValidations.current[field] = uniqDeep(errors);
  } else {
    // delete errors from field
    delete resolvedValidations.current[field];
  }
};
