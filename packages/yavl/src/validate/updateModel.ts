import { NoInfer } from '../types';
import { CompareFn, ModelValidationContext } from './types';
import notifySubscribers from './notifySubscribers';
import { processModelChanges } from './processModelChanges';
import { processInitialModel } from './processInitialModel';

export type ChangedPaths = ReadonlyArray<ReadonlyArray<string | number>>;

interface UpdateModelFn {
  <FormData, ExternalData = undefined, ErrorType = string>(
    context: ModelValidationContext<FormData, ExternalData, ErrorType>,
    data: NoInfer<FormData>,
    externalData?: NoInfer<ExternalData>,
    isEqualFn?: CompareFn,
    changedPaths?: ChangedPaths,
  ): void;
}

const updateModel: UpdateModelFn = <Data, ExternalData = undefined, ErrorType = string>(
  context: ModelValidationContext<Data, ExternalData, ErrorType>,
  data: Data,
  externalData?: ExternalData,
  isEqualFn: CompareFn = Object.is,
  changedPaths?: ChangedPaths,
): void => {
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
