import { ModelValidationErrors, ModelValidationContext } from './types';
import { isEmpty } from '../utils/isEmpty';

const getValidationErrors = <ErrorType>(
  context: ModelValidationContext<any, any, ErrorType>,
): ModelValidationErrors<ErrorType> => {
  return isEmpty(context.resolvedValidations.current) ? undefined : context.resolvedValidations.current;
};

export default getValidationErrors;
