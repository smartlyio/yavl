jest.mock('./resolveDependency');
jest.mock('./resolveDependencies');

import processValidation from './processValidation';
import { ValidateDefinition } from '../types';
import resolveDependency from './resolveDependency';
import resolveDependencies from './resolveDependencies';
import { ProcessingContext } from './types';
import { getMockProcessingContext } from '../../tests/helpers/getMockProcessingContext';

describe('processValidation', () => {
  const validatorFnA = jest.fn();
  const validatorFnB = jest.fn();

  let mockProcessingContext: ProcessingContext<any, any, any>;

  const mockDependencies: any = { mock: 'mockDependencies' };

  const validation: ValidateDefinition<any> = {
    type: 'validate',
    context: {
      type: 'internal',
      pathToField: [{ type: 'field', name: 'test' }]
    },
    dependencies: mockDependencies,
    validators: [validatorFnA, validatorFnB]
  };

  const parentDefinitions: any = [];

  const mockData: any = {
    mock: 'mockData'
  };

  const mockExternalData: any = {
    mock: 'mockExternalData'
  };

  const mockCurrentIndices: any = {
    mock: 'mockCurrentIndices'
  };

  const mockResolvedValue: any = {
    mock: 'mockResolvedValue'
  };

  const mockResolvedDependencies: any = {
    mock: 'mockResolvedDependencies'
  };

  beforeEach(() => {
    // flush the fieldProcessingCache for each test
    mockProcessingContext = getMockProcessingContext({
      data: mockData,
      externalData: mockExternalData
    });

    jest.mocked(resolveDependency).mockReturnValue(mockResolvedValue);
    jest.mocked(resolveDependencies).mockReturnValue(mockResolvedDependencies);
  });

  const testProcessValidation = () => {
    processValidation(
      mockProcessingContext,
      validation,
      parentDefinitions,
      mockCurrentIndices
    );
  };

  describe('when there are errors', () => {
    beforeEach(() => {
      validatorFnA.mockReturnValue('errorA');
      validatorFnB.mockReturnValue('errorB');

      testProcessValidation();
    });

    it('should resolve value correctly', () => {
      expect(resolveDependency).toHaveBeenCalledTimes(1);
      expect(resolveDependency).toHaveBeenCalledWith(
        mockProcessingContext,
        validation.context.type,
        validation.context.pathToField,
        mockCurrentIndices,
        expect.anything()
      );
    });

    it('should resolve dependencies correctly', () => {
      expect(resolveDependencies).toHaveBeenCalledTimes(1);
      expect(resolveDependencies).toHaveBeenCalledWith(
        mockProcessingContext,
        validation.dependencies,
        mockCurrentIndices,
        expect.anything()
      );
    });

    it('should run all validators', () => {
      expect(validatorFnA).toHaveBeenCalledTimes(1);
      expect(validatorFnB).toHaveBeenCalledTimes(1);
      expect(validatorFnA).toHaveBeenCalledWith(
        mockResolvedValue,
        mockResolvedDependencies,
        mockData,
        mockExternalData
      );
      expect(validatorFnB).toHaveBeenCalledWith(
        mockResolvedValue,
        mockResolvedDependencies,
        mockData,
        mockExternalData
      );
    });

    it('should set correct errors', () => {
      expect(mockProcessingContext.validateDiffCache.errors.size).toBe(1);
      expect(
        mockProcessingContext.validateDiffCache.errors.get(validation)
      ).toEqual({ field: 'test', errors: ['errorA', 'errorB'] });
    });

    describe('when validation is processed with existing errors', () => {
      beforeEach(() => {
        // clear the field processing cache for next run
        mockProcessingContext.fieldProcessingCache = {};
      });

      describe('when validation errors changes', () => {
        beforeEach(() => {
          validatorFnA.mockReturnValue(undefined);
          validatorFnB.mockReturnValue('new error');

          testProcessValidation();
        });

        it('should clear errors', () => {
          expect(mockProcessingContext.validateDiffCache.errors.size).toBe(1);
          expect(
            mockProcessingContext.validateDiffCache.errors.get(validation)
          ).toEqual({ field: 'test', errors: ['new error'] });
        });
      });

      describe('when there are no more errors', () => {
        beforeEach(() => {
          validatorFnA.mockReturnValue(undefined);
          validatorFnB.mockReturnValue(undefined);

          testProcessValidation();
        });

        it('should clear errors', () => {
          expect(mockProcessingContext.validateDiffCache.errors.size).toBe(0);
        });
      });
    });
  });

  describe('when there are no errors', () => {
    beforeEach(() => {
      validatorFnA.mockReturnValue(undefined);
      validatorFnB.mockReturnValue(undefined);

      testProcessValidation();
    });

    it('should not set any errors', () => {
      expect(mockProcessingContext.validateDiffCache.errors.size).toBe(0);
    });
  });

  describe('when processing same validation twice', () => {
    beforeEach(() => {
      testProcessValidation();
      testProcessValidation();
    });

    it('should only run the validation function once', () => {
      expect(validatorFnA).toHaveBeenCalledTimes(1);
      expect(validatorFnB).toHaveBeenCalledTimes(1);
    });
  });
});
