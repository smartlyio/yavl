import { Model, NoInfer } from '../types';
import { CompareFn, ModelValidationErrors, ModelValidationContext } from './types';
import createValidationContext from './createValidationContext';
import getValidationErrors from './getValidationErrors';
import updateModel from './updateModel';

interface ValidateModelFn {
  <FormData, ExternalData = undefined, ErrorType = string>(
    model: Model<FormData, ExternalData, ErrorType>,
    data: NoInfer<FormData>,
    externalData?: NoInfer<ExternalData>,
    isEqualFn?: CompareFn,
  ): ModelValidationErrors<ErrorType>;

  <FormData, ExternalData = undefined, ErrorType = string>(
    context: ModelValidationContext<FormData, ExternalData, ErrorType>,
    data: NoInfer<FormData>,
    externalData?: NoInfer<ExternalData>,
    isEqualFn?: CompareFn,
  ): ModelValidationErrors<ErrorType>;
}

const validateModel: ValidateModelFn = <FormData, ExternalData = undefined, ErrorType = string>(
  modelOrContext: Model<FormData, ExternalData, ErrorType> | ModelValidationContext<FormData, ExternalData, ErrorType>,
  data: FormData,
  externalData?: ExternalData,
  isEqualFn: CompareFn = Object.is,
): ModelValidationErrors<ErrorType> => {
  const model = 'modelDefinition' in modelOrContext ? modelOrContext : modelOrContext.model;

  // if model was passed, create new context only for this validation run
  const context = 'modelDefinition' in modelOrContext ? createValidationContext(model) : modelOrContext;

  updateModel(context, data, externalData, isEqualFn);

  return getValidationErrors(context);
};

export default validateModel;
