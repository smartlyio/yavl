import { createValidationContext, Model, model, ModelValidationContext, updateModel } from '../../src';
import { getMockProcessingContext } from '../../tests/helpers/getMockProcessingContext';
import resolveDependency from './resolveDependency';

const makeData = (type: 'internal' | 'external') => ({
  nested: { value: `${type} data` },
  array: [
    {
      value: 'valA',
      nestedArray: [{ value: 'nestedValA' }],
    },
    {
      value: 'valB',
      nestedArray: [{ value: 'nestedValB' }, { value: 'nestedValC' }],
    },
  ],
  multiDimensionalArray: [
    [{ value: 1 }, { value: 2 }],
    [{ value: 3 }, { value: 4 }],
  ],
  multiDimensionalArrayInArray: [
    {
      array: [
        [{ value: 1 }, { value: 2 }],
        [{ value: 3 }, { value: 4 }],
      ],
    },
    {
      array: [
        [{ value: 5 }, { value: 6 }],
        [{ value: 7 }, { value: 8 }],
      ],
    },
  ],
});

describe('resolveDependency', () => {
  const data = makeData('internal');
  const externalData = makeData('external');
  const currentIndices = {
    array: 1,
    'array[1].nestedArray': 0,
  };
  const runCacheForField = undefined;

  const processingContext = getMockProcessingContext({
    data,
    externalData,
  });

  it('should return correct data with field access', () => {
    expect(
      resolveDependency(
        processingContext,
        'internal',
        [
          { type: 'field', name: 'nested' },
          { type: 'field', name: 'value' },
        ],
        currentIndices,
        runCacheForField,
      ),
    ).toEqual('internal data');
  });

  it('should return correct data with all array focus', () => {
    expect(
      resolveDependency(
        processingContext,
        'internal',
        [
          { type: 'field', name: 'array' },
          { type: 'array', focus: 'all' },
        ],
        currentIndices,
        runCacheForField,
      ),
    ).toEqual(data.array);
  });

  it('should return correct data with all array focus followed by field', () => {
    expect(
      resolveDependency(
        processingContext,
        'internal',
        [
          { type: 'field', name: 'array' },
          { type: 'array', focus: 'all' },
          { type: 'field', name: 'value' },
        ],
        currentIndices,
        runCacheForField,
      ),
    ).toEqual(['valA', 'valB']);
  });

  it('should return correct data with multiple all array focus', () => {
    expect(
      resolveDependency(
        processingContext,
        'internal',
        [
          { type: 'field', name: 'array' },
          { type: 'array', focus: 'all' },
          { type: 'field', name: 'nestedArray' },
          { type: 'array', focus: 'all' },
          { type: 'field', name: 'value' },
        ],
        currentIndices,
        runCacheForField,
      ),
    ).toEqual(['nestedValA', 'nestedValB', 'nestedValC']);
  });

  it('should return correct data with multi-dimensional all array focus', () => {
    expect(
      resolveDependency(
        processingContext,
        'internal',
        [
          { type: 'field', name: 'multiDimensionalArray' },
          { type: 'array', focus: 'all' },
        ],
        currentIndices,
        runCacheForField,
      ),
    ).toEqual([
      [{ value: 1 }, { value: 2 }],
      [{ value: 3 }, { value: 4 }],
    ]);
  });

  it('should return correct data with multi-dimensional array with all array on focus on child array', () => {
    expect(
      resolveDependency(
        processingContext,
        'internal',
        [
          { type: 'field', name: 'multiDimensionalArray' },
          { type: 'array', focus: 'all' },
          { type: 'array', focus: 'all' },
        ],
        currentIndices,
        runCacheForField,
      ),
    ).toEqual([{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }]);
  });

  it('should return correct data with nested multi-dimensional all array focus', () => {
    expect(
      resolveDependency(
        processingContext,
        'internal',
        [
          { type: 'field', name: 'multiDimensionalArray' },
          { type: 'array', focus: 'all' },
          { type: 'array', focus: 'all' },
          { type: 'field', name: 'value' },
        ],
        currentIndices,
        runCacheForField,
      ),
    ).toEqual([1, 2, 3, 4]);
  });

  it('should work the same way when the multi-dimensional array is inside another array', () => {
    expect(
      resolveDependency(
        processingContext,
        'internal',
        [
          { type: 'field', name: 'multiDimensionalArrayInArray' },
          { type: 'array', focus: 'all' },
          { type: 'field', name: 'array' },
        ],
        currentIndices,
        runCacheForField,
      ),
    ).toEqual([
      [
        [{ value: 1 }, { value: 2 }],
        [{ value: 3 }, { value: 4 }],
      ],
      [
        [{ value: 5 }, { value: 6 }],
        [{ value: 7 }, { value: 8 }],
      ],
    ]);

    expect(
      resolveDependency(
        processingContext,
        'internal',
        [
          { type: 'field', name: 'multiDimensionalArrayInArray' },
          { type: 'array', focus: 'all' },
          { type: 'field', name: 'array' },
          { type: 'array', focus: 'all' },
        ],
        currentIndices,
        runCacheForField,
      ),
    ).toEqual([
      [{ value: 1 }, { value: 2 }],
      [{ value: 3 }, { value: 4 }],
      [{ value: 5 }, { value: 6 }],
      [{ value: 7 }, { value: 8 }],
    ]);

    expect(
      resolveDependency(
        processingContext,
        'internal',
        [
          { type: 'field', name: 'multiDimensionalArrayInArray' },
          { type: 'array', focus: 'all' },
          { type: 'field', name: 'array' },
          { type: 'array', focus: 'all' },
          { type: 'array', focus: 'all' },
        ],
        currentIndices,
        runCacheForField,
      ),
    ).toEqual([
      { value: 1 },
      { value: 2 },
      { value: 3 },
      { value: 4 },
      { value: 5 },
      { value: 6 },
      { value: 7 },
      { value: 8 },
    ]);
  });

  it('should return undefined if trying to access non-existent data', () => {
    expect(
      resolveDependency(
        processingContext,
        'internal',
        [{ type: 'field', name: 'nonExistentField' }],
        currentIndices,
        runCacheForField,
      ),
    ).toBeUndefined();
  });

  it('should throw when trying to access current data after all focus', () => {
    expect(() =>
      resolveDependency(
        processingContext,
        'internal',
        [
          { type: 'field', name: 'array' },
          { type: 'array', focus: 'all' },
          { type: 'field', name: 'nestedArray' },
          { type: 'array', focus: 'current' },
        ],
        currentIndices,
        runCacheForField,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Trying to focus current array index after already focusing on all elements earlier in the path"`,
    );
  });

  describe('with internal dependency', () => {
    it('should return data from form data', () => {
      expect(resolveDependency(processingContext, 'internal', [], currentIndices, runCacheForField)).toEqual(data);
    });

    it('should return correct data with current array focus', () => {
      expect(
        resolveDependency(
          processingContext,
          'internal',
          [
            { type: 'field', name: 'array' },
            { type: 'array', focus: 'current' },
            { type: 'field', name: 'nestedArray' },
            { type: 'array', focus: 'current' },
            { type: 'field', name: 'value' },
          ],
          currentIndices,
          runCacheForField,
        ),
      ).toEqual('nestedValB');
    });
  });

  describe('with external dependency', () => {
    it('should return data from external data', () => {
      expect(resolveDependency(processingContext, 'external', [], currentIndices, runCacheForField)).toEqual(
        externalData,
      );
    });

    it('should throw when trying to access arrays with current focus', () => {
      expect(() =>
        resolveDependency(
          processingContext,
          'external',
          [
            { type: 'field', name: 'array' },
            { type: 'array', focus: 'current' },
          ],
          currentIndices,
          runCacheForField,
        ),
      ).toThrowErrorMatchingInlineSnapshot(
        `"Trying to focus current path of array failed; current focus is not supported for external data"`,
      );
    });
  });

  /**
   * These tests were AI gen but tried to keep them as human friendly as possible
   */
  describe('when array contains null or undefined items', () => {
    let validationContext: ModelValidationContext<any> | undefined;

    const testIncrementalValidate = <T>(testModel: Model<T>, data: T) => {
      if (!validationContext) {
        validationContext = createValidationContext(testModel);
      }
      updateModel(validationContext, data);
    };

    beforeEach(() => {
      validationContext = undefined;
    });

    type TestModel = {
      list: ({ name: string } | null | undefined)[];
    };

    it('should resolve array.all field dependency without crashing', () => {
      const validator = jest.fn();

      const testModel = model<TestModel>((root, model) => [
        model.field(root, 'list', _list => [
          model.validate(model.passive(root), model.dep(root, 'list', model.array.all, 'name'), validator),
        ]),
      ]);

      const data: TestModel = {
        list: [{ name: 'Alice' }, null, undefined, { name: 'Diana' }],
      };

      testIncrementalValidate(testModel, data);

      expect(validator).toHaveBeenCalledWith(data, ['Alice', undefined, undefined, 'Diana'], data, undefined);
    });

    it('should resolve nested array.all dependency with null items', () => {
      type NestedModel = {
        groups: ({ values: ({ score: number } | null | undefined)[] } | null)[];
      };

      const validator = jest.fn();

      const testModel = model<NestedModel>((root, model) => [
        model.validate(
          model.passive(root),
          model.dep(root, 'groups', model.array.all, 'values', model.array.all, 'score'),
          validator,
        ),
      ]);

      const data: NestedModel = {
        groups: [{ values: [{ score: 10 }, null] }, null, { values: [undefined, { score: 40 }] }],
      };

      testIncrementalValidate(testModel, data);

      expect(validator).toHaveBeenCalledWith(data, [10, undefined, undefined, undefined, 40], data, undefined);
    });

    it('should validate correctly after removing null items from the array', () => {
      const validator = jest.fn();

      const testModel = model<TestModel>((root, model) => [
        model.field(root, 'list', _list => [
          model.validate(model.passive(root), model.dep(root, 'list', model.array.all, 'name'), validator),
        ]),
      ]);

      const initialData: TestModel = {
        list: [{ name: 'Alice' }, null, { name: 'Charlie' }],
      };
      testIncrementalValidate(testModel, initialData);

      jest.clearAllMocks();

      const updatedData: TestModel = {
        list: [{ name: 'Alice' }, { name: 'Charlie' }],
      };
      testIncrementalValidate(testModel, updatedData);

      expect(validator).toHaveBeenCalledWith(updatedData, ['Alice', 'Charlie'], updatedData, undefined);
    });
  });
});
