import { AnnotationData } from './types';
import { ModelValidationContext } from './validate/types';

interface GetFieldAnnotationsFn {
  // getFieldAnnotations(validateResult, 'list[0].value')
  <FormData, ExternalData, ErrorType>(
    context: ModelValidationContext<FormData, ExternalData, ErrorType>,
    field: string,
  ): AnnotationData;
}

const getFieldAnnotations: GetFieldAnnotationsFn = (
  context: ModelValidationContext<any, any, any>,
  field: string,
): AnnotationData => {
  return context.resolvedAnnotations.current[field] ?? {};
};

export default getFieldAnnotations;
