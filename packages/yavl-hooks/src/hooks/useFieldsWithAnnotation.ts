import * as R from 'ramda';
import { ModelValidationContext, Annotation, getAnnotationValue } from '@smartlyio/yavl';
import { useAnnotations } from './useAnnotations';
import { useMemo } from 'react';
import { useMemoizedValue } from './useMemoizedValue';

type UseFieldsWithAnnotationFilters<T> = {
  value?: T;
  pathPrefix?: string;
};

interface UseFieldsWithAnnotation {
  <T>(
    context: ModelValidationContext<any, any, any>,
    annotation: Annotation<T>,
    filters?: UseFieldsWithAnnotationFilters<T>,
  ): string[];
}

export const useFieldsWithAnnotation: UseFieldsWithAnnotation = <T>(
  context: ModelValidationContext<any, any, any>,
  annotation: Annotation<T>,
  filters?: UseFieldsWithAnnotationFilters<T>,
): string[] => {
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

  const fieldsWithAnnotation = useMemo(
    () =>
      Object.entries(annotations).flatMap(([field, fieldAnnotations]) =>
        /**
         * Include field if:
         * - filters are not given
         * - filters are given, but filters.value is not given
         * - filters.value is given and the value matches
         *
         * NOTE. We use 'value' in filters because if you give the value but
         * give it as undefined, then we should only return fields for which
         * the annotation is undefined
         */
        memoizedFilters === undefined ||
        !('value' in memoizedFilters) ||
        R.equals(memoizedFilters.value, getAnnotationValue(fieldAnnotations, annotation))
          ? [field]
          : [],
      ),
    [annotations, annotation, memoizedFilters],
  );

  return fieldsWithAnnotation;
};
