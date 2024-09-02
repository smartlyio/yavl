import * as R from 'ramda';
import getFieldAnnotations from '../getFieldAnnotations';
import {
  Annotation,
  AnnotationsSubscription,
  AnnotationsSubscriptionValue,
  FieldAnnotationSubscription,
  noValue,
} from '../types';
import { ModelValidationContext } from './types';
import { isClosestArrayDeleted } from './isClosestArrayDeleted';

const getValueForSubscription = (value: any, subscription: FieldAnnotationSubscription<any, any>) => {
  if (value !== noValue) {
    return value;
  }

  if (subscription.defaultValue !== noValue) {
    return subscription.defaultValue;
  }

  throw new Error(
    `Annotation "${subscription.annotation.toString()}" was removed due to a change in parent condition, and no default value was provided for subscriber`,
  );
};

const notifyFieldAnnotationSubscribers = (
  context: ModelValidationContext<any, any, any>,
  path: string,
  annotation: Annotation<any>,
  value: any,
) => {
  /**
   * Don't notify the single field subscribers when annotation is removed due to fields being removed.
   * We don't want to subscriber to be notified in this case because they might not have a default
   * value specified, and if they don't, it'd throw an error. Most likely the consumer's subscriber
   * is about to subscribe in that situation when it notices the field has been removed, so we can
   * just keep the subscriber in the previous state, as there is not much else we can do.
   */
  const isDeleted = isClosestArrayDeleted(context.previousData, path);
  if (isDeleted) {
    return;
  }

  const subscriptions = context.subscriptions.fieldAnnotation.get(path)?.get(annotation);

  subscriptions?.forEach(subscription => {
    const valueForSubscription = getValueForSubscription(value, subscription);

    if (!R.equals(valueForSubscription, subscription.previousValue)) {
      subscription.subscribeFn(valueForSubscription);
      subscription.previousValue = valueForSubscription;
    }
  });
};

const getNextValueForAnnotationsSubscription = (
  subscription: AnnotationsSubscription,
  path: string,
  annotation: Annotation<unknown>,
  value: unknown,
): AnnotationsSubscriptionValue => {
  if (value === noValue) {
    const nextValue = R.dissocPath<AnnotationsSubscriptionValue>([path, annotation], subscription.previousValue);

    if (R.isEmpty(R.path([path], nextValue))) {
      return R.dissocPath([path], subscription.previousValue);
    }

    return nextValue;
  }

  return R.assocPath([path, annotation], value, subscription.previousValue);
};

const updateAndNotifyAnnotationSubscribers = (
  context: ModelValidationContext<any, any, any>,
  path: string,
  annotation: Annotation<any>,
  value: unknown,
) => {
  const subscriptions = context.subscriptions.annotations;

  subscriptions?.forEach(subscription => {
    const pathPrefixMatches =
      subscription.filters.pathPrefix === undefined || path.startsWith(subscription.filters.pathPrefix);

    const annotationMatches =
      subscription.filters.annotations === undefined || subscription.filters.annotations.includes(annotation);

    if (pathPrefixMatches && annotationMatches) {
      const nextValue = getNextValueForAnnotationsSubscription(subscription, path, annotation, value);

      subscription.subscribeFn(nextValue);
      subscription.previousValue = nextValue;
    }
  });
};

const notifySubscribers = (context: ModelValidationContext<any, any, any>): void => {
  // only notify subscribers when not in transaction
  const inTransaction = context.transactionCounter > 0;
  if (inTransaction) {
    return;
  }

  context.pendingChangedAnnotations.forEach((changedAnnotations, path) => {
    const annotationsForField = getFieldAnnotations(context, path);

    changedAnnotations.forEach(changedAnnotation => {
      const value = changedAnnotation in annotationsForField ? annotationsForField[changedAnnotation] : noValue;

      notifyFieldAnnotationSubscribers(context, path, changedAnnotation, value);
      updateAndNotifyAnnotationSubscribers(context, path, changedAnnotation, value);
    });
  });

  context.pendingChangedAnnotations.clear();
};

export default notifySubscribers;
