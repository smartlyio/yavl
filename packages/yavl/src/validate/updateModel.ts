import { NoInfer } from '../types';
import { CompareFn, ModelValidationContext } from './types';
import notifySubscribers from './notifySubscribers';
import { processModelChanges } from './processModelChanges';
import { processInitialModel } from './processInitialModel';

type PathToField = ReadonlyArray<string | number>;

export interface UpdateModelOptions {
  isEqualFn?: CompareFn;
  changedPaths?: ReadonlyArray<PathToField>;
}

interface UpdateModelFn {
  <FormData, ExternalData = undefined, ErrorType = string>(
    context: ModelValidationContext<FormData, ExternalData, ErrorType>,
    data: NoInfer<FormData>,
    externalData?: NoInfer<ExternalData>,
    isEqualFnOrOptions?: CompareFn | UpdateModelOptions,
  ): void;
}
const updateModel: UpdateModelFn = <Data, ExternalData = undefined, ErrorType = string>(
  context: ModelValidationContext<Data, ExternalData, ErrorType>,
  data: Data,
  externalData?: ExternalData,
  isEqualFnOrOptions?: CompareFn | UpdateModelOptions,
): void => {
  const isOptions = isEqualFnOrOptions !== undefined && typeof isEqualFnOrOptions !== 'function';
  const isEqualFn = isOptions ? isEqualFnOrOptions.isEqualFn ?? Object.is : isEqualFnOrOptions ?? Object.is;
  const changedPaths = isOptions ? isEqualFnOrOptions.changedPaths : undefined;
  const isInitialValidation = context.previousData === undefined;

  if (isInitialValidation) {
    processInitialModel(context, data, externalData, isEqualFn);
  } else {
    processModelChanges(
      context,
      undefined,
      'validations',
      isInitialValidation,
      data,
      externalData,
      isEqualFn,
      changedPaths,
    );
  }

  notifySubscribers(context);
};

export default updateModel;
