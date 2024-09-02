import * as R from 'ramda';
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
  if (!processingContext.resolvedAnnotations.current[field]) {
    if (resolvedValue === noValue) {
      return;
    }

    if (processingContext.isInitialValidation) {
      processingContext.resolvedAnnotations.current[field] = {};
    } else {
      processingContext.resolvedAnnotations.current = R.assoc(field, {}, processingContext.resolvedAnnotations.current);
    }
  }

  if (resolvedValue !== noValue) {
    if (processingContext.isInitialValidation) {
      processingContext.resolvedAnnotations.current[field][annotation] = resolvedValue;
    } else {
      processingContext.resolvedAnnotations.current = R.assocPath(
        [field, annotation],
        resolvedValue,
        processingContext.resolvedAnnotations.current,
      );
    }
  } else {
    if (!(annotation in processingContext.resolvedAnnotations.current[field])) {
      return;
    }

    // delete previous value if there was any
    if (processingContext.isInitialValidation) {
      delete processingContext.resolvedAnnotations.current[field][annotation];
    } else {
      processingContext.resolvedAnnotations.current = R.dissocPath(
        [field, annotation],
        processingContext.resolvedAnnotations.current,
      );
    }

    // delete the whole field if this was last annotation
    if (Object.keys(processingContext.resolvedAnnotations.current[field]).length === 0) {
      if (processingContext.isInitialValidation) {
        delete processingContext.resolvedAnnotations.current[field];
      } else {
        processingContext.resolvedAnnotations.current = R.dissoc(field, processingContext.resolvedAnnotations.current);
      }
    }
  }
};
