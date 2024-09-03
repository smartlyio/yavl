import * as R from 'ramda';
import {
  Annotation,
  AnnotationsSubscription,
  AnnotationsSubscriptionFilters,
  AnnotationsSubscriptionValue,
  SubscribeToAnnotationsFn,
  UnsubscribeFn,
} from './types';
import { ModelValidationContext } from './validate/types';

interface SubscribeToAnnotations {
  // subscribes to all annotations
  (context: ModelValidationContext<any, any, any>, subscribeFn: SubscribeToAnnotationsFn): UnsubscribeFn;

  // subscribes to specific annotations in specific paths
  <Annotations extends Annotation<unknown>[]>(
    context: ModelValidationContext<any, any, any>,
    filters: {
      pathPrefix?: string;
      annotations?: Annotations;
    },
    subscribeFn: SubscribeToAnnotationsFn,
  ): UnsubscribeFn;
}

const getInitialValue = (
  context: ModelValidationContext<any, any, any>,
  { pathPrefix, annotations }: AnnotationsSubscriptionFilters,
): AnnotationsSubscriptionValue => {
  return Object.entries(context.resolvedAnnotations.current).reduce(
    (acc: AnnotationsSubscriptionValue, [path, annotationData]) => {
      if (pathPrefix !== undefined && !path.startsWith(pathPrefix)) {
        return acc;
      }

      const filteredAnnotationData = annotations ? R.pick(annotations, annotationData) : annotationData;

      if (R.isEmpty(filteredAnnotationData)) {
        return acc;
      }

      return { ...acc, [path]: filteredAnnotationData };
    },
    {},
  );
};

export const subscribeToAnnotations: SubscribeToAnnotations = (
  context: ModelValidationContext<any, any, any>,
  ...rest: [SubscribeToAnnotationsFn] | [AnnotationsSubscriptionFilters, SubscribeToAnnotationsFn]
): UnsubscribeFn => {
  const filters = typeof rest[0] === 'object' ? rest[0] : {};
  const subscribeFn = typeof rest[0] === 'object' ? rest[1]! : rest[0];

  const value = getInitialValue(context, filters);
  const subscription: AnnotationsSubscription = {
    filters,
    previousValue: value,
    subscribeFn,
  };

  context.subscriptions.annotations.add(subscription);

  const unsubscribe = () => {
    context.subscriptions.annotations.delete(subscription);
  };

  subscribeFn(value);

  return unsubscribe;
};
