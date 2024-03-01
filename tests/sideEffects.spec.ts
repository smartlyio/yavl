import {
  createValidationContext,
  getModelData,
  Model,
  model,
  ModelValidationContext,
  updateModel
} from '../src';

type TestModel = {
  value?: string;
  a: string;
  b: string;
};

describe('computed values', () => {
  let validationContext: ModelValidationContext<any> | undefined;

  const testIncrementalValidate = <T>(testModel: Model<T, any>, data: T) => {
    if (!validationContext) {
      validationContext = createValidationContext(testModel);
    }

    updateModel(validationContext, data);
  };

  beforeEach(() => {
    validationContext = undefined;
  });

  describe('active and passive dependencies', () => {
    const testModel = model<TestModel>((root, model) => [
      model.withFields(root, ['value', 'a', 'b'], ({ value, a, b }) => [
        model.sideEffect(
          value,
          { a, b: model.passiveDependency(b) },
          (_, { a, b }) => `${a} ${b}`
        )
      ])
    ]);

    it('should run side-effect when active dependency changes', () => {
      testIncrementalValidate(testModel, { a: 'a1', b: 'b1' });
      expect(getModelData(validationContext!)).toEqual({
        a: 'a1',
        b: 'b1',
        value: 'a1 b1'
      });

      testIncrementalValidate(testModel, { a: 'a2', b: 'b1' });
      expect(getModelData(validationContext!)).toEqual({
        a: 'a2',
        b: 'b1',
        value: 'a2 b1'
      });
    });

    it('should not run side-effect when passive dependency changes', () => {
      testIncrementalValidate(testModel, { a: 'a1', b: 'b1' });
      expect(getModelData(validationContext!)).toEqual({
        a: 'a1',
        b: 'b1',
        value: 'a1 b1'
      });

      testIncrementalValidate(testModel, { a: 'a1', b: 'b2', value: 'a1 b1' });
      expect(getModelData(validationContext!)).toEqual({
        a: 'a1',
        b: 'b2',
        value: 'a1 b1'
      });

      // updating active dependency should sample the current value of passive dependency
      testIncrementalValidate(testModel, { a: 'a2', b: 'b2', value: 'a2 b2' });
      expect(getModelData(validationContext!)).toEqual({
        a: 'a2',
        b: 'b2',
        value: 'a2 b2'
      });
    });

    it('should not run side-effect when the value iself is changed', () => {
      testIncrementalValidate(testModel, { a: 'a1', b: 'b1' });
      expect(getModelData(validationContext!)).toEqual({
        a: 'a1',
        b: 'b1',
        value: 'a1 b1'
      });

      testIncrementalValidate(testModel, { a: 'a1', b: 'b1', value: 'custom' });
      expect(getModelData(validationContext!)).toEqual({
        a: 'a1',
        b: 'b1',
        value: 'custom'
      });
    });
  });
});
