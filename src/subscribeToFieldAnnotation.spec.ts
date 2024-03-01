jest.mock('./getFieldAnnotation');

import subscribeToFieldAnnotation from './subscribeToFieldAnnotation';
import { Annotation, noValue, SubscribeToFieldAnnotationFn } from './types';
import { ModelValidationContext } from './validate/types';
import getFieldAnnotation from './getFieldAnnotation';
import { createAnnotation } from './annotations';

describe('subscribeToFieldAnnotation', () => {
  let mockValidationContext: ModelValidationContext<any, any, any>;

  const subscribers = {
    fieldTestAnnotationA: jest.fn(),
    fieldTestAnnotationB: jest.fn(),
    fieldAnotherAnnotation: jest.fn(),
    anotherField: jest.fn()
  };

  const testAnnotation = createAnnotation<string>('test');
  const anotherAnnotation = createAnnotation<string>('another');
  const currentValue = 'test';

  const getExpectedSubscription = (
    path: string,
    annotation: Annotation<any>,
    subscribeFn: SubscribeToFieldAnnotationFn<any, any>
  ) => ({
    path,
    annotation,
    previousValue: currentValue,
    defaultValue: noValue,
    subscribeFn
  });

  beforeEach(() => {
    mockValidationContext = {
      subscriptions: {
        fieldAnnotation: new Map()
      }
    } as ModelValidationContext<any, any, any>;

    jest.mocked(getFieldAnnotation).mockReturnValue(currentValue);
  });

  describe('when subscribing', () => {
    beforeEach(() => {
      subscribeToFieldAnnotation(
        mockValidationContext,
        'field',
        testAnnotation,
        subscribers.fieldTestAnnotationA
      );

      // add one subscriber to same field & annotation to test cache building
      subscribeToFieldAnnotation(
        mockValidationContext,
        'field',
        testAnnotation,
        subscribers.fieldTestAnnotationB
      );

      subscribeToFieldAnnotation(
        mockValidationContext,
        'field',
        anotherAnnotation,
        subscribers.fieldAnotherAnnotation
      );

      subscribeToFieldAnnotation(
        mockValidationContext,
        'anotherField',
        testAnnotation,
        subscribers.anotherField
      );
    });

    it('should add a subscription to the validation context', () => {
      const expectedSubscriptions = new Map([
        [
          'field',
          new Map([
            [
              testAnnotation,
              new Set([
                getExpectedSubscription(
                  'field',
                  testAnnotation,
                  subscribers.fieldTestAnnotationA
                ),
                getExpectedSubscription(
                  'field',
                  testAnnotation,
                  subscribers.fieldTestAnnotationB
                )
              ])
            ],
            [
              anotherAnnotation,
              new Set([
                getExpectedSubscription(
                  'field',
                  anotherAnnotation,
                  subscribers.fieldAnotherAnnotation
                )
              ])
            ]
          ])
        ],
        [
          'anotherField',
          new Map([
            [
              testAnnotation,
              new Set([
                getExpectedSubscription(
                  'anotherField',
                  testAnnotation,
                  subscribers.anotherField
                )
              ])
            ]
          ])
        ]
      ]);

      expect(mockValidationContext.subscriptions.fieldAnnotation).toEqual(
        expectedSubscriptions
      );
    });

    it('should immediately call the subscribers with the current value', () => {
      Object.values(subscribers).forEach((subscriber) => {
        expect(subscriber).toHaveBeenCalledTimes(1);
        expect(subscriber).toHaveBeenCalledWith(currentValue);
      });
    });
  });

  describe('when unsubscribing', () => {
    describe('and when there are more subscriptions for the annotation', () => {
      beforeEach(() => {
        const unsubscribe = subscribeToFieldAnnotation(
          mockValidationContext,
          'field',
          testAnnotation,
          subscribers.fieldTestAnnotationA
        );

        subscribeToFieldAnnotation(
          mockValidationContext,
          'field',
          testAnnotation,
          subscribers.fieldTestAnnotationB
        );

        unsubscribe();
      });

      it('should remove subscription but keep the other subscriptions for the field and annotation intact', () => {
        const expectedSubscriptions = new Map([
          [
            'field',
            new Map([
              [
                testAnnotation,
                new Set([
                  getExpectedSubscription(
                    'field',
                    testAnnotation,
                    subscribers.fieldTestAnnotationB
                  )
                ])
              ]
            ])
          ]
        ]);

        expect(mockValidationContext.subscriptions.fieldAnnotation).toEqual(
          expectedSubscriptions
        );
      });
    });

    describe('and when there are no more subscriptions to the annotation', () => {
      describe('and when there are more subscriptions to the field for other annotations', () => {
        beforeEach(() => {
          const unsubscribe = subscribeToFieldAnnotation(
            mockValidationContext,
            'field',
            testAnnotation,
            subscribers.fieldTestAnnotationA
          );

          subscribeToFieldAnnotation(
            mockValidationContext,
            'field',
            anotherAnnotation,
            subscribers.fieldAnotherAnnotation
          );

          unsubscribe();
        });

        it('should remove the whole map for annotations with no more subscriptions but keep subscriptions for other annotations for same field intact', () => {
          const expectedSubscriptions = new Map([
            [
              'field',
              new Map([
                [
                  anotherAnnotation,
                  new Set([
                    getExpectedSubscription(
                      'field',
                      anotherAnnotation,
                      subscribers.fieldAnotherAnnotation
                    )
                  ])
                ]
              ])
            ]
          ]);

          expect(mockValidationContext.subscriptions.fieldAnnotation).toEqual(
            expectedSubscriptions
          );
        });
      });

      describe('and when there are no more any other subscriptions for the field', () => {
        beforeEach(() => {
          const unsubscribe = subscribeToFieldAnnotation(
            mockValidationContext,
            'field',
            testAnnotation,
            subscribers.fieldTestAnnotationA
          );

          subscribeToFieldAnnotation(
            mockValidationContext,
            'anotherField',
            testAnnotation,
            subscribers.anotherField
          );

          unsubscribe();
        });

        it('should remove the whole map for the annotations and the field, but keep other fields intact', () => {
          const expectedSubscriptions = new Map([
            [
              'anotherField',
              new Map([
                [
                  testAnnotation,
                  new Set([
                    getExpectedSubscription(
                      'anotherField',
                      testAnnotation,
                      subscribers.anotherField
                    )
                  ])
                ]
              ])
            ]
          ]);

          expect(mockValidationContext.subscriptions.fieldAnnotation).toEqual(
            expectedSubscriptions
          );
        });
      });
    });
  });
});
