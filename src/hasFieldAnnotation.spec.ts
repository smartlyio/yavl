import model from './model';
import { ModelValidationContext } from './validate/types';
import validateModel from './validate/validateModel';
import createValidationContext from './validate/createValidationContext';
import { createAnnotation } from './annotations';
import hasFieldAnnotation from './hasFieldAnnotation';

type TestModel = {
  alwaysAnnotated?: unknown;
  neverAnnotated?: unknown;
  sometimesAnnotated?: boolean;
};

const testAnnotation = createAnnotation<boolean>('test');
const otherAnnotation = createAnnotation<boolean>('other');

describe('testAnnotation', () => {
  let validationContext: ModelValidationContext<TestModel>;

  const testModel = model<TestModel>((root, model) => [
    model.field(root, 'alwaysAnnotated', (alwaysAnnotated) => [
      model.annotate(alwaysAnnotated, testAnnotation, true)
    ]),
    model.field(root, 'sometimesAnnotated', (sometimesAnnotated) => [
      model.when(
        sometimesAnnotated,
        (it) => Boolean(it),
        () => [model.annotate(sometimesAnnotated, testAnnotation, true)]
      )
    ])
  ]);

  beforeEach(() => {
    validationContext = createValidationContext(testModel);
  });

  describe('always', () => {
    beforeEach(() => {
      validateModel(validationContext, {});
    });

    it('should return true for field with the annotation', () => {
      expect(
        hasFieldAnnotation(validationContext, 'alwaysAnnotated', testAnnotation)
      ).toBe(true);
    });

    it('should return false for field without the annotation', () => {
      expect(
        hasFieldAnnotation(
          validationContext,
          'alwaysAnnotated',
          otherAnnotation
        )
      ).toBe(false);

      expect(
        hasFieldAnnotation(validationContext, 'neverAnnotated', testAnnotation)
      ).toBe(false);
    });
  });

  describe('when annotation inside a condition is active', () => {
    beforeEach(() => {
      validateModel(validationContext, { sometimesAnnotated: true });
    });

    describe('with includeInactive = false', () => {
      it('should return true for field with the annotation', () => {
        expect(
          hasFieldAnnotation(
            validationContext,
            'sometimesAnnotated',
            testAnnotation
          )
        ).toBe(true);
      });
    });

    describe('with includeInactive = true', () => {
      it('should return true for field with the annotation', () => {
        expect(
          hasFieldAnnotation(
            validationContext,
            'sometimesAnnotated',
            testAnnotation,
            { includeInactive: true }
          )
        ).toBe(true);
      });
    });
  });

  describe('when annotation inside a condition is inactive', () => {
    beforeEach(() => {
      validateModel(validationContext, { sometimesAnnotated: false });
    });

    describe('with includeInactive = false', () => {
      it('should return false for field with the annotation', () => {
        expect(
          hasFieldAnnotation(
            validationContext,
            'sometimesAnnotated',
            testAnnotation
          )
        ).toBe(false);
      });
    });

    describe('with includeInactive = true', () => {
      it('should return true for field with the annotation', () => {
        expect(
          hasFieldAnnotation(
            validationContext,
            'sometimesAnnotated',
            testAnnotation,
            { includeInactive: true }
          )
        ).toBe(true);
      });
    });
  });
});
