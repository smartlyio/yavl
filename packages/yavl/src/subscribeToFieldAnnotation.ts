import getFieldAnnotation from './getFieldAnnotation';
import {
  Annotation,
  FieldAnnotationSubscription,
  noValue,
  SubscribeToFieldAnnotationFn,
  UnsubscribeFn
} from './types';
import { ModelValidationContext } from './validate/types';

interface SubscribeToFieldAnnotation {
  <Value>(
    context: ModelValidationContext<any, any, any>,
    path: string,
    annotation: Annotation<Value>,
    subscribeFn: SubscribeToFieldAnnotationFn<Value, never>
  ): UnsubscribeFn;

  <Value, DefaultValue>(
    context: ModelValidationContext<any, any, any>,
    path: string,
    annotation: Annotation<Value>,
    subscribeFn: SubscribeToFieldAnnotationFn<Value, DefaultValue>,
    defaultValue: DefaultValue
  ): UnsubscribeFn;
}

const addSubscription = (
  context: ModelValidationContext<any, any, any>,
  subscription: FieldAnnotationSubscription<any, any>
) => {
  const { path, annotation } = subscription;

  let fieldSubscriptions = context.subscriptions.fieldAnnotation.get(path);
  if (!fieldSubscriptions) {
    fieldSubscriptions = new Map();
    context.subscriptions.fieldAnnotation.set(path, fieldSubscriptions);
  }

  let annotationSubscriptions = fieldSubscriptions.get(annotation);
  if (!annotationSubscriptions) {
    annotationSubscriptions = new Set();
    fieldSubscriptions.set(annotation, annotationSubscriptions);
  }

  annotationSubscriptions.add(subscription);
};

const subscribeToFieldAnnotation: SubscribeToFieldAnnotation = <
  Value,
  DefaultValue
>(
  context: ModelValidationContext<any, any, any>,
  path: string,
  annotation: Annotation<Value>,
  subscribeFn: SubscribeToFieldAnnotationFn<Value, DefaultValue>,
  ...rest: [DefaultValue?]
): UnsubscribeFn => {
  const defaultValue = rest.length > 0 ? (rest[0] as DefaultValue) : noValue;
  const value = getFieldAnnotation(
    context,
    path,
    annotation,
    defaultValue as DefaultValue
  );

  const subscription: FieldAnnotationSubscription<Value, DefaultValue> = {
    path,
    annotation,
    previousValue: value,
    defaultValue,
    subscribeFn
  };

  addSubscription(context, subscription);

  const unsubscribe = () => {
    const fieldSubscriptions = context.subscriptions.fieldAnnotation.get(path);
    const annotationSubscriptions = fieldSubscriptions?.get(annotation);

    // these should always exist since we have a subscription, just done for type-narrowing
    if (fieldSubscriptions && annotationSubscriptions) {
      annotationSubscriptions.delete(subscription);

      // if this was last subscription for the annotation, clean up the caches
      if (annotationSubscriptions.size === 0) {
        fieldSubscriptions.delete(annotation);
      }

      // if this was last subscription for the field, clean up the caches
      if (fieldSubscriptions.size === 0) {
        context.subscriptions.fieldAnnotation.delete(path);
      }
    }
  };

  subscribeFn(value);

  return unsubscribe;
};

export default subscribeToFieldAnnotation;
