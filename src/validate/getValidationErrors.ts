import * as R from 'ramda';
import { ModelValidationErrors, ModelValidationContext } from './types';

const getValidationErrors = <ErrorType>(
  context: ModelValidationContext<any, any, ErrorType>
): ModelValidationErrors<ErrorType> => {
  return R.isEmpty(context.resolvedValidations.current)
    ? undefined
    : context.resolvedValidations.current;
};

export default getValidationErrors;
