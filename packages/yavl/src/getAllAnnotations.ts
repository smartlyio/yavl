import { AnnotationData } from './types';
import { ModelValidationContext } from './validate/types';

const getAllAnnotations = <FormData, ExternalData, ErrorType>(
  context: ModelValidationContext<FormData, ExternalData, ErrorType>,
): Record<string, AnnotationData> => {
  return context.resolvedAnnotations.current;
};

export default getAllAnnotations;
