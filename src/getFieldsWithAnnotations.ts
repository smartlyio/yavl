import { AnnotationData } from './types';
import { ModelValidationContext } from './validate/types';
import getAllAnnotations from './getAllAnnotations';

// R.whereEq does not support symbols
const whereEq = (matchAnnotations: AnnotationData) => (
  annotationsToCheck: AnnotationData
): boolean =>
  Object.keys(matchAnnotations).every(
    (annotation) =>
      matchAnnotations[annotation] === annotationsToCheck[annotation]
  );

const getFieldsWithAnnotations = <FormData, ExternalData, ErrorType>(
  context: ModelValidationContext<FormData, ExternalData, ErrorType>,
  annotations: AnnotationData
): string[] => {
  const annotationsForAllFields = getAllAnnotations(context);

  const annotationsMatch = whereEq(annotations);
  const matchingFields = Object.entries(annotationsForAllFields)
    .filter(([_, annotations]) => annotationsMatch(annotations))
    .map(([field]) => field);

  return matchingFields;
};

export default getFieldsWithAnnotations;
