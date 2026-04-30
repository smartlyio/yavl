import { Annotation, noValue } from '../types';
import { ProcessingContext, ResolvedAnnotations } from '../validate/types';

export const getResolvedAnnotation = (
  resolvedAnnotations: ResolvedAnnotations['current'],
  field: string,
  annotation: Annotation<any>,
): any => {
  if (!(field in resolvedAnnotations)) {
    return noValue;
  }

  if (!(annotation in resolvedAnnotations[field])) {
    return noValue;
  }

  return resolvedAnnotations[field][annotation];
};

export const updateResolvedAnnotation = (
  processingContext: ProcessingContext<any, any, any>,
  field: string,
  annotation: Annotation<any>,
  resolvedValue: any, // this can be noValue in case there is no active annotation
): void => {
  const current = processingContext.resolvedAnnotations.current;

  if (!current[field]) {
    if (resolvedValue === noValue) {
      return;
    }
    current[field] = {};
  }

  if (resolvedValue !== noValue) {
    if (processingContext.isInitialValidation) {
      current[field][annotation] = resolvedValue;
    } else {
      current[field] = { ...current[field], [annotation]: resolvedValue };
    }
  } else {
    if (!(annotation in current[field])) {
      return;
    }

    if (!processingContext.isInitialValidation) {
      current[field] = { ...current[field] };
    }
    delete current[field][annotation];

    if (Object.keys(current[field]).length === 0) {
      delete current[field];
    }
  }
};
