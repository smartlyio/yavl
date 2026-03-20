import { Annotation, noValue } from '../types';
import { getResolvedAnnotation, updateResolvedAnnotation } from '../utils/resolvedAnnotationsHelpers';
import { getChangedAnnotationsCacheForPath } from './getChangedAnnotationsCacheForPath';
import { getFieldResolvedAnnotation } from './getFieldResolvedAnnotation';
import { ProcessingContext } from './types';
import { valueAnnotation } from '../annotations';
import { strPathToArray } from '../utils/strPathToArray';
import { deepEqual } from '../utils/deepEqual';

const hasPath = (path: (string | number)[], obj: any): boolean => {
  let current = obj;
  for (const key of path) {
    if (current == null || typeof current !== 'object') {
      return false;
    }
    if (!(key in current)) {
      return false;
    }
    current = current[key];
  }
  return true;
};

const getPath = (path: (string | number)[], obj: any): any => {
  let current = obj;
  for (const key of path) {
    if (current == null) {
      return undefined;
    }
    current = current[key];
  }
  return current;
};

const setPath = (path: (string | number)[], value: any, obj: any): any => {
  if (path.length === 0) {
    return value;
  }
  const [head, ...rest] = path;
  const current = obj == null ? (typeof head === 'number' ? [] : {}) : Array.isArray(obj) ? [...obj] : { ...obj };
  current[head] = setPath(rest, value, current[head]);
  return current;
};

const markFieldAnnotationAsChanged = <Data, ExternalData, ErrorType>(
  processingContext: ProcessingContext<Data, ExternalData, ErrorType>,
  pathToFieldStr: string,
  annotation: Annotation<any>,
) => {
  const cache = getChangedAnnotationsCacheForPath(processingContext.changedAnnotationsCache, pathToFieldStr);

  cache.add(annotation);
};

const processComputedValueAnnotation = <Data, ExternalData, ErrorType>(
  processingContext: ProcessingContext<Data, ExternalData, ErrorType>,
  pathToFieldStr: string,
): void => {
  const value = getFieldResolvedAnnotation(processingContext, pathToFieldStr, valueAnnotation);

  const path = strPathToArray(pathToFieldStr);

  const previousValue = hasPath(path, processingContext.data) ? getPath(path, processingContext.data) : noValue;

  // update processingContext data if the value has changed
  if (value !== noValue && value !== previousValue) {
    processingContext.data = setPath(path, value, processingContext.data);
  }
};

export const updateChangedAnnotation = <Data, ExternalData, ErrorType>(
  processingContext: ProcessingContext<Data, ExternalData, ErrorType>,
  pathToFieldStr: string,
  annotation: Annotation<any>,
): void => {
  /**
   * Process computed value annotations even if they have not changed, because
   * it's possible that the computed value was changed outside of the model,
   * with this we ensure we update the field back to the value of the computed
   * value.
   */
  if (annotation === valueAnnotation) {
    return processComputedValueAnnotation(processingContext, pathToFieldStr);
  }

  const previousResolvedAnnotation = getResolvedAnnotation(
    processingContext.resolvedAnnotations.current,
    pathToFieldStr,
    annotation,
  );

  const nextResolvedAnnotation = getFieldResolvedAnnotation(processingContext, pathToFieldStr, annotation);

  const hasAnnotationChanged = !deepEqual(nextResolvedAnnotation, previousResolvedAnnotation);

  if (hasAnnotationChanged) {
    updateResolvedAnnotation(processingContext, pathToFieldStr, annotation, nextResolvedAnnotation);

    markFieldAnnotationAsChanged(processingContext, pathToFieldStr, annotation);
  }
};

export const removeAnnotationForField = <Data, ExternalData, ErrorType>(
  processingContext: ProcessingContext<Data, ExternalData, ErrorType>,
  pathToFieldStr: string,
  annotation: Annotation<any>,
): void => {
  // no need to do anything for computed values
  if (annotation === valueAnnotation) {
    return;
  }

  const previousResolvedAnnotation = getResolvedAnnotation(
    processingContext.resolvedAnnotations.current,
    pathToFieldStr,
    annotation,
  );

  if (previousResolvedAnnotation !== noValue) {
    updateResolvedAnnotation(processingContext, pathToFieldStr, annotation, noValue);

    markFieldAnnotationAsChanged(processingContext, pathToFieldStr, annotation);
  }
};
