import * as R from 'ramda';
import { createValidationContext, getModelData, Model, model, ModelValidationContext, updateModel } from '../src';

describe('optimizations', () => {
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

  describe('when nested conditions change from inactive to active at the same time and inner condition is processed first', () => {
    type TestModel = {
      a: boolean;
      b: boolean;
      c?: string;
    };

    const outerWhen = jest.fn(R.identity);
    const innerWhen = jest.fn(R.identity);
    const validator = jest.fn();

    const testModel = model<TestModel>((root, model) => [
      model.withFields(root, ['a', 'b', 'c'], ({ a, b, c }) => [
        // use "b" for outer when so that the inner when is procesed first, because changes for "a" gets processed first
        model.when(b, outerWhen, () => [
          model.when(a, innerWhen, () => [
            model.when(
              {},
              () => false,
              () => [
                // this validation should never be run because it's inside a falsy when, however if the optimizations are handled incorrectly
                // it's possible that we skip evaluating the parent condition when inner & outer when change at the same time
                model.validate(c, validator),
              ],
            ),
          ]),
        ]),
      ]),
    ]);

    it('should not process the validate inside a condition that is always inactive', () => {
      testIncrementalValidate(testModel, {
        a: false,
        b: false,
      });

      const updatedFormData = {
        a: true,
        b: true,
      };

      jest.clearAllMocks();
      testIncrementalValidate(testModel, updatedFormData);

      expect(validator).not.toHaveBeenCalled();
    });
  });

  describe('when nested condition dependencies change but the parent condition stays inactive', () => {
    type TestModel = {
      cond: boolean;
    };

    const alwaysFalse = jest.fn(() => false);
    const innerWhen = jest.fn(R.identity);

    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'cond', cond => [model.when({}, alwaysFalse, () => [model.when(cond, innerWhen, () => [])])]),
    ]);

    it('should not evaluate any test functions for conditions', () => {
      testIncrementalValidate(testModel, {
        cond: false,
      });

      const updatedFormData = {
        cond: true,
      };

      jest.clearAllMocks();
      testIncrementalValidate(testModel, updatedFormData);

      expect(alwaysFalse).not.toHaveBeenCalled();
      expect(innerWhen).not.toHaveBeenCalled();
    });
  });

  it('cascading changes should be evaluated depth first', () => {
    type TestModel = {
      nested: {
        a: number;
        b?: number;
      };
      total?: number;
    };

    let totalComputations = 0;

    const testModel = model<TestModel>((root, model) => [
      model.withFields(root, ['nested', 'total'], ({ nested, total }) => [
        // defining the value before the nested object should not change order of evaluation
        model.value(
          total,
          model.compute(nested, nested => {
            totalComputations++;
            return nested.a + (nested.b ?? 0);
          }),
        ),
        model.withFields(nested, ['a', 'b'], ({ a, b }) => [
          model.value(
            b,
            model.compute(a, a => a + 1),
          ),
        ]),
      ]),
    ]);

    // initial update
    testIncrementalValidate(testModel, {
      nested: {
        a: 1,
      },
    });

    // incremental update
    totalComputations = 0;
    testIncrementalValidate(testModel, {
      nested: {
        a: 2,
      },
    });
    expect(totalComputations).toBe(1);
    expect(getModelData(validationContext!)).toEqual({
      nested: {
        a: 2,
        b: 3,
      },
      total: 5,
    });
  });

  it('should process changes of all depths even if there is no cascading changes', () => {
    type TestModel = {
      nested: {
        value: string;
      };
      value: string;
      computed?: undefined;
    };

    const captureValue = jest.fn();
    const captureValidate = jest.fn();
    const captureWhen = jest.fn();

    const testModel = model<TestModel>((root, model) => [
      model.withFields(root, ['nested', 'value', 'computed'], ({ nested, value, computed }) => [
        // add a mock dependnecy to nested.value so it get included by getChangedData()
        model.validate(model.dep(nested, 'value'), () => undefined),

        model.value(
          computed,
          model.compute(value, value => {
            captureValue(value);
            return undefined;
          }),
        ),
        model.validate(value, value => {
          captureValidate(value);
          return undefined;
        }),
        model.when(
          value,
          value => {
            captureWhen(value);
            return true;
          },
          () => [],
        ),
      ]),
    ]);

    // initial update
    testIncrementalValidate(testModel, {
      nested: {
        value: 'a',
      },
      value: 'a',
      computed: undefined,
    });

    // incremental update
    jest.clearAllMocks();
    testIncrementalValidate(testModel, {
      nested: {
        value: 'b',
      },
      value: 'b',
      computed: undefined,
    });

    expect(captureValue).toHaveBeenCalledTimes(1);
    expect(captureValue).toHaveBeenCalledWith('b');

    expect(captureValidate).toHaveBeenCalledTimes(1);
    expect(captureValidate).toHaveBeenCalledWith('b');

    expect(captureWhen).toHaveBeenCalledTimes(1);
    expect(captureWhen).toHaveBeenCalledWith('b');
  });
});
