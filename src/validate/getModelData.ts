import { ModelValidationContext } from './types';

export const getModelData = <Data>(
  context: ModelValidationContext<Data, any, any>
): Data => {
  if (context.previousData === undefined) {
    throw new Error('getModelData() was called before updateModel()');
  }

  return context.previousData;
};
