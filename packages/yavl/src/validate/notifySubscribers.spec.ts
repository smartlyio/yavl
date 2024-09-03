jest.mock('../getFieldAnnotations');

import { createAnnotation } from '../annotations';
import getFieldAnnotations from '../getFieldAnnotations';
import { FieldAnnotationSubscription, noValue } from '../types';
import notifySubscribers from './notifySubscribers';
import { ChangedAnnotationsCache, ModelValidationContext } from './types';

describe('notifySubscribers', () => {
  let mockValidationContext: ModelValidationContext<any, any, any>;
  let subscriptionWithOldValue: FieldAnnotationSubscription<any, any>;
  let subscriptionWithNewValue: FieldAnnotationSubscription<any, any>;

  const subscriberWithOldValue = jest.fn();
  const subscriberWithNewValue = jest.fn();

  const testAnnotation = createAnnotation<string>('test');
  const anotherAnnotation = createAnnotation<string>('another');

  const makeTestValidationContext = (
    subscriptions: FieldAnnotationSubscription<any, any>[],
    pendingChangedAnnotations: ChangedAnnotationsCache,
    inTransaction = false,
  ) =>
    ({
      subscriptions: {
        fieldAnnotation: new Map([['field', new Map([[testAnnotation, new Set(subscriptions)]])]]),
      },
      pendingChangedAnnotations,
      transactionCounter: inTransaction ? 1 : 0,
    } as ModelValidationContext<any, any, any>);

  beforeEach(() => {
    // we need to re-assign these for every test in order to reset previousValue
    subscriptionWithOldValue = {
      path: 'field',
      annotation: testAnnotation,
      previousValue: 'old value',
      defaultValue: 'default value',
      subscribeFn: subscriberWithOldValue,
    };

    subscriptionWithNewValue = {
      path: 'field',
      annotation: testAnnotation,
      previousValue: 'new value',
      defaultValue: 'default value',
      subscribeFn: subscriberWithNewValue,
    };

    jest.mocked(getFieldAnnotations).mockReturnValue({
      [testAnnotation]: 'new value',
      [anotherAnnotation]: 'new value',
    });
  });

  describe('when there are changed annotations', () => {
    describe('and transaction is active', () => {
      beforeEach(() => {
        const changedAnnotations = new Map([['field', new Set([testAnnotation])]]);

        mockValidationContext = makeTestValidationContext(
          [subscriptionWithOldValue, subscriptionWithNewValue],
          changedAnnotations,
          true,
        );

        notifySubscribers(mockValidationContext);
      });

      it('should not notify subscribers even if previous value is out of date', () => {
        expect(subscriberWithOldValue).not.toHaveBeenCalled();
        expect(subscriberWithNewValue).not.toHaveBeenCalled();
      });

      it('should not clear pending changed annotations', () => {
        expect(mockValidationContext.pendingChangedAnnotations.size).toBe(1);
      });
    });

    describe('and transaction is not active', () => {
      describe('always', () => {
        it('should clear the pending changed annotations', () => {
          const changedAnnotations = new Map([['field', new Set([testAnnotation])]]);

          mockValidationContext = makeTestValidationContext(
            [subscriptionWithOldValue, subscriptionWithNewValue],
            changedAnnotations,
          );

          expect(mockValidationContext.pendingChangedAnnotations.size).toBe(1);
          notifySubscribers(mockValidationContext);
          expect(mockValidationContext.pendingChangedAnnotations.size).toBe(0);
        });
      });

      describe('and when path and annotation matches', () => {
        describe('and changed annotation has a value', () => {
          beforeEach(() => {
            const changedAnnotations = new Map([['field', new Set([testAnnotation])]]);

            mockValidationContext = makeTestValidationContext(
              [subscriptionWithOldValue, subscriptionWithNewValue],
              changedAnnotations,
            );

            notifySubscribers(mockValidationContext);
          });

          it('should notify subscriber if the previous value is out of date', () => {
            expect(subscriberWithOldValue).toHaveBeenCalledTimes(1);
            expect(subscriberWithOldValue).toHaveBeenCalledWith('new value');
          });

          it('should not notify subscriber if the previous value is same as the new value', () => {
            expect(subscriberWithNewValue).not.toHaveBeenCalled();
          });
        });

        describe('and changed annotation no longer has a value', () => {
          beforeEach(() => {
            jest.mocked(getFieldAnnotations).mockReturnValue({});
          });

          describe('and subscription has a default value', () => {
            beforeEach(() => {
              const changedAnnotations = new Map([['field', new Set([testAnnotation])]]);

              const subscriptionWithDefaultValue: FieldAnnotationSubscription<any, any> = {
                path: 'field',
                annotation: testAnnotation,
                previousValue: 'test value',
                defaultValue: undefined, // test with undefined to make sure we treat is having a default value
                subscribeFn: subscriberWithNewValue,
              };

              mockValidationContext = makeTestValidationContext([subscriptionWithDefaultValue], changedAnnotations);

              notifySubscribers(mockValidationContext);
            });

            it('should notify subscriber with the default value', () => {
              expect(subscriberWithNewValue).toHaveBeenCalledTimes(1);
              expect(subscriberWithNewValue).toHaveBeenCalledWith(undefined);
            });
          });

          describe('and subscription has no default value', () => {
            it('should throw an error', () => {
              const subscriptionWithDefaultValue: FieldAnnotationSubscription<any, any> = {
                path: 'field',
                annotation: testAnnotation,
                previousValue: 'test value',
                defaultValue: noValue,
                subscribeFn: subscriberWithNewValue,
              };

              const changedAnnotations = new Map([['field', new Set([testAnnotation])]]);

              mockValidationContext = makeTestValidationContext([subscriptionWithDefaultValue], changedAnnotations);

              expect(() => notifySubscribers(mockValidationContext)).toThrowErrorMatchingInlineSnapshot(
                `"Annotation "test" was removed due to a change in parent condition, and no default value was provided for subscriber"`,
              );
            });
          });
        });

        describe('and when path matches but annotation does not', () => {
          beforeEach(() => {
            const changedAnnotations = new Map([['field', new Set([anotherAnnotation])]]);

            mockValidationContext = makeTestValidationContext(
              [subscriptionWithOldValue, subscriptionWithNewValue],
              changedAnnotations,
            );

            notifySubscribers(mockValidationContext);
          });

          it('should not notify any subscribers', () => {
            expect(subscriberWithNewValue).not.toHaveBeenCalled();
            expect(subscriberWithNewValue).not.toHaveBeenCalled();
          });
        });

        describe('and when annotation matches but path does not', () => {
          beforeEach(() => {
            const changedAnnotations = new Map([['anotherField', new Set([testAnnotation])]]);

            mockValidationContext = makeTestValidationContext(
              [subscriptionWithOldValue, subscriptionWithNewValue],
              changedAnnotations,
            );

            notifySubscribers(mockValidationContext);
          });

          it('should not notify any subscribers', () => {
            expect(subscriberWithNewValue).not.toHaveBeenCalled();
            expect(subscriberWithNewValue).not.toHaveBeenCalled();
          });
        });
      });
    });
  });
});
