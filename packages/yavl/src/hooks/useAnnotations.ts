import { useEffect, useMemo, useRef } from 'react';
import { subscribeToAnnotations } from '../subscribeToAnnotations';
import { AnnotationsSubscriptionFilters, AnnotationsSubscriptionValue } from '../types';
import { ModelValidationContext } from '../validate/types';
import useForceUpdate from './useForceUpdate';
import { useMemoizedValue } from './useMemoizedValue';

type TRef<T> =
  | { hasValue: false }
  | {
      hasValue: true;
      value: T;
    };

interface UseAnnotations {
  (
    context: ModelValidationContext<any, any, any>,
    filters?: AnnotationsSubscriptionFilters,
  ): AnnotationsSubscriptionValue;
}

// create outside of the hook so the object is not re-generated
const defaultFilters: AnnotationsSubscriptionFilters = {};

export const useAnnotations: UseAnnotations = (
  context: ModelValidationContext<any, any, any>,
  filters?: AnnotationsSubscriptionFilters,
): AnnotationsSubscriptionValue => {
  const memoizedFilters = useMemoizedValue(filters);
  const annotationValueRef = useRef<TRef<AnnotationsSubscriptionValue>>({
    hasValue: false,
  });

  const forceUpdate = useForceUpdate();
  const unsubscribe = useMemo(() => {
    // because this useMemo can run when eg. path or annotation changes,
    // let's make sure to reset the current value in that case to avoid bugs
    annotationValueRef.current = {
      hasValue: false,
    };

    const subscribe = (value: AnnotationsSubscriptionValue) => {
      annotationValueRef.current = {
        hasValue: true,
        value,
      };

      forceUpdate();
    };

    return subscribeToAnnotations(context, memoizedFilters ?? defaultFilters, subscribe);
  }, [context, memoizedFilters, forceUpdate]);

  // unsubscribes from changes if the field or annotation changes, or when unmount happens
  useEffect(() => unsubscribe, [unsubscribe]);

  if (!annotationValueRef.current.hasValue) {
    throw new Error(`subscriber did not instantly notify the current value, this should never happen`);
  }

  return annotationValueRef.current.value;
};
