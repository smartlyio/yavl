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
  value?: string;
  computed?: string;
  list?: string[];
  complexList?: { value: string }[];
};

const testAnnotation = createAnnotation<string | undefined>('test');

describe('annotation dependencies', () => {
  let validationContext: ModelValidationContext<TestModel> | undefined;

  const testWhen = jest.fn();
  const testValidate = jest.fn();

  const testIncrementalValidate = (
    testModel: Model<TestModel>,
    data: TestModel
  ) => {
    if (!validationContext) {
      validationContext = createValidationContext(testModel);
    }

    updateModel(validationContext, data);
  };

  beforeEach(() => {
    validationContext = undefined;
  });

  describe('annotation as dependency for condition and validation', () => {
    describe('with annotate definition before conditions and validations', () => {
      const testModel = model<TestModel>((root, model) => [
        model.withFields(root, ['value'], ({ value }) => [
          model.annotate(
            value,
            testAnnotation,
            model.compute(value, (it) => it?.toUpperCase())
          ),
          model.when(
            model.annotation(value, testAnnotation),
            testWhen,
            () => []
          ),
          model.validate(
            value,
            model.annotation(value, testAnnotation),
            testValidate,
            () => []
          )
        ])
      ]);

      it('should resolve dependencies correctly for initial update', () => {
        const data = { value: 'test' };
        testIncrementalValidate(testModel, data);

        expect(testWhen).toHaveBeenCalledTimes(1);
        expect(testWhen).toHaveBeenCalledWith('TEST', data, undefined);
        expect(testValidate).toHaveBeenCalledTimes(1);
        expect(testValidate).toHaveBeenCalledWith(
          'test',
          'TEST',
          data,
          undefined
        );
      });

      it('should resolve dependencies correctly for incremental update', () => {
        const data = { value: 'test' };
        testIncrementalValidate(testModel, { value: 'initial' });
        testIncrementalValidate(testModel, data);

        expect(testWhen).toHaveBeenCalledTimes(2);
        expect(testWhen).toHaveBeenLastCalledWith('TEST', data, undefined);
        expect(testValidate).toHaveBeenCalledTimes(2);
        expect(testValidate).toHaveBeenLastCalledWith(
          'test',
          'TEST',
          data,
          undefined
        );
      });
    });

    describe('with annotate definition after conditions and validations', () => {
      const testModel = model<TestModel>((root, model) => [
        model.withFields(root, ['value'], ({ value }) => [
          model.when(
            model.annotation(value, testAnnotation),
            testWhen,
            () => []
          ),
          model.validate(
            value,
            model.annotation(value, testAnnotation),
            testValidate,
            () => []
          ),
          model.annotate(
            value,
            testAnnotation,
            model.compute(value, (it) => it?.toUpperCase())
          )
        ])
      ]);

      it('should resolve dependencies correctly for initial update', () => {
        const data = { value: 'test' };
        testIncrementalValidate(testModel, data);

        expect(testWhen).toHaveBeenCalledTimes(1);
        expect(testWhen).toHaveBeenCalledWith('TEST', data, undefined);
        expect(testValidate).toHaveBeenCalledTimes(1);
        expect(testValidate).toHaveBeenCalledWith(
          'test',
          'TEST',
          data,
          undefined
        );
      });

      it('should resolve dependencies correctly for incremental update', () => {
        const data = { value: 'test' };
        testIncrementalValidate(testModel, { value: 'initial' });
        testIncrementalValidate(testModel, data);

        expect(testWhen).toHaveBeenCalledTimes(2);
        expect(testWhen).toHaveBeenLastCalledWith('TEST', data, undefined);
        expect(testValidate).toHaveBeenCalledTimes(2);
        expect(testValidate).toHaveBeenLastCalledWith(
          'test',
          'TEST',
          data,
          undefined
        );
      });
    });
  });

  describe('annotation as dependency for computed value', () => {
    describe('with annotate definition that is depended on being first', () => {
      const testModel = model<TestModel>((root, model) => [
        model.withFields(root, ['value', 'computed'], ({ value, computed }) => [
          model.annotate(
            value,
            testAnnotation,
            model.compute(value, (it) => it?.toUpperCase())
          ),
          model.value(computed, model.annotation(value, testAnnotation))
        ])
      ]);

      it('should resolve dependencies correctly for initial update', () => {
        const data = { value: 'test' };
        testIncrementalValidate(testModel, data);

        expect(getModelData(validationContext!)).toEqual({
          value: 'test',
          computed: 'TEST'
        });
      });

      it('should resolve dependencies correctly for incremental update', () => {
        const data = { value: 'test' };
        testIncrementalValidate(testModel, { value: 'initial' });
        testIncrementalValidate(testModel, data);

        expect(getModelData(validationContext!)).toEqual({
          value: 'test',
          computed: 'TEST'
        });
      });
    });

    describe('with annotate definition that is depended on being last', () => {
      const testModel = model<TestModel>((root, model) => [
        model.withFields(root, ['value', 'computed'], ({ value, computed }) => [
          model.value(computed, model.annotation(value, testAnnotation)),
          model.annotate(
            value,
            testAnnotation,
            model.compute(value, (it) => it?.toUpperCase())
          )
        ])
      ]);

      it('should resolve dependencies correctly for initial update', () => {
        const data = { value: 'test' };
        testIncrementalValidate(testModel, data);

        expect(getModelData(validationContext!)).toEqual({
          value: 'test',
          computed: 'TEST'
        });
      });

      it('should resolve dependencies correctly for incremental update', () => {
        const data = { value: 'test' };
        testIncrementalValidate(testModel, { value: 'initial' });
        testIncrementalValidate(testModel, data);

        expect(getModelData(validationContext!)).toEqual({
          value: 'test',
          computed: 'TEST'
        });
      });
    });
  });

  describe('annotation as dependency inside an array', () => {
    const testModel = model<TestModel>((root, model) => [
      model.withFields(root, ['list'], ({ list }) => [
        model.array(list, (item) => [
          model.annotate(item, testAnnotation, 'test'),
          model.validate(
            item,
            model.annotation(item, testAnnotation),
            testValidate
          )
        ])
      ])
    ]);

    it('should not evaluate the annotation when array item is removed', () => {
      const initialData: TestModel = {
        list: ['a', 'b']
      };
      testIncrementalValidate(testModel, initialData);

      expect(testValidate).toHaveBeenCalledTimes(2);
      expect(testValidate).toHaveBeenNthCalledWith(
        1,
        'a',
        'test',
        initialData,
        undefined
      );

      expect(testValidate).toHaveBeenNthCalledWith(
        2,
        'b',
        'test',
        initialData,
        undefined
      );

      const updatedData: TestModel = {
        ...initialData,
        list: [initialData.list![0]]
      };
      testIncrementalValidate(testModel, updatedData);

      // should not call the validate function again because first item has not changed
      // and we should not call the validate function for the removed item
      expect(testValidate).toHaveBeenCalledTimes(2);
    });
  });

  describe('direct array of annotations as dependency', () => {
    const testModel = model<TestModel>((root, model) => [
      model.withFields(root, ['list', 'computed'], ({ list, computed }) => {
        const annotationDependencies = model.annotation(
          model.dependency(list, model.array.all),
          testAnnotation
        );

        return [
          model.array(list, (item) => [
            model.annotate(
              item,
              testAnnotation,
              model.compute(item, (it) => it?.toUpperCase())
            )
          ]),

          model.when(annotationDependencies, testWhen, () => []),
          model.value(
            computed,
            model.compute(annotationDependencies, (arr) => arr.join(','))
          )
        ];
      })
    ]);

    const inputData: TestModel = { list: ['a', 'b', 'c'] };
    const expectedData: TestModel = { ...inputData, computed: 'A,B,C' };

    it('should resolve dependencies correctly for initial update', () => {
      testIncrementalValidate(testModel, inputData);

      expect(testWhen).toHaveBeenCalledTimes(1);
      expect(testWhen).toHaveBeenCalledWith(
        ['A', 'B', 'C'],
        expectedData,
        undefined
      );
      expect(getModelData(validationContext!)).toEqual(expectedData);
    });

    it('should resolve dependencies correctly for incremental update', () => {
      testIncrementalValidate(testModel, { list: [] });
      testIncrementalValidate(testModel, inputData);

      expect(testWhen).toHaveBeenCalledTimes(2);
      expect(testWhen).toHaveBeenLastCalledWith(
        ['A', 'B', 'C'],
        expectedData,
        undefined
      );
      expect(getModelData(validationContext!)).toEqual(expectedData);
    });

    it('should work with undefined optional arrays', () => {
      testIncrementalValidate(testModel, {});

      expect(testWhen).toHaveBeenCalledTimes(1);
      expect(testWhen).toHaveBeenLastCalledWith(
        [],
        { computed: '' },
        undefined
      );
    });
  });

  describe('indirect array of annotations as dependency', () => {
    const testModel = model<TestModel>((root, model) => [
      model.withFields(
        root,
        ['complexList', 'computed'],
        ({ complexList, computed }) => {
          const annotationDependencies = model.annotation(
            model.dependency(complexList, model.array.all, 'value'),
            testAnnotation
          );

          return [
            model.array(complexList, (item) => [
              model.field(item, 'value', (value) => [
                model.annotate(
                  value,
                  testAnnotation,
                  model.compute(value, (it) => it?.toUpperCase())
                )
              ])
            ]),

            model.when(annotationDependencies, testWhen, () => []),
            model.value(
              computed,
              model.compute(annotationDependencies, (arr) => arr.join(','))
            )
          ];
        }
      )
    ]);

    const inputData: TestModel = {
      complexList: [{ value: 'a' }, { value: 'b' }, { value: 'c' }]
    };
    const expectedData: TestModel = { ...inputData, computed: 'A,B,C' };

    it('should resolve dependencies correctly for initial update', () => {
      testIncrementalValidate(testModel, inputData);

      expect(testWhen).toHaveBeenCalledTimes(1);
      expect(testWhen).toHaveBeenCalledWith(
        ['A', 'B', 'C'],
        expectedData,
        undefined
      );
      expect(getModelData(validationContext!)).toEqual(expectedData);
    });

    it('should resolve dependencies correctly for incremental update', () => {
      testIncrementalValidate(testModel, { complexList: [] });
      testIncrementalValidate(testModel, inputData);

      expect(testWhen).toHaveBeenCalledTimes(2);
      expect(testWhen).toHaveBeenLastCalledWith(
        ['A', 'B', 'C'],
        expectedData,
        undefined
      );
      expect(getModelData(validationContext!)).toEqual(expectedData);
    });

    it('should work with undefined optional arrays', () => {
      testIncrementalValidate(testModel, {});

      expect(testWhen).toHaveBeenCalledTimes(1);
      expect(testWhen).toHaveBeenLastCalledWith(
        [],
        { computed: '' },
        undefined
      );
    });
  });

  describe('annotation default values', () => {
    it('should throw when there is no annotation and no default value', () => {
      const testModel = model<TestModel>((root, model) => [
        model.field(root, 'value', (value) => [
          model.when(
            model.annotation(value, testAnnotation),
            testWhen,
            () => []
          )
        ])
      ]);

      expect(() => testIncrementalValidate(testModel, {})).toThrow(
        'Annotation "test" from field "value" used as a dependency, but there is no data for the annotation'
      );
    });

    it('should return default value when there is no annotation', () => {
      const testModel = model<TestModel>((root, model) => [
        model.field(root, 'value', (value) => [
          model.when(
            model.annotation(value, testAnnotation, 'default'),
            testWhen,
            () => []
          )
        ])
      ]);

      expect(() => testIncrementalValidate(testModel, {})).not.toThrow();

      expect(testWhen).toHaveBeenCalledTimes(1);
      expect(testWhen).toHaveBeenCalledWith('default', {}, undefined);
    });

    it('should throw when after incremental update there is no annotation and no default value', () => {
      const testModel = model<TestModel>((root, model) => [
        model.field(root, 'value', (value) => [
          model.when(
            value,
            (value) => value === 'initial',
            () => [model.annotate(value, testAnnotation, 'has value')]
          ),
          model.when(
            model.annotation(value, testAnnotation),
            testWhen,
            () => []
          )
        ])
      ]);

      expect(() =>
        testIncrementalValidate(testModel, { value: 'initial' })
      ).not.toThrow();

      expect(() =>
        testIncrementalValidate(testModel, { value: 'changed' })
      ).toThrow(
        'Annotation "test" from field "value" used as a dependency, but there is no data for the annotation'
      );
    });

    it('should return default value when after incremental update there is no annotation', () => {
      const testModel = model<TestModel>((root, model) => [
        model.field(root, 'value', (value) => [
          model.when(
            value,
            (value) => value === 'initial',
            () => [model.annotate(value, testAnnotation, 'has value')]
          ),
          model.when(
            model.annotation(value, testAnnotation, 'default'),
            testWhen,
            () => []
          )
        ])
      ]);

      expect(() =>
        testIncrementalValidate(testModel, { value: 'initial' })
      ).not.toThrow();

      expect(() =>
        testIncrementalValidate(testModel, { value: 'changed' })
      ).not.toThrow();

      expect(testWhen).toHaveBeenCalledTimes(2);
      expect(testWhen).toHaveBeenCalledWith(
        'default',
        { value: 'changed' },
        undefined
      );
    });
  });

  describe('with cascading changes', () => {
    it('should detect a cyclical dependency with annotations', () => {
      const testModel = model<TestModel>((root, model) => [
        model.withFields(root, ['value', 'computed'], ({ value, computed }) => [
          model.annotate(
            value,
            testAnnotation,
            model.compute(
              model.annotation(computed, testAnnotation),
              (it) => it
            )
          ),
          model.annotate(
            computed,
            testAnnotation,
            model.compute(model.annotation(value, testAnnotation), (it) => it)
          )
        ])
      ]);

      expect(() => testIncrementalValidate(testModel, {})).toThrow(
        'Cyclical dependency to annotation "test" for field "value"'
      );
    });

    it('should detect a cyclical dependency with conditions during initial update', () => {
      const testModel = model<TestModel>((root, model) => [
        model.withFields(root, ['value'], ({ value }) => [
          model.when(
            model.annotation(value, testAnnotation, 'true'),
            (it) => it === 'true',
            () => [model.annotate(value, testAnnotation, 'false')],
            () => [model.annotate(value, testAnnotation, 'true')]
          )
        ])
      ]);

      expect(() => testIncrementalValidate(testModel, {})).toThrow(
        'Cyclical dependency to annotation "test" for field "value"'
      );
    });

    it('should detect a cyclical dependency with conditions during incremental update', () => {
      const testModel = model<TestModel>((root, model) => [
        model.withFields(root, ['value'], ({ value }) => [
          model.when(
            value,
            (it) => it === 'true',
            () => [model.annotate(value, testAnnotation, value)]
          ),
          model.when(
            model.annotation(value, testAnnotation, 'false'),
            (it) => it === 'true',
            () => [model.annotate(value, testAnnotation, 'false')]
          )
        ])
      ]);

      // initial update
      expect(() =>
        testIncrementalValidate(testModel, { value: 'false' })
      ).not.toThrow();

      expect(() =>
        testIncrementalValidate(testModel, { value: 'true' })
      ).toThrow('Cyclical dependency to annotation "test" for field "value"');
    });
  });
});
