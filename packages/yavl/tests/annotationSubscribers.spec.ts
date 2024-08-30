import {
  createAnnotation,
  createValidationContext,
  ModelValidationContext,
  model,
  subscribeToFieldAnnotation,
  Annotation,
  validateModel
} from '../src';
import {
  NoValue,
  noValue,
  SubscribeToFieldAnnotationFn,
  UnsubscribeFn
} from '../src/types';
import * as R from 'ramda';

type TestModel = {
  field1: {
    firstConditionForA: boolean;
    lastConditionForA: boolean;
    conditionForB: boolean;
  };
  field2: {
    condition: boolean;
  };
  fieldWithOnlyConditionalAnnotation: {
    condition: boolean;
  };
  arrayWithCondition: {
    condition: boolean;
    array: Array<{ value: string }>;
  };
};

type TestSubscription<Value> = {
  currentValue: Value | undefined;
  subscriber: jest.MockedFunction<SubscribeToFieldAnnotationFn<Value, Value>>;
  unsubscribe: UnsubscribeFn;
};

type TestSubscriptions = {
  field1AnnotationA: TestSubscription<string>;
  field1AnnotationB: TestSubscription<string>;
  field2AnnotationA: TestSubscription<string>;
};

const testAnnotationA = createAnnotation<string>('A');
const testAnnotationB = createAnnotation<string>('B');

const testModel = model<TestModel>((root, model) => [
  model.withFields(
    root,
    [
      'field1',
      'field2',
      'fieldWithOnlyConditionalAnnotation',
      'arrayWithCondition'
    ],
    ({
      field1,
      field2,
      fieldWithOnlyConditionalAnnotation,
      arrayWithCondition
    }) => [
      model.withFields(
        field1,
        ['firstConditionForA', 'lastConditionForA', 'conditionForB'],
        ({ firstConditionForA, lastConditionForA, conditionForB }) => [
          model.when(firstConditionForA, R.identity, () => [
            // this annotation should never be reported, because the "outside condition" always has priority over it
            model.annotate(field1, testAnnotationA, 'inside first condition')
          ]),
          model.annotate(field1, testAnnotationA, 'outside condition'),
          model.when(lastConditionForA, R.identity, () => [
            model.annotate(field1, testAnnotationA, 'inside last condition')
          ]),

          model.when(
            conditionForB,
            R.identity,
            () => [model.annotate(field1, testAnnotationB, 'true branch')],
            () => [model.annotate(field1, testAnnotationB, 'false branch')]
          )
        ]
      ),
      model.field(field2, 'condition', (condition) => [
        model.when(
          condition,
          R.identity,
          () => [model.annotate(field2, testAnnotationA, 'true branch')],
          () => [model.annotate(field2, testAnnotationA, 'false branch')]
        )
      ]),
      model.field(
        fieldWithOnlyConditionalAnnotation,
        'condition',
        (condition) => [
          model.when(condition, R.identity, () => [
            model.annotate(
              fieldWithOnlyConditionalAnnotation,
              testAnnotationA,
              'true branch'
            )
          ])
        ]
      ),
      model.withFields(
        arrayWithCondition,
        ['condition', 'array'],
        ({ condition, array }) => [
          model.when(condition, R.identity, () => [
            model.array(array, (item) => [
              model.field(item, 'value', (value) => [
                // simulates some other nested condition
                model.when(
                  {},
                  () => true,
                  () => [model.annotate(value, testAnnotationA, 'true branch')]
                )
              ])
            ])
          ])
        ]
      )
    ]
  )
]);

describe('annotation subscribers', () => {
  let validationContext: ModelValidationContext<TestModel, undefined, any>;

  const subscribeToAnnotation = <T>(
    field: string,
    annotation: Annotation<T>,
    defaultValue: T | NoValue = noValue
  ): TestSubscription<T> => {
    const subscription: { currentValue: T | undefined } = {
      currentValue: undefined
    };

    const subscriber = jest.fn((value: T) => {
      subscription.currentValue = value;
    });

    const unsubscribe = subscribeToFieldAnnotation(
      validationContext,
      field,
      annotation,
      subscriber,
      defaultValue as T
    );

    // mutate the subscription object we created so the subscriber modifies the correct object
    return Object.assign(subscription, { subscriber, unsubscribe });
  };

  const initialData: TestModel = {
    field1: {
      firstConditionForA: false,
      lastConditionForA: false,
      conditionForB: false
    },
    field2: {
      condition: false
    },
    fieldWithOnlyConditionalAnnotation: {
      condition: false
    },
    arrayWithCondition: {
      condition: false,
      array: [
        {
          value: 'test'
        }
      ]
    }
  };

  beforeEach(() => {
    validationContext = createValidationContext(testModel);

    validateModel(validationContext, initialData);
  });

  describe('subscribing to field annotations', () => {
    let subscribers: TestSubscriptions;

    beforeEach(() => {
      subscribers = {
        field1AnnotationA: subscribeToAnnotation('field1', testAnnotationA),
        field1AnnotationB: subscribeToAnnotation('field1', testAnnotationB),
        field2AnnotationA: subscribeToAnnotation('field2', testAnnotationA)
      };
    });

    it('should instantly notify the current value', () => {
      expect(subscribers.field1AnnotationB.subscriber).toHaveBeenCalledTimes(1);
      expect(subscribers.field1AnnotationA.currentValue).toEqual(
        'outside condition'
      );

      expect(subscribers.field1AnnotationB.subscriber).toHaveBeenCalledTimes(1);
      expect(subscribers.field1AnnotationB.currentValue).toEqual(
        'false branch'
      );

      expect(subscribers.field2AnnotationA.subscriber).toHaveBeenCalledTimes(1);
      expect(subscribers.field2AnnotationA.currentValue).toEqual(
        'false branch'
      );
    });

    describe('when single annotation value changes', () => {
      beforeEach(() => {
        // clear mocks so assertions are easier to understand
        subscribers.field1AnnotationA.subscriber.mockClear();
        subscribers.field1AnnotationB.subscriber.mockClear();
        subscribers.field2AnnotationA.subscriber.mockClear();
      });

      describe('when the changed annotation has priority', () => {
        beforeEach(() => {
          validateModel(
            validationContext,
            R.assocPath(['field1', 'conditionForB'], true, initialData)
          );
        });

        it('should notify the subscriber with updated value', () => {
          expect(
            subscribers.field1AnnotationB.subscriber
          ).toHaveBeenCalledTimes(1);
          expect(subscribers.field1AnnotationB.currentValue).toBe(
            'true branch'
          );
        });

        it('should not notify other subscribers', () => {
          expect(
            subscribers.field1AnnotationA.subscriber
          ).not.toHaveBeenCalled();
          expect(
            subscribers.field2AnnotationA.subscriber
          ).not.toHaveBeenCalled();
        });
      });

      describe('when the changed annotation does not have priority', () => {
        beforeEach(() => {
          // clear current mock calls so we can assert the subscriber does not get called
          subscribers.field1AnnotationA.subscriber.mockClear();

          validateModel(
            validationContext,
            R.assocPath(['field1', 'firstConditionForA'], true, initialData)
          );
        });

        it('should not notify the subscriber with updated value', () => {
          expect(
            subscribers.field1AnnotationA.subscriber
          ).not.toHaveBeenCalled();
        });
      });
    });

    describe('when multiple annotations for same field change at the same time', () => {
      beforeEach(() => {
        // clear mocks so assertions are easier to understand
        subscribers.field1AnnotationA.subscriber.mockClear();
        subscribers.field1AnnotationB.subscriber.mockClear();
        subscribers.field2AnnotationA.subscriber.mockClear();

        validateModel(validationContext, {
          ...initialData,
          field1: {
            ...initialData.field1,
            lastConditionForA: true,
            conditionForB: true
          }
        });
      });

      it('should notify both subscriber with updated values', () => {
        expect(subscribers.field1AnnotationA.currentValue).toBe(
          'inside last condition'
        );
        expect(subscribers.field1AnnotationB.currentValue).toBe('true branch');
      });

      it('should not notify unrelated subscribers', () => {
        expect(subscribers.field2AnnotationA.subscriber).not.toHaveBeenCalled();
      });
    });

    describe('when annotations for multiple fields change at the same time', () => {
      beforeEach(() => {
        // clear mocks so assertions are easier to understand
        subscribers.field1AnnotationA.subscriber.mockClear();
        subscribers.field1AnnotationB.subscriber.mockClear();
        subscribers.field2AnnotationA.subscriber.mockClear();

        validateModel(validationContext, {
          ...initialData,
          field1: {
            ...initialData.field1,
            conditionForB: true
          },
          field2: {
            ...initialData.field2,
            condition: true
          }
        });
      });

      it('should notify both subscriber with updated values', () => {
        expect(subscribers.field1AnnotationB.currentValue).toBe('true branch');
        expect(subscribers.field2AnnotationA.currentValue).toBe('true branch');
      });

      it('should not notify unrelated subscribers', () => {
        expect(subscribers.field1AnnotationA.subscriber).not.toHaveBeenCalled();
      });
    });

    describe('when annotation is only set for field when a condition is true', () => {
      // this is the situation in initialData
      describe('and when condition is initially false', () => {
        it('should notify subscriber with the default value if one is defined', () => {
          const subscriber = subscribeToAnnotation(
            'fieldWithOnlyConditionalAnnotation',
            testAnnotationA,
            'default'
          );

          expect(subscriber.currentValue).toEqual('default');
        });

        it('should throw an error if no default value is defined', () => {
          expect(() =>
            subscribeToAnnotation(
              'fieldWithOnlyConditionalAnnotation',
              testAnnotationA
            )
          ).toThrowErrorMatchingInlineSnapshot(
            `"Annotation "A" not found for fieldWithOnlyConditionalAnnotation"`
          );
        });
      });

      describe('when condition is initially true and changes to false', () => {
        beforeEach(() => {
          // first change the condition to true
          validateModel(validationContext, {
            ...initialData,
            fieldWithOnlyConditionalAnnotation: { condition: true },
            arrayWithCondition: {
              ...initialData.arrayWithCondition,
              condition: true
            }
          });
        });

        it('should notify default value if one is defined', () => {
          // add subscriber
          const subscriber = subscribeToAnnotation(
            'fieldWithOnlyConditionalAnnotation',
            testAnnotationA,
            'default'
          );

          expect(subscriber.currentValue).toEqual('true branch');

          // change condition to false, after which field has no annotation at all
          validateModel(validationContext, {
            ...initialData,
            fieldWithOnlyConditionalAnnotation: { condition: false }
          });

          expect(subscriber.currentValue).toEqual('default');
        });

        it('should throw an error if no default value is defined', () => {
          // add subscriber
          const subscriber = subscribeToAnnotation(
            'fieldWithOnlyConditionalAnnotation',
            testAnnotationA
          );

          expect(subscriber.currentValue).toEqual('true branch');

          // when there is no default value and the annotation is removed, an error should be thrown
          expect(() =>
            validateModel(validationContext, {
              ...initialData,
              fieldWithOnlyConditionalAnnotation: { condition: false }
            })
          ).toThrowErrorMatchingInlineSnapshot(
            `"Annotation "A" was removed due to a change in parent condition, and no default value was provided for subscriber"`
          );
        });

        it('should work for arrays and nested conditions', () => {
          // add subscriber
          const subscriber = subscribeToAnnotation(
            'arrayWithCondition.array[0].value',
            testAnnotationA,
            'default'
          );

          expect(subscriber.currentValue).toEqual('true branch');

          // change condition to false, after which field has no annotation at all
          validateModel(
            validationContext,
            R.assocPath(['arrayWithCondition', 'condition'], false, initialData)
          );

          expect(subscriber.currentValue).toEqual('default');
        });
      });
    });

    describe('when subscribing to value inside array and array item is removed', () => {
      beforeEach(() => {
        // first change the array condition to true
        validateModel(validationContext, {
          ...initialData,
          arrayWithCondition: {
            condition: true,
            array: [{ value: 'a' }, { value: 'b' }]
          }
        });
      });

      it('should not throw an error even if default value is missing', () => {
        // add subscriber
        const subscriber = subscribeToAnnotation(
          'arrayWithCondition.array[1].value',
          testAnnotationA
        );

        expect(() =>
          validateModel(validationContext, {
            ...initialData,
            arrayWithCondition: {
              condition: true,
              array: [{ value: 'a' }]
            }
          })
        ).not.toThrow();

        expect(subscriber.currentValue).toEqual('true branch');
      });
    });

    describe('when unsubscribing', () => {
      beforeEach(() => {
        subscribers.field1AnnotationB.unsubscribe();

        subscribers.field1AnnotationA.subscriber.mockClear();
        subscribers.field1AnnotationB.subscriber.mockClear();
        subscribers.field2AnnotationA.subscriber.mockClear();

        validateModel(validationContext, {
          ...initialData,
          field1: {
            ...initialData.field1,
            lastConditionForA: true,
            conditionForB: true
          },
          field2: {
            ...initialData.field2,
            condition: true
          }
        });
      });

      it('should no longer notify of annotation changes', () => {
        expect(subscribers.field1AnnotationB.subscriber).not.toHaveBeenCalled();
        expect(subscribers.field1AnnotationB.currentValue).toBe('false branch');
      });

      it('should still notify other subscribers', () => {
        expect(subscribers.field1AnnotationA.subscriber).toHaveBeenCalledTimes(
          1
        );
        expect(subscribers.field1AnnotationA.currentValue).toBe(
          'inside last condition'
        );

        expect(subscribers.field2AnnotationA.subscriber).toHaveBeenCalledTimes(
          1
        );
        expect(subscribers.field2AnnotationA.currentValue).toBe('true branch');
      });
    });
  });
});
