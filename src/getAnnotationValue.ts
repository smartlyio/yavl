import { Annotation, AnnotationData } from './types';

interface GetAnnotationValueFn {
  <T>(data: AnnotationData, annotation: Annotation<T>): T;
  <T, DV>(data: AnnotationData, annotation: Annotation<T>, defaultValue: DV):
    | T
    | DV;
}

export const getAnnotationValue: GetAnnotationValueFn = <T, DV>(
  data: AnnotationData,
  annotation: Annotation<T>,
  ...args: [] | [DV]
): T | DV => {
  if (annotation in data) {
    return data[annotation];
  }

  if (args.length === 0) {
    throw new Error(
      `Annotation "${annotation}" not found in the annotation data`
    );
  }

  const defaultValue = args[0];
  return defaultValue;
};
