import model from '../model';
import { Model } from '../types';
import createValidationContext from './createValidationContext';
import getValidationErrors from './getValidationErrors';
import { ModelValidationContext, ModelValidationErrors } from './types';
import updateModel from './updateModel';

describe('getValidationErrors', () => {
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

  describe('when validation errors for a field changes', () => {
    type TestModel = {
      a?: string;
      b?: string;
    };

    const testModel = model<TestModel>((root, model) => [
      model.withFields(root, ['a', 'b'], ({ a, b }) => [
        // return the values themselves as error to test
        model.validate(a, value => value),
        model.validate(b, value => value),
      ]),
    ]);

    let oldErrors: ModelValidationErrors<string>;
    let newErrors: ModelValidationErrors<string>;

    beforeEach(() => {
      testIncrementalValidate(testModel, { a: 'x', b: 'y' });
      oldErrors = getValidationErrors(validationContext!);

      testIncrementalValidate(testModel, { a: 'changed', b: 'y' });
      newErrors = getValidationErrors(validationContext!);
    });

    it('should not mutate objects that have been returned', () => {
      expect(oldErrors).toEqual({ a: ['x'], b: ['y'] });
      expect(newErrors).toEqual({
        a: ['changed'],
        b: ['y'],
      });
    });

    it('should return new object reference for changed paths', () => {
      expect(Object.is(newErrors?.a, oldErrors?.a)).toBe(false);
    });

    it('should retain same object reference for unchanged paths', () => {
      expect(Object.is(newErrors?.b, oldErrors?.b)).toBe(true);
    });
  });
});
