import * as R from 'ramda';
import { ModelValidationContext, Annotation, getAnnotationValue } from '@smartlyio/yavl';
import { useAnnotations } from './useAnnotations';
import { useMemo } from 'react';
import { useMemoizedValue } from './useMemoizedValue';

type UseFieldsAnnotationFilters = {
  pathPrefix?: string;
};

interface UseFieldsAnnotation {
  <T>(
    context: ModelValidationContext<any, any, any>,
    annotation: Annotation<T>,
    filters?: UseFieldsAnnotationFilters,
  ): Record<string, T>;
}

export const useFieldsAnnotation: UseFieldsAnnotation = <T>(
  context: ModelValidationContext<any, any, any>,
  annotation: Annotation<T>,
  filters?: UseFieldsAnnotationFilters,
): Record<string, T> => {
  const memoizedFilters = useMemoizedValue(filters);
  const annotations = useAnnotations(
    context,
    useMemo(
      () => ({
        pathPrefix: memoizedFilters?.pathPrefix,
        annotations: [annotation],
      }),
      [memoizedFilters, annotation],
    ),
  );

  const fieldAnnotations = R.mapObjIndexed(data => getAnnotationValue(data, annotation), annotations);

  return fieldAnnotations;
};
