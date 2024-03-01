import * as R from 'ramda';
import {
  createValidationContext,
  getValidationErrors,
  Model,
  model,
  ModelValidationContext,
  updateModel
} from '../src';
import * as processValidationModule from '../src/validate/processValidation';

const processValidationSpy = jest.spyOn(processValidationModule, 'default');

/**
 * TODO:
 * The incrementalValidation.spec.ts is way too huge so let's not add more tests there.
 * Let's move the array related tests here over time.
 */
describe('arrays', () => {
  let validationContext: ModelValidationContext<any, any> | undefined;

  const testIncrementalValidate = <T, E>(
    testModel: Model<T, E>,
    data: T,
    externalData?: E
  ) => {
    if (!validationContext) {
      validationContext = createValidationContext(testModel, externalData);
    }

    updateModel(validationContext, data, externalData);
  };

  beforeEach(() => {
    validationContext = undefined;
  });

  describe('when same field is used as the context for validate and as array.all dependency', () => {
    type TestModel = {
      list?: Array<{
        value?: string;
      }>;
    };

    const validator = jest.fn();
    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'list', (list) => [
        model.array(list, (item) => [
          model.field(item, 'value', (value) => [
            model.validate(
              value,
              [
                // make sure to have a dependency to the same field without the array.all first
                // this makes sure that we don't have some caching optimization that would cause
                // the 2nd dependency from being processed in full
                model.dep(list, 0, 'value'),
                model.dep(list, model.array.all, 'value')
              ],
              validator
            )
          ])
        ])
      ])
    ]);

    it('should validate value for all array elements when value for one element changes', () => {
      const initialData: TestModel = {
        list: [{ value: 'a' }, { value: 'b' }, { value: 'c' }]
      };
      testIncrementalValidate(testModel, initialData);

      const updatedFormData = {
        list: [{ value: 'x' }, initialData.list![1], initialData.list![2]]
      };

      jest.clearAllMocks();
      testIncrementalValidate(testModel, updatedFormData);

      expect(validator).toHaveBeenCalledTimes(3);
      expect(validator).toHaveBeenCalledWith(
        'x',
        ['x', ['x', 'b', 'c']],
        updatedFormData,
        undefined
      );
      expect(validator).toHaveBeenCalledWith(
        'b',
        ['x', ['x', 'b', 'c']],
        updatedFormData,
        undefined
      );
      expect(validator).toHaveBeenCalledWith(
        'c',
        ['x', ['x', 'b', 'c']],
        updatedFormData,
        undefined
      );
    });

    it('should validate value for all array elements when an array item is removed', () => {
      const initialData: TestModel = {
        list: [{ value: 'a' }, { value: 'b' }, { value: 'c' }]
      };
      testIncrementalValidate(testModel, initialData);

      jest.clearAllMocks();

      const updatedFormData = R.dissocPath(['list', 2], initialData);
      testIncrementalValidate(testModel, updatedFormData);

      expect(validator).toHaveBeenCalledTimes(2);
      expect(validator).toHaveBeenCalledWith(
        'a',
        ['a', ['a', 'b']],
        updatedFormData,
        undefined
      );
      expect(validator).toHaveBeenCalledWith(
        'b',
        ['a', ['a', 'b']],
        updatedFormData,
        undefined
      );
    });

    it('should validate when a new array item with property missing is added', () => {
      let lastValues: (string | undefined)[] = [];

      const testModel = model<TestModel>((root, model) => [
        model.validate(
          model.passive(root),
          model.dep(root, 'list', model.array.all, 'value'),
          (_, values) => {
            lastValues = values;
            return undefined;
          }
        )
      ]);

      const initialData = {
        list: [{ value: 'a' }]
      };
      testIncrementalValidate(testModel, initialData);
      expect(lastValues).toHaveLength(1);
      expect(lastValues).toEqual(['a']);

      const updatedData1 = {
        list: [...initialData.list, { value: undefined }]
      };
      testIncrementalValidate(testModel, updatedData1);
      expect(lastValues).toHaveLength(2);
      expect(lastValues).toEqual(['a', undefined]);

      const updatedData2 = {
        list: [...updatedData1.list, {}]
      };
      testIncrementalValidate(testModel, updatedData2);
      expect(lastValues).toHaveLength(3);
      expect(lastValues).toEqual(['a', undefined, undefined]);
    });

    it('should validate when a new array item with property missing is added to external data', () => {
      type TestModel = unknown;
      type ExternalData = {
        list: Array<{ value?: string }>;
      };

      let lastValues: (string | undefined)[] = [];

      const testModel = model<TestModel, ExternalData>((root, model) => [
        model.validate(
          model.passive(root),
          model.dep(model.externalData, 'list', model.array.all, 'value'),
          (_, values) => {
            lastValues = values;
            return undefined;
          }
        )
      ]);

      const initialData = {
        list: [{ value: 'a' }]
      };
      testIncrementalValidate(testModel, {}, initialData);
      expect(lastValues).toHaveLength(1);
      expect(lastValues).toEqual(['a']);

      const updatedData1 = {
        list: [...initialData.list, { value: undefined }]
      };
      testIncrementalValidate(testModel, {}, updatedData1);
      expect(lastValues).toHaveLength(2);
      expect(lastValues).toEqual(['a', undefined]);

      const updatedData2 = {
        list: [...updatedData1.list, {}]
      };
      testIncrementalValidate(testModel, {}, updatedData2);
      expect(lastValues).toHaveLength(3);
      expect(lastValues).toEqual(['a', undefined, undefined]);
    });

    it('should validate when a new array is added in an update', () => {
      let lastValues: (string | undefined)[] | undefined = undefined;

      const testModel = model<TestModel>((root, model) => [
        model.validate(
          model.passive(root),
          model.dep(root, 'list', model.array.all, 'value'),
          (_, values) => {
            lastValues = values;
            return undefined;
          }
        )
      ]);

      const initialData = {};
      testIncrementalValidate(testModel, initialData);
      expect(lastValues).toHaveLength(0);

      const updatedData = {
        list: [{ value: 'a' }, { value: 'b' }]
      };
      testIncrementalValidate(testModel, updatedData);
      expect(lastValues).toHaveLength(2);
      expect(lastValues).toEqual(['a', 'b']);
    });

    it('should validate when all array items are removed in an update', () => {
      let lastValues: (string | undefined)[] | undefined = undefined;

      const testModel = model<TestModel>((root, model) => [
        model.validate(
          model.passive(root),
          model.dep(root, 'list', model.array.all, 'value'),
          (_, values) => {
            lastValues = values;
            return undefined;
          }
        )
      ]);

      const initialData = {
        list: [{ value: 'a' }, { value: 'b' }]
      };
      testIncrementalValidate(testModel, initialData);
      expect(lastValues).toHaveLength(2);
      expect(lastValues).toEqual(['a', 'b']);

      const updatedData: TestModel = { list: [] };
      testIncrementalValidate(testModel, updatedData);
      expect(lastValues).toHaveLength(0);
    });

    it('should validate when an array is removed in an update', () => {
      let lastValues: (string | undefined)[] | undefined = undefined;

      const testModel = model<TestModel>((root, model) => [
        model.validate(
          model.passive(root),
          model.dep(root, 'list', model.array.all, 'value'),
          (_, values) => {
            lastValues = values;
            return undefined;
          }
        )
      ]);

      const initialData = {
        list: [{ value: 'a' }, { value: 'b' }]
      };
      testIncrementalValidate(testModel, initialData);
      expect(lastValues).toHaveLength(2);
      expect(lastValues).toEqual(['a', 'b']);

      const updatedData: TestModel = {};
      testIncrementalValidate(testModel, updatedData);
      expect(lastValues).toHaveLength(0);
    });
  });

  describe('when array.all is used as dependency outside the array', () => {
    it('should only call validator once when the array changes', () => {
      type TestModel = {
        list: { value: string }[];
        value?: string;
      };

      const testModel = model<TestModel>((root, model) => [
        model.withFields(root, ['list', 'value'], ({ list, value }) => [
          model.validate(
            value,
            model.dep(list, model.array.all, 'value'),
            () => undefined
          )
        ])
      ]);

      const initialData: TestModel = {
        list: [{ value: 'a' }, { value: 'b' }, { value: 'c' }]
      };
      testIncrementalValidate(testModel, initialData);

      jest.clearAllMocks();

      const updatedData: TestModel = {
        list: [{ value: 'x' }, initialData.list[1], initialData.list[2]]
      };
      testIncrementalValidate(testModel, updatedData);

      // we can't assert the calls to the validate function itself because
      // processValidation has caching so we only call it once
      expect(processValidationSpy.mock.calls.length).toBe(1);
    });
  });

  describe('when field outside an array is used as dependency inside the array', () => {
    it('should call validator for every array item when field outside the array changes', () => {
      type TestModel = {
        list: { value: string }[];
        value: string;
      };

      const validator = jest.fn();
      const testModel = model<TestModel>((root, model) => [
        model.withFields(root, ['list', 'value'], ({ list, value }) => [
          model.array(list, (item) => [
            model.field(item, 'value', (itemValue) => [
              model.validate(itemValue, value, (itemValue, value) =>
                validator(itemValue, value)
              )
            ])
          ])
        ])
      ]);

      const initialData: TestModel = {
        list: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
        value: 'initial'
      };
      testIncrementalValidate(testModel, initialData);

      jest.clearAllMocks();

      const updatedData: TestModel = {
        list: initialData.list,
        value: 'changed'
      };
      testIncrementalValidate(testModel, updatedData);

      expect(validator).toHaveBeenCalledTimes(3);
      expect(validator).toHaveBeenCalledWith('a', 'changed');
      expect(validator).toHaveBeenCalledWith('b', 'changed');
      expect(validator).toHaveBeenCalledWith('c', 'changed');
    });
  });

  describe('when external data is used as dependency inside the array', () => {
    type TestModel = {
      list: { value: string }[];
    };

    type ExternalData = {
      value: string;
    };

    const validator = jest.fn();
    const testModel = model<TestModel, ExternalData>((root, model) => [
      model.field(root, 'list', (list) => [
        model.array(list, (item) => [
          model.field(item, 'value', (itemValue) => [
            model.validate(
              itemValue,
              model.dep(model.externalData, 'value'),
              (itemValue, value) => validator(itemValue, value)
            )
          ])
        ])
      ])
    ]);

    it('should call validator for every array item when field outside the array changes', () => {
      const initialData: TestModel = {
        list: [{ value: 'a' }, { value: 'b' }, { value: 'c' }]
      };
      const initialExtData: ExternalData = {
        value: 'initial'
      };
      testIncrementalValidate(testModel, initialData, initialExtData);

      jest.clearAllMocks();

      const updateExtdData: ExternalData = {
        value: 'changed'
      };
      testIncrementalValidate(testModel, initialData, updateExtdData);

      expect(validator).toHaveBeenCalledTimes(3);
      expect(validator).toHaveBeenCalledWith('a', 'changed');
      expect(validator).toHaveBeenCalledWith('b', 'changed');
      expect(validator).toHaveBeenCalledWith('c', 'changed');
    });

    it('should not call validator if there are no items in the array', () => {
      const initialData: TestModel = {
        list: []
      };
      const initialExtData: ExternalData = {
        value: 'initial'
      };
      testIncrementalValidate(testModel, initialData, initialExtData);
      expect(validator).toHaveBeenCalledTimes(0);

      jest.clearAllMocks();

      const updateExtdData: ExternalData = {
        value: 'changed'
      };
      testIncrementalValidate(testModel, initialData, updateExtdData);
      expect(validator).toHaveBeenCalledTimes(0);
    });
  });

  describe('when multiple array items change at same time', () => {
    it('should call validator for each changed item', () => {
      type TestModel = {
        list: string[];
      };

      const testModel = model<TestModel>((root, model) => [
        model.field(root, 'list', (list) => [
          model.array(list, (item) => [
            model.validate(item, (value) => value !== '', 'Item is required')
          ])
        ])
      ]);

      const initialData: TestModel = {
        list: ['', '']
      };
      testIncrementalValidate(testModel, initialData);
      expect(getValidationErrors(validationContext!)).toEqual({
        'list[0]': ['Item is required'],
        'list[1]': ['Item is required']
      });

      jest.clearAllMocks();

      const updatedData: TestModel = {
        list: ['a', 'b']
      };
      testIncrementalValidate(testModel, updatedData);
      expect(getValidationErrors(validationContext!)).toEqual(undefined);
    });
  });
});
