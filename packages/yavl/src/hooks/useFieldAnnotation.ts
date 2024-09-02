import { useEffect, useMemo, useRef } from 'react';
import subscribeToFieldAnnotation from '../subscribeToFieldAnnotation';
import { Annotation, noValue } from '../types';
import { ModelValidationContext } from '../validate/types';
import useForceUpdate from './useForceUpdate';

type TRef<T> =
  | { hasValue: false }
  | {
      hasValue: true;
      value: T;
    };

interface UseFieldAnnotation {
  <Value>(context: ModelValidationContext<any, any, any>, path: string, annotation: Annotation<Value>): Value;

  <Value, DefaultValue>(
    context: ModelValidationContext<any, any, any>,
    path: string,
    annotation: Annotation<Value>,
    defaultValue: DefaultValue,
  ): Value | DefaultValue;
}

export const useFieldAnnotation: UseFieldAnnotation = <Value, DefaultValue>(
  context: ModelValidationContext<any, any, any>,
  path: string,
  annotation: Annotation<Value>,
  ...rest: [DefaultValue?]
): Value | DefaultValue => {
  const defaultValue = rest.length > 0 ? (rest[0] as DefaultValue) : noValue;
  const annotationValueRef = useRef<TRef<Value | DefaultValue>>({
    hasValue: false,
  });

  const forceUpdate = useForceUpdate();
  const unsubscribe = useMemo(() => {
    // because this useMemo can run when eg. path or annotation changes,
    // let's make sure to reset the current value in that case to avoid bugs
    annotationValueRef.current = {
      hasValue: false,
    };

    const subscribe = (value: Value | DefaultValue) => {
      annotationValueRef.current = {
        hasValue: true,
        value,
      };

      forceUpdate();
    };

    return subscribeToFieldAnnotation(context, path, annotation, subscribe, defaultValue as DefaultValue);
  }, [context, path, annotation, defaultValue, forceUpdate]);

  // unsubscribes from changes if the field or annotation changes, or when unmount happens
  useEffect(() => unsubscribe, [unsubscribe]);

  if (!annotationValueRef.current.hasValue) {
    throw new Error(`subscriber did not instantly notify the current value, this should never happen`);
  }

  return annotationValueRef.current.value;
};
