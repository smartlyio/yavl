import { ModelValidationContext } from './types';

export const getExternalData = <ExternalData>(
  context: ModelValidationContext<any, ExternalData, any>,
): ExternalData => {
  if (context.previousExternalData === undefined) {
    throw new Error('No external data, did you remember to call updateModel()');
  }

  return context.previousExternalData;
};
