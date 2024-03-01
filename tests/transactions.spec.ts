import {
  createAnnotation,
  createValidationContext,
  getValidationErrors,
  model,
  ModelValidationContext,
  subscribeToFieldAnnotation,
  transaction,
  updateModel
} from '../src';
import { UnsubscribeFn } from '../src/types';

type TestModel = {
  value: string;
  computed?: string;
};

describe('transactions', () => {
  let validationContext: ModelValidationContext<TestModel>;
  let unsubscribe: UnsubscribeFn | undefined;

  const testAnnotation = createAnnotation<string>('test');
  const subscriber = jest.fn();

  const testModel = model<TestModel>((root, model) => [
    model.withFields(root, ['value', 'computed'], ({ value, computed }) => [
      model.value(
        computed,
        model.compute(value, (value) => value.toUpperCase())
      ),
      model.annotate(
        value,
        testAnnotation,
        model.compute(value, (value) => value.toUpperCase())
      ),
      // give the value itself as validation error so we can check commit/rollback logic
      model.validate(value, (value) => value),
      // test rolling back a condition changing between false/true
      model.when(
        value,
        (value) => value === 'changed',
        () => [model.validate(value, () => 'inside condition')]
      )
    ])
  ]);

  beforeEach(() => {
    validationContext = createValidationContext(testModel);
    unsubscribe = subscribeToFieldAnnotation(
      validationContext,
      'value',
      testAnnotation,
      subscriber,
      undefined
    );
  });

  afterEach(() => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = undefined;
    }
  });

  describe('committing', () => {
    beforeEach(() => {
      updateModel(validationContext, { value: 'initial' });
      jest.clearAllMocks(); // clear the initial call to subscriber

      transaction(validationContext, () => {
        updateModel(validationContext, { value: 'changed' });
      });
    });

    it('should have the changed errors', () => {
      expect(getValidationErrors(validationContext)).toEqual({
        value: ['changed', 'inside condition']
      });
    });

    it('should notify subscribers', () => {
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith('CHANGED');
    });
  });

  describe('rolling back', () => {
    describe('when rolling back initial update', () => {
      it('should throw an error', () => {
        expect(() =>
          transaction(validationContext, ({ rollback }) => {
            updateModel(validationContext, { value: 'initial' });
            rollback();
          })
        ).toThrow('Rolling back initial update is not supported');
      });
    });

    describe('when rolling back other updates', () => {
      beforeEach(() => {
        updateModel(validationContext, { value: 'initial' });
        jest.clearAllMocks(); // clear the initial call to subscriber

        transaction(validationContext, ({ rollback }) => {
          updateModel(validationContext, { value: 'changed' });
          rollback();
        });
      });

      it('should have the original errors', () => {
        expect(getValidationErrors(validationContext)).toEqual({
          value: ['initial']
        });
      });

      it('should not notify subscribers', () => {
        expect(subscriber).not.toHaveBeenCalled();
      });

      describe('when doing an update after rollback', () => {
        beforeEach(() => {
          jest.clearAllMocks();
          updateModel(validationContext, { value: 'changed' });
        });

        it('should have the changed errors', () => {
          expect(getValidationErrors(validationContext)).toEqual({
            value: ['changed', 'inside condition']
          });
        });

        it('should notify subscribers', () => {
          expect(subscriber).toHaveBeenCalledTimes(1);
          expect(subscriber).toHaveBeenCalledWith('CHANGED');
        });
      });
    });
  });
});
