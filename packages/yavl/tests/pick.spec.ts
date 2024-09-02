import { createValidationContext, Model, model, ModelValidationContext, updateModel } from '../src';

describe('pick', () => {
  let validationContext: ModelValidationContext<any> | undefined;

  const validator = jest.fn();

  const testIncrementalValidate = <T>(testModel: Model<T>, data: T) => {
    if (!validationContext) {
      validationContext = createValidationContext(testModel);
    }

    updateModel(validationContext, data);
  };

  beforeEach(() => {
    validationContext = undefined;
  });

  describe('basic checks', () => {
    type TestModel = {
      field: string;
      obj: {
        a: number;
        b: number;
      };
    };

    const initialData: TestModel = {
      field: 'test',
      obj: { a: 1, b: 2 },
    };

    const testModel = model<TestModel>((root, model) => [
      model.withFields(root, ['field', 'obj'], ({ field, obj }) => [
        model.validate(field, model.pick(obj, ['a']), validator),
      ]),
    ]);

    it('should run validations when picked keys change', () => {
      testIncrementalValidate(testModel, initialData);
      jest.clearAllMocks();

      const updatedData = {
        ...initialData,
        obj: { a: 3, b: 2 }, // a changes
      };
      testIncrementalValidate(testModel, updatedData);

      expect(validator).toHaveBeenCalledTimes(1);
      expect(validator).toHaveBeenCalledWith(updatedData.field, { a: 3 }, updatedData, undefined);
    });

    it('should only run validations when picked keys change', () => {
      testIncrementalValidate(testModel, initialData);
      jest.clearAllMocks();

      const updatedData = {
        ...initialData,
        obj: { a: 1, b: 3 }, // b changes
      };
      testIncrementalValidate(testModel, updatedData);

      expect(validator).toHaveBeenCalledTimes(0);
    });
  });

  describe('optional objects', () => {
    type TestModel = {
      field: string;
      obj?: {
        a?: number;
        b?: number;
      };
    };

    const initialData: TestModel = {
      field: 'test',
    };

    const testModel = model<TestModel>((root, model) => [
      model.withFields(root, ['field', 'obj'], ({ field, obj }) => [
        model.validate(field, model.pick(obj, ['a']), validator),
      ]),
    ]);

    it('should run validate when a picked value turns into defined', () => {
      testIncrementalValidate(testModel, initialData);

      jest.clearAllMocks();

      const updatedData = {
        ...initialData,
        obj: {
          a: 1,
        },
      };

      testIncrementalValidate(testModel, updatedData);

      expect(validator).toHaveBeenCalledTimes(1);
      expect(validator).toHaveBeenCalledWith(updatedData.field, { a: 1 }, updatedData, undefined);
    });

    it('should not run validate when a non-picked value turns into defined', () => {
      testIncrementalValidate(testModel, initialData);

      jest.clearAllMocks();

      const updatedData = {
        ...initialData,
        obj: {
          b: 1,
        },
      };

      testIncrementalValidate(testModel, updatedData);

      expect(validator).toHaveBeenCalledTimes(0);
    });
  });

  describe('using with dependsOn', () => {
    type EmptyObj = {
      type: 'empty';
    };
    type AbObj = {
      type: 'ab';
      a: number;
      b: number;
    };
    type TestModel = {
      field: string;
      obj: EmptyObj | AbObj;
    };

    const initialData: TestModel = {
      field: 'test',
      obj: {
        type: 'ab',
        a: 1,
        b: 2,
      },
    };

    const testModel = model<TestModel>((root, model) => [
      model.withFields(root, ['field', 'obj'], ({ field, obj }) => [
        model.when(
          model.dependsOn(obj, ['type']),
          (obj): obj is AbObj => obj.type === 'ab',
          narrowedObj => [model.validate(field, model.pick(narrowedObj, ['a']), validator)],
        ),
      ]),
    ]);

    it('should run validate when a picked value turns into defined', () => {
      testIncrementalValidate(testModel, initialData);

      jest.clearAllMocks();

      const updatedData: TestModel = {
        ...initialData,
        obj: { type: 'ab', a: 3, b: 2 }, // a changes
      };
      testIncrementalValidate(testModel, updatedData);

      expect(validator).toHaveBeenCalledTimes(1);
      expect(validator).toHaveBeenCalledWith(updatedData.field, { a: 3 }, updatedData, undefined);
    });

    it('should not run validate when a non-picked value turns into defined', () => {
      testIncrementalValidate(testModel, initialData);
      jest.clearAllMocks();

      const updatedData: TestModel = {
        ...initialData,
        obj: { type: 'ab', a: 1, b: 3 }, // b changes
      };
      testIncrementalValidate(testModel, updatedData);

      expect(validator).toHaveBeenCalledTimes(0);
    });
  });
});
