import model from '../src/model';
import createValidationContext from '../src/validate/createValidationContext';
import {
  createAnnotation,
  getAllAnnotations,
  getFieldAnnotation,
  getFieldAnnotations,
  getFieldsWithAnnotations,
  ModelValidationContext,
  subscribeToFieldAnnotation,
  updateModel,
} from '../src';

type TestModel = {
  number: number;
  multiplier: number;
  annotatedField?: string;
};

const initialData: TestModel = {
  number: 3,
  multiplier: 2,
};

const multiplied = createAnnotation<number>('multiplied');
const computeFn = jest.fn();

// TODO: should we combine dynamicAnnotations & annotationSubscribers tests to just annotations?
describe('dynamic annotations', () => {
  const testModel = model<TestModel>((root, model) => [
    model.withFields(root, ['annotatedField', 'number', 'multiplier'], ({ annotatedField, number, multiplier }) => [
      model.annotate(annotatedField, multiplied, model.compute({ number, multiplier }, computeFn)),
    ]),
  ]);

  const subscriber = jest.fn();

  let validationContext: ModelValidationContext<TestModel>;

  beforeEach(() => {
    computeFn.mockImplementation(({ number, multiplier }) => number * multiplier);

    validationContext = createValidationContext(testModel);
    updateModel(validationContext, initialData);
    subscribeToFieldAnnotation(validationContext, 'annotatedField', multiplied, subscriber);
  });

  describe('on initial validation', () => {
    it('should return correct dynamic annotation with getAllAnnotations', () => {
      const result = getAllAnnotations(validationContext);

      expect(result).toEqual({ annotatedField: { [multiplied]: 6 } });
    });

    it('should return correct dynamic annotation with getFieldAnnotations', () => {
      const result = getFieldAnnotations(validationContext, 'annotatedField');

      expect(result).toEqual({ [multiplied]: 6 });
    });

    it('should return correct dynamic annotation with getFieldAnnotation', () => {
      const result = getFieldAnnotation(validationContext, 'annotatedField', multiplied);

      expect(result).toBe(6);
    });

    it('should return correct dynamic annotation with getFieldsWithAnnotations', () => {
      const result = getFieldsWithAnnotations(validationContext, {
        [multiplied]: 6,
      });

      expect(result).toEqual(['annotatedField']);
    });

    it('should call the subscriber with correct dynamic annotation', () => {
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith(6);
    });
  });

  describe('when dependencies for the dynamic annotation changes', () => {
    const updatedData: TestModel = {
      ...initialData,
      multiplier: 3,
    };

    beforeEach(() => {
      updateModel(validationContext, updatedData);
    });

    it('should return correct dynamic annotation with getAllAnnotations', () => {
      const result = getAllAnnotations(validationContext);

      expect(result).toEqual({ annotatedField: { [multiplied]: 9 } });
    });

    it('should return correct dynamic annotation with getFieldAnnotations', () => {
      const result = getFieldAnnotations(validationContext, 'annotatedField');

      expect(result).toEqual({ [multiplied]: 9 });
    });

    it('should return correct dynamic annotation with getFieldAnnotation', () => {
      const result = getFieldAnnotation(validationContext, 'annotatedField', multiplied);

      expect(result).toBe(9);
    });

    it('should return correct dynamic annotation with getFieldsWithAnnotations', () => {
      const result = getFieldsWithAnnotations(validationContext, {
        [multiplied]: 9,
      });

      expect(result).toEqual(['annotatedField']);
    });

    it('should call the subscriber with correct dynamic annotation', () => {
      expect(subscriber).toHaveBeenCalledTimes(2);
      expect(subscriber).toHaveBeenCalledWith(9);
    });
  });

  describe('when field with a dynamic annotation changes but the change does not affect the value of the annotation', () => {
    const updatedData: TestModel = {
      ...initialData,
      annotatedField: 'changed',
    };

    beforeEach(() => {
      computeFn.mockClear(); // clear calls up until now
      updateModel(validationContext, updatedData);
    });

    it('should not process the dynamic annotation', () => {
      expect(computeFn).not.toHaveBeenCalled();
    });
  });
});
