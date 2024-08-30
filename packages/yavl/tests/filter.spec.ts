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

describe('filter', () => {
  let validationContext: ModelValidationContext<any> | undefined;

  const testAnnotation = createAnnotation<string>('test');

  const testIncrementalValidate = <T>(testModel: Model<T>, data: T) => {
    if (!validationContext) {
      validationContext = createValidationContext(testModel);
    }

    updateModel(validationContext, data);
  };

  beforeEach(() => {
    validationContext = undefined;
  });

  describe('filtered value as dependency', () => {
    type TestModel = {
      field?: string;
      list: { filter: string; value: string; unused: string }[];
    };

    const initialData: TestModel = {
      list: [
        { filter: 'a', value: 'value a', unused: 'test' },
        { filter: 'b', value: 'value a', unused: 'test' }
      ]
    };

    const validateFn = jest.fn();
    const filterFn = jest.fn(
      ({ filter }: { filter: string }) => filter === 'b'
    );

    const testModel = model<TestModel>((root, model) => [
      model.withFields(root, ['field', 'list'], ({ field, list }) => {
        const filteredList = model.filter(list, ['filter'], filterFn);

        // this focuses the 2nd item in initialData
        const firstFilteredItem = model.nthFocus(filteredList, 0);
        const valueField = model.dep(firstFilteredItem, 'value');

        return [model.validate(field, valueField, validateFn)];
      })
    ]);

    it('should call validator when value of filtered item changes', () => {
      testIncrementalValidate(testModel, initialData);

      jest.clearAllMocks();

      const updatedData = R.assocPath(
        ['list', 1, 'value'],
        'changed',
        initialData
      );
      testIncrementalValidate(testModel, updatedData);

      expect(validateFn).toHaveBeenCalledTimes(1);
      expect(validateFn).toHaveBeenCalledWith(
        undefined,
        'changed',
        updatedData,
        undefined
      );
    });

    it('should call filter function when the dependency of the filter function changes', () => {
      testIncrementalValidate(testModel, initialData);

      jest.clearAllMocks();

      const updatedData = R.assocPath(
        ['list', 1, 'filter'],
        'changed',
        initialData
      );
      testIncrementalValidate(testModel, updatedData);

      // filter fn gets called for every item of the array when something changes
      expect(filterFn).toHaveBeenCalledTimes(2);
      expect(filterFn).toHaveBeenNthCalledWith(1, { filter: 'a' }, 0);
      expect(filterFn).toHaveBeenNthCalledWith(2, { filter: 'changed' }, 1);
    });

    it('should not call filter or validate function when a non-dependency changes', () => {
      testIncrementalValidate(testModel, initialData);

      jest.clearAllMocks();

      const updatedData = R.assocPath(
        ['list', 1, 'unused'],
        'changed',
        initialData
      );
      testIncrementalValidate(testModel, updatedData);

      expect(filterFn).toHaveBeenCalledTimes(0);
      expect(validateFn).toHaveBeenCalledTimes(0);
    });
  });

  describe('filter with annotations', () => {
    type TestModel = {
      list: { value: string }[];
      computed?: string;
    };

    const initialData: TestModel = {
      list: [{ value: 'a' }, { value: 'b' }]
    };

    const testModel = model<TestModel>((root, model) => [
      model.withFields(root, ['list', 'computed'], ({ list, computed }) => {
        const filteredList = model.filter(
          list,
          ['value'],
          ({ value }) => value === 'b'
        );

        // this focuses the 2nd item in initialData
        const firstFilteredItem = model.nthFocus(filteredList, 0);

        return [
          model.array(list, (item) => [
            model.annotate(item, testAnnotation, model.dep(item, 'value'))
          ]),
          model.value(
            computed,
            model.annotation(firstFilteredItem, testAnnotation)
          )
        ];
      })
    ]);

    it('should give correct annotation with filtered array', () => {
      testIncrementalValidate(testModel, initialData);

      expect(getModelData(validationContext!)).toEqual({
        list: initialData.list,
        computed: 'b'
      });
    });
  });
});
