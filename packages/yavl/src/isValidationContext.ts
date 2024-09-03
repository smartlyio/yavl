import { Model } from './types';
import { ModelValidationContext } from './validate/types';

const isValidationContext = <FormData, ExternalData, ErrorType>(
  modelOrValidationContext:
    | Model<FormData, ExternalData, ErrorType>
    | ModelValidationContext<FormData, ExternalData, ErrorType>,
): modelOrValidationContext is ModelValidationContext<FormData, ExternalData, ErrorType> =>
  'model' in modelOrValidationContext;

export default isValidationContext;
