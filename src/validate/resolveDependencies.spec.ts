jest.mock('./resolveDependency');

import resolveDependencies from './resolveDependencies';
import resolveDependency from './resolveDependency';
import { AnyModelContext, ComputedContext, PreviousContext } from '../types';
import { getMockProcessingContext } from '../../tests/helpers/getMockProcessingContext';
import { ProcessingContext } from './types';

describe('resolveDependencies', () => {
  const currentIndices: any = { mock: 'currentIndices' };

  const testContext: AnyModelContext<any> = {
    type: 'internal',
    pathToField: []
  };

  const computedContext: ComputedContext<any> = {
    type: 'computed',
    dependencies: { numbers: [1, 2, 3], str: testContext },
    computeFn: ({ numbers, str }: { numbers: number[]; str: string }) => ({
      sum: numbers.reduce((acc, num) => acc + num, 0),
      str: str.toUpperCase()
    })
  };

  const testFn = () => {};

  let result: any;
  let mockProcessingContext: ProcessingContext<any, any, any>;

  const previousDataAtStartOfUpdate: any = {
    mock: 'previousDataAtStartOfUpdate'
  };

  const previousExternalDataAtStartOfUpdate: any = {
    mock: 'previousExternalDataAtStartOfUpdate'
  };

  beforeEach(() => {
    jest.mocked(resolveDependency).mockReturnValue('resolved');

    mockProcessingContext = getMockProcessingContext({
      previousDataAtStartOfUpdate,
      previousExternalDataAtStartOfUpdate
    });
  });

  const testResolveDependencies = (value: any) =>
    resolveDependencies(
      mockProcessingContext,
      value,
      currentIndices,
      undefined
    );

  describe('with no dependencies', () => {
    beforeEach(() => {
      result = testResolveDependencies({});
    });

    it('should not call resolveDependency', () => {
      expect(resolveDependency).toHaveBeenCalledTimes(0);
    });

    it('should return empty object', () => {
      expect(result).toEqual({});
    });
  });

  describe('with dependencies being a context itself', () => {
    it('should return resolved value', () => {
      const result = testResolveDependencies(testContext);
      expect(result).toEqual('resolved');
    });
  });

  describe('with dependencies being a computed data', () => {
    it('should call the compute function with resolved input data and return the result', () => {
      const result = testResolveDependencies(computedContext);
      expect(result).toEqual({ sum: 6, str: 'RESOLVED' });
    });
  });

  describe('with dependencies being previous context', () => {
    it('should resolve the dependencies with previous data', () => {
      const previousContext: PreviousContext<any> = {
        type: 'previous',
        dependencies: testContext
      };
      const result = testResolveDependencies(previousContext);
      expect(resolveDependency).toHaveBeenCalledTimes(1);
      expect(resolveDependency).toHaveBeenCalledWith(
        {
          ...mockProcessingContext,
          data: previousDataAtStartOfUpdate,
          externalData: previousExternalDataAtStartOfUpdate
        },
        testContext.type,
        testContext.pathToField,
        currentIndices,
        undefined
      );
      expect(result).toEqual('resolved');
    });
  });

  describe('with dependencies being an object with dependencies', () => {
    it('should resolve dependencies inside the object', () => {
      const result = testResolveDependencies({
        depA: testContext,
        depB: computedContext
      });
      expect(result).toEqual({
        depA: 'resolved',
        depB: { sum: 6, str: 'RESOLVED' }
      });
    });

    it('should resolve non-dependencies as they are', () => {
      const result = testResolveDependencies({
        depA: testContext,
        depB: 'plain value'
      });
      expect(result).toEqual({
        depA: 'resolved',
        depB: 'plain value'
      });
    });
  });

  describe('with dependencies being an array with dependencies', () => {
    it('should resolve dependencies inside the array', () => {
      const result = testResolveDependencies([testContext, computedContext]);
      expect(result).toEqual(['resolved', { sum: 6, str: 'RESOLVED' }]);
    });

    it('should resolve non-dependencies as they are', () => {
      const result = testResolveDependencies([testContext, 'plain value']);
      expect(result).toEqual(['resolved', 'plain value']);
    });
  });

  describe('with dependencies being a function', () => {
    it('should resolve function as it is', () => {
      const result = testResolveDependencies(testFn);
      expect(result).toEqual(testFn);
    });
  });

  describe('with nested dependencies', () => {
    it('should resolve dependencies inside arbitrarily nested objects and arrays', () => {
      const result = testResolveDependencies({
        depA: {
          innerDepA: testContext,
          list: [{ value: 'plain value' }, { value: computedContext }],
          fn: testFn
        },
        depB: 'plain value'
      });
      expect(result).toEqual({
        depA: {
          innerDepA: 'resolved',
          list: [
            { value: 'plain value' },
            { value: { sum: 6, str: 'RESOLVED' } }
          ],
          fn: testFn
        },
        depB: 'plain value'
      });
    });
  });
});
