import * as R from 'ramda';
import {
  createAnnotation,
  createValidationContext,
  getModelData,
  Model,
  model,
  ModelValidationContext,
  updateModel
} from '../src';

type TestModel = {
  a: string;
  b?: string;
  c?: string;
  extra?: string;
};

describe('computed values', () => {
  let validationContext: ModelValidationContext<any> | undefined;

  const testWhen = jest.fn();
  const testValidate = jest.fn();

  const testIncrementalValidate = <T>(
    testModel: Model<T, any>,
    data: Partial<T>
  ) => {
    let previousData: T | undefined = undefined;
    if (!validationContext) {
      validationContext = createValidationContext(testModel);
    } else {
      previousData = getModelData(validationContext!);
    }

    updateModel(validationContext, {
      ...previousData,
      ...data
    });
  };

  beforeEach(() => {
    validationContext = undefined;
  });

  describe('with cascading changes due to computed value changing', () => {
    const testModel = model<TestModel>((root, model) => [
      model.withFields(root, ['a', 'b', 'c'], ({ a, b, c }) => [
        model.value(b, a),
        model.value(c, b),

        model.when({ a, b, c }, testWhen, () => []),
        model.validate(a, { b, c }, testValidate)
      ])
    ]);

    describe('on initial validate', () => {
      beforeEach(() => {
        testIncrementalValidate(testModel, { a: 'initial', extra: 'test' });
      });

      const expectedInitialModelData: TestModel = {
        a: 'initial',
        b: 'initial',
        c: 'initial',
        extra: 'test'
      };

      it('should run when() with correct inputs', () => {
        expect(testWhen).toHaveBeenLastCalledWith(
          R.pick(['a', 'b', 'c'], expectedInitialModelData),
          expectedInitialModelData,
          undefined
        );
      });

      it('should run validate() with correct inputs', () => {
        expect(testValidate).toHaveBeenLastCalledWith(
          expectedInitialModelData.a,
          R.pick(['b', 'c'], expectedInitialModelData),
          expectedInitialModelData,
          undefined
        );
      });

      it('should run when() only after all computed values have been updated', () => {
        expect(testWhen).toHaveBeenCalledTimes(1);
        expect(testWhen).toHaveBeenLastCalledWith(
          R.pick(['a', 'b', 'c'], expectedInitialModelData),
          expectedInitialModelData,
          undefined
        );
      });

      it('should run validate() only after all computed values have been updated', () => {
        expect(testValidate).toHaveBeenCalledTimes(1);
        expect(testValidate).toHaveBeenLastCalledWith(
          expectedInitialModelData.a,
          R.pick(['b', 'c'], expectedInitialModelData),
          expectedInitialModelData,
          undefined
        );
      });

      describe('on next validate', () => {
        beforeEach(() => {
          jest.clearAllMocks();
          testIncrementalValidate(testModel, {
            a: 'changed'
          });
        });

        const expectedUpdatedModelData: TestModel = {
          a: 'changed',
          b: 'changed',
          c: 'changed',
          extra: 'test'
        };

        it('should run when() with correct inputs', () => {
          expect(testWhen).toHaveBeenLastCalledWith(
            R.pick(['a', 'b', 'c'], expectedUpdatedModelData),
            expectedUpdatedModelData,
            undefined
          );
        });

        it('should run validate() with correct inputs', () => {
          expect(testValidate).toHaveBeenLastCalledWith(
            expectedUpdatedModelData.a,
            R.pick(['b', 'c'], expectedUpdatedModelData),
            expectedUpdatedModelData,
            undefined
          );
        });

        it('should run when() only after all computed values have been updated', () => {
          expect(testWhen).toHaveBeenCalledTimes(1);
          expect(testWhen).toHaveBeenLastCalledWith(
            R.pick(['a', 'b', 'c'], expectedUpdatedModelData),
            expectedUpdatedModelData,
            undefined
          );
        });

        it('should run validate() only after all computed values have been updated', () => {
          expect(testValidate).toHaveBeenCalledTimes(1);
          expect(testValidate).toHaveBeenLastCalledWith(
            expectedUpdatedModelData.a,
            R.pick(['b', 'c'], expectedUpdatedModelData),
            expectedUpdatedModelData,
            undefined
          );
        });
      });
    });
  });

  describe('with cascading changes due to condition changing', () => {
    describe('when computed value is inside condition and has static value', () => {
      const testModel = model<TestModel>((root, model) => [
        model.withFields(root, ['a', 'b', 'c'], ({ a, b, c }) => [
          model.value(b, a),
          model.when(
            b,
            (b) => b === 'changed',
            () => [model.value(c, 'changed')]
          ),
          model.validate(a, { b, c }, testValidate)
        ])
      ]);

      describe('on initial validate', () => {
        beforeEach(() => {
          testIncrementalValidate(testModel, { a: 'initial', extra: 'test' });
        });

        const expectedInitialModelData: TestModel = {
          a: 'initial',
          b: 'initial',
          c: undefined,
          extra: 'test'
        };

        it('should run validate() with correct inputs', () => {
          expect(testValidate).toHaveBeenLastCalledWith(
            expectedInitialModelData.a,
            R.pick(['b', 'c'], expectedInitialModelData),
            expectedInitialModelData,
            undefined
          );
        });

        it('should run validate() only after all computed values have been updated', () => {
          expect(testValidate).toHaveBeenCalledTimes(1);
          expect(testValidate).toHaveBeenLastCalledWith(
            expectedInitialModelData.a,
            R.pick(['b', 'c'], expectedInitialModelData),
            expectedInitialModelData,
            undefined
          );
        });

        describe('when condition changes to true due to cascading change', () => {
          beforeEach(() => {
            jest.clearAllMocks();
            testIncrementalValidate(testModel, {
              a: 'changed'
            });
          });

          const expectedUpdatedModelData: TestModel = {
            a: 'changed',
            b: 'changed',
            c: 'changed',
            extra: 'test'
          };

          it('should run validate() with correct inputs', () => {
            expect(testValidate).toHaveBeenLastCalledWith(
              expectedUpdatedModelData.a,
              R.pick(['b', 'c'], expectedUpdatedModelData),
              expectedUpdatedModelData,
              undefined
            );
          });

          it('should run validate() only after all computed values have been updated', () => {
            expect(testValidate).toHaveBeenCalledTimes(1);
            expect(testValidate).toHaveBeenLastCalledWith(
              expectedUpdatedModelData.a,
              R.pick(['b', 'c'], expectedUpdatedModelData),
              expectedUpdatedModelData,
              undefined
            );
          });
        });
      });
    });

    describe('when computed value is inside condition and depends on the same value as the parent condition', () => {
      const testModel = model<TestModel>((root, model) => [
        model.withFields(root, ['a', 'b', 'c'], ({ a, b, c }) => [
          model.value(b, a),
          model.when(
            b,
            (b) => b === 'changed',
            () => [model.value(c, b)]
          ),
          model.validate(a, { b, c }, testValidate)
        ])
      ]);

      describe('when condition changes to true due to cascading change', () => {
        beforeEach(() => {
          testIncrementalValidate(testModel, { a: 'initial', extra: 'test' });
          jest.clearAllMocks();
          testIncrementalValidate(testModel, {
            a: 'changed'
          });
        });

        const expectedUpdatedModelData: TestModel = {
          a: 'changed',
          b: 'changed',
          c: 'changed',
          extra: 'test'
        };

        it('should run validate() with correct inputs', () => {
          expect(testValidate).toHaveBeenLastCalledWith(
            expectedUpdatedModelData.a,
            R.pick(['b', 'c'], expectedUpdatedModelData),
            expectedUpdatedModelData,
            undefined
          );
        });

        it('should run validate() only after all computed values have been updated', () => {
          expect(testValidate).toHaveBeenCalledTimes(1);
          expect(testValidate).toHaveBeenLastCalledWith(
            expectedUpdatedModelData.a,
            R.pick(['b', 'c'], expectedUpdatedModelData),
            expectedUpdatedModelData,
            undefined
          );
        });
      });
    });

    describe('when computed value is inside condition and is removed due to condition changing to false', () => {
      describe('and field has another computed value', () => {
        const testModel = model<TestModel>((root, model) => [
          model.withFields(root, ['a', 'b', 'c'], ({ a, b, c }) => [
            model.value(b, a),
            model.when(
              b,
              (b) => b === 'initial',
              () => [model.value(c, 'active')],
              () => [model.value(c, 'inactive')]
            ),
            model.validate(a, { b, c }, testValidate)
          ])
        ]);

        beforeEach(() => {
          testIncrementalValidate(testModel, { a: 'initial', extra: 'test' });
          jest.clearAllMocks();
          testIncrementalValidate(testModel, {
            a: 'changed'
          });
        });

        const expectedUpdatedModelData: TestModel = {
          a: 'changed',
          b: 'changed',
          c: 'inactive',
          extra: 'test'
        };

        it('should run validate() with correct inputs', () => {
          expect(testValidate).toHaveBeenLastCalledWith(
            expectedUpdatedModelData.a,
            R.pick(['b', 'c'], expectedUpdatedModelData),
            expectedUpdatedModelData,
            undefined
          );
        });

        it('should run validate() only after all computed values have been updated', () => {
          expect(testValidate).toHaveBeenCalledTimes(1);
          expect(testValidate).toHaveBeenLastCalledWith(
            expectedUpdatedModelData.a,
            R.pick(['b', 'c'], expectedUpdatedModelData),
            expectedUpdatedModelData,
            undefined
          );
        });
      });

      describe('and field has no other computed values', () => {
        const testModel = model<TestModel>((root, model) => [
          model.withFields(root, ['a', 'b', 'c'], ({ a, b, c }) => [
            model.value(b, a),
            model.when(
              b,
              (b) => b === 'initial',
              () => [model.value(c, 'active')]
            ),
            model.validate(a, { b, c }, testValidate)
          ])
        ]);

        const expectedUpdatedModelData: TestModel = {
          a: 'changed',
          b: 'changed',
          c: 'active',
          extra: 'test'
        };

        it('should retain the previous value for the computed field', () => {
          testIncrementalValidate(testModel, {
            a: 'initial',
            extra: 'test'
          });

          testIncrementalValidate(testModel, {
            a: 'changed'
          });

          expect(testValidate).toHaveBeenCalledTimes(2);
          expect(testValidate).toHaveBeenLastCalledWith(
            expectedUpdatedModelData.a,
            R.pick(['b', 'c'], expectedUpdatedModelData),
            expectedUpdatedModelData,
            undefined
          );
        });
      });
    });

    describe('when validation is inside condition and uses cascading computed values as dependencies', () => {
      describe('when condition changes to true due to cascading change', () => {
        const testModel = model<TestModel>((root, model) => [
          model.withFields(root, ['a', 'b', 'c'], ({ a, b, c }) => [
            // it's important to have this condition first in the model, to ensure that ordering of the conditions
            // does not affect the way we process the model; we should always process annotations before conditions
            // and validations
            model.when(
              a,
              (a) => a === 'changed',
              () => [
                // ordering of the computed values should not matter, test it here by having them in order: d=c, c=b
                model.validate(a, { b, c }, testValidate) // the validate should atomatically get both changed values
              ]
            ),
            model.when(
              a,
              (a) => a === 'changed',
              () => [
                // important to use a static value here for the computed value; if we used the field a as the value
                // that'd make the first pass of processing changed annotations always run first, but here we want
                // to test the case that what if a computed value is changed due to condition turning truthy
                model.value(b, 'changed')
              ]
            ),
            model.when(
              b,
              (b) => b === 'changed',
              () => [
                // use also static value here to make sure cascading multiple times works correctly
                model.value(c, 'changed')
              ]
            )
          ])
        ]);

        const expectedUpdatedModelData: TestModel = {
          a: 'changed',
          b: 'changed',
          c: 'changed',
          extra: 'test'
        };

        describe('on initial update', () => {
          beforeEach(() => {
            testIncrementalValidate(testModel, { a: 'changed', extra: 'test' });
          });

          it('should run validate() with correct inputs', () => {
            expect(testValidate).toHaveBeenLastCalledWith(
              expectedUpdatedModelData.a,
              R.pick(['b', 'c'], expectedUpdatedModelData),
              expectedUpdatedModelData,
              undefined
            );
          });

          it('should run validate() only after all computed values have been updated', () => {
            expect(testValidate).toHaveBeenCalledTimes(1);
            expect(testValidate).toHaveBeenLastCalledWith(
              expectedUpdatedModelData.a,
              R.pick(['b', 'c'], expectedUpdatedModelData),
              expectedUpdatedModelData,
              undefined
            );
          });
        });

        describe('on incremental update', () => {
          beforeEach(() => {
            testIncrementalValidate(testModel, { a: 'initial', extra: 'test' });
            jest.clearAllMocks();
            testIncrementalValidate(testModel, {
              a: 'changed'
            });
          });

          it('should run validate() with correct inputs', () => {
            expect(testValidate).toHaveBeenLastCalledWith(
              expectedUpdatedModelData.a,
              R.pick(['b', 'c'], expectedUpdatedModelData),
              expectedUpdatedModelData,
              undefined
            );
          });

          it('should run validate() only after all computed values have been updated', () => {
            expect(testValidate).toHaveBeenCalledTimes(1);
            expect(testValidate).toHaveBeenLastCalledWith(
              expectedUpdatedModelData.a,
              R.pick(['b', 'c'], expectedUpdatedModelData),
              expectedUpdatedModelData,
              undefined
            );
          });
        });
      });
    });
  });

  describe('with cascading changes due to annotation changing', () => {
    const testAnnotation = createAnnotation<string>('test');
    const testModel = model<TestModel>((root, model) => [
      model.withFields(root, ['a', 'b', 'c'], ({ a, b, c }) => [
        model.annotate(b, testAnnotation, a),
        model.value(c, model.annotation(b, testAnnotation)),
        model.validate(c, testValidate)
      ])
    ]);

    describe('on initial validate', () => {
      beforeEach(() => {
        testIncrementalValidate(testModel, { a: 'initial' });
      });

      const expectedInitialModelData: TestModel = {
        a: 'initial',
        c: 'initial'
      };

      it('should run validate() with correct inputs only after all computed values have been updated', () => {
        expect(testValidate).toHaveBeenCalledTimes(1);
        expect(testValidate).toHaveBeenLastCalledWith(
          expectedInitialModelData.c,
          expectedInitialModelData,
          undefined
        );
      });

      describe('on next validate', () => {
        beforeEach(() => {
          jest.clearAllMocks();
          testIncrementalValidate(testModel, {
            a: 'changed'
          });
        });

        const expectedUpdatedModelData: TestModel = {
          a: 'changed',
          c: 'changed'
        };

        it('should run validate() with correct inputs only after all computed values have been updated', () => {
          expect(testValidate).toHaveBeenCalledTimes(1);
          expect(testValidate).toHaveBeenLastCalledWith(
            expectedUpdatedModelData.c,
            expectedUpdatedModelData,
            undefined
          );
        });
      });
    });
  });

  describe('computed values inside array items', () => {
    type TestModel = {
      list: { value: string; computed?: string }[];
    };

    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'list', (list) => [
        model.array(list, (item) => [
          model.withFields(
            item,
            ['value', 'computed'],
            ({ value, computed }) => [model.value(computed, value)]
          )
        ])
      ])
    ]);

    it('should return annotations for initial items', () => {
      testIncrementalValidate(testModel, {
        list: [{ value: 'a' }, { value: 'b' }]
      });

      expect(getModelData(validationContext!)).toEqual({
        list: [
          { value: 'a', computed: 'a' },
          { value: 'b', computed: 'b' }
        ]
      });
    });

    it('should return annotations for new items', () => {
      testIncrementalValidate(testModel, {
        list: [{ value: 'a' }]
      });

      const initialData = getModelData(validationContext!);
      testIncrementalValidate(testModel, {
        list: [...initialData.list, { value: 'b' }, { value: 'c' }]
      });

      expect(getModelData(validationContext!)).toEqual({
        list: [
          { value: 'a', computed: 'a' },
          { value: 'b', computed: 'b' },
          { value: 'c', computed: 'c' }
        ]
      });
    });

    it('should remove annotations for deleted items', () => {
      testIncrementalValidate(testModel, {
        list: [{ value: 'a' }, { value: 'b' }, { value: 'c' }]
      });

      const initialData = getModelData(validationContext!);
      testIncrementalValidate(testModel, {
        list: [initialData.list[0]]
      });

      expect(getModelData(validationContext!)).toEqual({
        list: [{ value: 'a', computed: 'a' }]
      });
    });
  });

  describe('with cascading changes inside array due to condition changing', () => {
    type TestModel = {
      list: Array<{
        value: string;
        computedA?: string;
        computedB?: string;
      }>;
    };

    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'list', (list) => [
        model.array(list, (item) => [
          model.withFields(
            item,
            ['value', 'computedA', 'computedB'],
            ({ value, computedA, computedB }) => [
              model.when(
                value,
                (value) => value === 'a',
                () => [model.value(computedA, 'b')]
              ),
              model.when(
                computedA,
                (computedA) => computedA === 'b',
                () => [model.value(computedB, 'c')]
              )
            ]
          )
        ])
      ])
    ]);

    it('should return annotations for initial items', () => {
      testIncrementalValidate(testModel, {
        list: [{ value: 'a' }, { value: 'a' }]
      });

      expect(getModelData(validationContext!)).toEqual({
        list: [
          { value: 'a', computedA: 'b', computedB: 'c' },
          { value: 'a', computedA: 'b', computedB: 'c' }
        ]
      });
    });

    it('should return annotations for new items', () => {
      testIncrementalValidate(testModel, {
        list: [{ value: 'a' }]
      });

      const initialData = getModelData(validationContext!);
      testIncrementalValidate(testModel, {
        list: [...initialData.list, { value: 'a' }]
      });

      expect(getModelData(validationContext!)).toEqual({
        list: [
          { value: 'a', computedA: 'b', computedB: 'c' },
          { value: 'a', computedA: 'b', computedB: 'c' }
        ]
      });
    });

    it('should remove annotations for deleted items', () => {
      testIncrementalValidate(testModel, {
        list: [{ value: 'a' }, { value: 'a' }]
      });

      const initialData = getModelData(validationContext!);
      testIncrementalValidate(testModel, {
        list: [initialData.list[0]]
      });

      expect(getModelData(validationContext!)).toEqual({
        list: [{ value: 'a', computedA: 'b', computedB: 'c' }]
      });
    });
  });

  describe('computed value changing from outside', () => {
    type TestModel = {
      value: string;
      cond: boolean;
      computed?: string;
    };

    const testModel = model<TestModel>((root, model) => [
      model.withFields(
        root,
        ['value', 'cond', 'computed'],
        ({ value, cond, computed }) => [
          model.when(
            cond,
            (cond) => cond,
            () => [
              model.value(
                computed,
                model.compute(value, (value) => value.toUpperCase())
              )
            ]
          )
        ]
      )
    ]);

    it('should return the correct computed value if the value changes from outside', () => {
      testIncrementalValidate(testModel, {
        value: 'computed',
        cond: true
      });

      testIncrementalValidate(testModel, {
        computed: 'changed from outside' // should be ignored
      });

      expect(getModelData(validationContext!)).toEqual({
        value: 'computed',
        cond: true,
        computed: 'COMPUTED'
      });
    });

    it('should return the value from outside if the computed value turns inactive in same update', () => {
      testIncrementalValidate(testModel, {
        value: 'computed',
        cond: true
      });

      testIncrementalValidate(testModel, {
        cond: false,
        computed: 'changed from outside' // should be retained
      });

      expect(getModelData(validationContext!)).toEqual({
        value: 'computed',
        cond: false,
        computed: 'changed from outside'
      });
    });

    it('should return the correct computed value if computed value changes active in same update', () => {
      testIncrementalValidate(testModel, {
        value: 'computed',
        cond: false
      });

      testIncrementalValidate(testModel, {
        cond: true,
        computed: 'changed from outside' // should be ignored
      });

      expect(getModelData(validationContext!)).toEqual({
        value: 'computed',
        cond: true,
        computed: 'COMPUTED'
      });
    });
  });

  describe('with infinite cascading changes', () => {
    it('should detect a cyclical dependency with computed values', () => {
      const testModel = model<TestModel>((root, model) => [
        model.withFields(root, ['a', 'b'], ({ a, b }) => [
          model.value(
            b,
            model.compute(a, (a) => a + 'x')
          ),
          model.value(a, b)
        ])
      ]);

      expect(() =>
        testIncrementalValidate(testModel, { a: 'initial' })
      ).toThrow(
        'Too many cascading changes in model, this probably means you have cyclical computed data in your model'
      );
    });

    it('should detect a cyclical dependency with conditions', () => {
      const testModel = model<TestModel>((root, model) => [
        model.withFields(root, ['a'], ({ a }) => [
          model.when(
            a,
            (a) => a === 'true',
            () => [model.value(a, 'false')],
            () => [model.value(a, 'true')]
          )
        ])
      ]);

      expect(() =>
        testIncrementalValidate(testModel, { a: 'true', extra: 'test' })
      ).toThrow(
        'Too many cascading changes in model, this probably means you have cyclical computed data in your model'
      );
    });
  });

  describe('with computed value refering to itself', () => {
    it('should update value correctly', () => {
      type TestModel = {
        value: string;
      };

      const testModel = model<TestModel>((root, model) => [
        model.withFields(root, ['value'], ({ value }) => [
          model.value(
            value,
            model.compute(value, (value) => value.toUpperCase())
          )
        ])
      ]);

      testIncrementalValidate(testModel, { value: 'initial' });
      expect(getModelData(validationContext!)).toEqual({
        value: 'INITIAL'
      });

      testIncrementalValidate(testModel, {
        value: 'changed'
      });
      expect(getModelData(validationContext!)).toEqual({
        value: 'CHANGED'
      });
    });

    it('should work with objects', () => {
      type TestModel = {
        obj: { value: string };
      };

      const testModel = model<TestModel>((root, model) => [
        model.withFields(root, ['obj'], ({ obj }) => [
          model.value(
            obj,
            model.compute(obj, (obj) => ({ value: obj.value.toUpperCase() }))
          )
        ])
      ]);

      testIncrementalValidate(testModel, { obj: { value: 'initial' } });
      expect(getModelData(validationContext!)).toEqual({
        obj: { value: 'INITIAL' }
      });

      testIncrementalValidate(testModel, {
        obj: { value: 'changed' }
      });
      expect(getModelData(validationContext!)).toEqual({
        obj: { value: 'CHANGED' }
      });
    });

    // ensures that we don't rewrite the object if the computed value does not change
    it('should work when depending from root of the model', () => {
      type TestModel = {
        obj: { value: string };
      };

      const testModel = model<TestModel>((root, model) => [
        model.withFields(root, ['obj'], ({ obj }) => [
          model.value(
            obj,
            model.compute({ obj, root: model.root }, ({ obj }) => ({
              value: obj.value.toUpperCase()
            }))
          )
        ])
      ]);

      testIncrementalValidate(testModel, { obj: { value: 'initial' } });
      expect(getModelData(validationContext!)).toEqual({
        obj: { value: 'INITIAL' }
      });

      testIncrementalValidate(testModel, {
        obj: { value: 'changed' }
      });
      expect(getModelData(validationContext!)).toEqual({
        obj: { value: 'CHANGED' }
      });
    });

    it('should detect a cyclical dependency', () => {
      type TestModel = {
        value: string;
      };

      const testModel = model<TestModel>((root, model) => [
        model.withFields(root, ['value'], ({ value }) => [
          model.value(
            value,
            model.compute(value, (value) => value + 'a')
          )
        ])
      ]);

      expect(() =>
        testIncrementalValidate(testModel, { value: 'initial' })
      ).toThrow(
        'Too many cascading changes in model, this probably means you have cyclical computed data in your model'
      );
    });
  });

  describe('with undefined values', () => {
    it('should create object with nested undefined computed value', () => {
      type TestModel = {
        nested?: {
          obj?: {
            value?: string;
          };
        };
      };

      const testModel = model<TestModel>((root, model) => [
        model.withFields(root, ['nested'], ({ nested }) => [
          model.field(nested, 'obj', (obj) => [
            model.field(obj, 'value', (value) => [
              model.value(value, undefined)
            ])
          ])
        ])
      ]);

      testIncrementalValidate(testModel, {});
      expect(getModelData(validationContext!)).toStrictEqual({
        nested: { obj: { value: undefined } }
      });
    });

    it('should create object when condition changes to true that enables undefined computed value', () => {
      type TestModel = {
        enabled: boolean;
        nested?: {
          obj?: {
            value?: string;
          };
        };
      };

      const testModel = model<TestModel>((root, model) => [
        model.withFields(root, ['enabled', 'nested'], ({ enabled, nested }) => [
          model.field(nested, 'obj', (obj) => [
            model.field(obj, 'value', (value) => [
              model.when(
                enabled,
                (enabled) => enabled,
                () => [model.value(value, undefined)]
              )
            ])
          ])
        ])
      ]);

      testIncrementalValidate(testModel, { enabled: false });
      expect(getModelData(validationContext!)).toStrictEqual({
        enabled: false
      });

      testIncrementalValidate(testModel, {
        enabled: true
      });
      expect(getModelData(validationContext!)).toStrictEqual({
        enabled: true,
        nested: { obj: { value: undefined } }
      });
    });

    it('should reset to first undefined computed value if there are multipe nested values and activity changes', () => {
      type TestModel = {
        enabled: boolean;
        nested?: {
          obj?: {
            value?: string;
          };
        };
      };

      const testModel = model<TestModel>((root, model) => [
        model.withFields(root, ['enabled', 'nested'], ({ enabled, nested }) => [
          model.field(nested, 'obj', (obj) => [
            model.field(obj, 'value', (value) => [
              model.value(value, undefined),
              model.when(
                enabled,
                (enabled) => enabled,
                () => [model.value(value, 'enabled')]
              )
            ])
          ])
        ])
      ]);

      testIncrementalValidate(testModel, { enabled: false });
      expect(getModelData(validationContext!)).toStrictEqual({
        enabled: false,
        nested: { obj: { value: undefined } }
      });

      testIncrementalValidate(testModel, {
        enabled: true,
        nested: { obj: { value: undefined } }
      });
      expect(getModelData(validationContext!)).toStrictEqual({
        enabled: true,
        nested: { obj: { value: 'enabled' } }
      });

      testIncrementalValidate(testModel, {
        enabled: false,
        nested: { obj: { value: 'enabled' } }
      });
      expect(getModelData(validationContext!)).toStrictEqual({
        enabled: false,
        nested: { obj: { value: undefined } }
      });
    });
  });

  describe('when multiple computed values depend on same input', () => {
    it('should not pass stale date to computed values', () => {
      const testModel = model<TestModel>((root, builder) => [
        builder.withFields(root, ['a'], ({ a }) => [
          builder.value(
            a,
            builder.compute(a, (a) => a.toUpperCase())
          ),
          // make sure the passive dependency has the same data as the active dependency
          builder.sideEffect(root, a, (data, a) => {
            expect(data.a).toEqual(a);
            return { ...data, b: a };
          })
        ])
      ]);

      testIncrementalValidate(testModel, { a: 'test' });
      expect(getModelData(validationContext!)).toEqual({
        a: 'TEST',
        b: 'TEST'
      });
    });
  });
});
