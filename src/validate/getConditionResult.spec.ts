jest.mock('./findClosestArrayFromDefinitions');
jest.mock('./resolveModelPathStr');
jest.mock('./resolveDependencies');
jest.mock('./resolveDependency');

import getConditionResult from './getConditionResult';
import findClosestArrayFromDefinitions from './findClosestArrayFromDefinitions';
import resolveModelPathStr from './resolveModelPathStr';
import resolveDependencies from './resolveDependencies';
import resolveDependency from './resolveDependency';
import * as getProcessingCacheForField from './getProcessingCacheForField';
import { ProcessingContext } from './types';
import { getMockProcessingContext } from '../../tests/helpers/getMockProcessingContext';

const getProcessingCacheForFieldSpy = jest.spyOn(
  getProcessingCacheForField,
  'default'
);

describe('getConditionResult', () => {
  const parentDefinitions: any = { mock: 'parentDefinitions' };
  const pathToField: any = { mock: 'pathToField' };
  const resolvedModelPath: any = { mock: 'resolvedModelPath' };
  const mockCurrentIndices: any = { mock: 'mockCurrentIndices' };

  const dependencies: any = { mock: 'dependncies' };
  const resolvedDependencies: any = { mock: 'resolvedDependencies' };

  const testFn = jest.fn();
  const condition: any = { type: 'when', dependencies, testFn };

  let mockProcessingContext: ProcessingContext<any, any, any>;

  const doTest = (condition: any, testResult = true) => {
    testFn.mockReturnValue(testResult);

    return getConditionResult(
      mockProcessingContext,
      condition,
      parentDefinitions,
      mockCurrentIndices
    );
  };

  beforeEach(() => {
    mockProcessingContext = getMockProcessingContext();

    jest.mocked(findClosestArrayFromDefinitions).mockReturnValue(pathToField);
    jest.mocked(resolveModelPathStr).mockReturnValue(resolvedModelPath);
    jest.mocked(resolveDependencies).mockReturnValue(resolvedDependencies);
  });

  it('should use correct field name for caching', () => {
    doTest(condition);
    expect(getProcessingCacheForFieldSpy).toHaveBeenCalledTimes(1);
    expect(getProcessingCacheForFieldSpy).toHaveBeenCalledWith(
      mockProcessingContext.fieldProcessingCache,
      resolvedModelPath
    );
  });

  it('should not resolve data for test context', () => {
    doTest(condition);
    expect(resolveDependency).toHaveBeenCalledTimes(0);
  });

  it('should resolve data for dependencies', () => {
    doTest(condition);
    expect(resolveDependencies).toHaveBeenCalledWith(
      mockProcessingContext,
      dependencies,
      mockCurrentIndices,
      expect.anything()
    );
  });

  it('should call testFn with expected arguments', () => {
    doTest(condition);
    expect(testFn).toHaveBeenCalledTimes(1);
    expect(testFn).toHaveBeenCalledWith(
      resolvedDependencies,
      mockProcessingContext.data,
      mockProcessingContext.externalData
    );
  });

  it('should return true if testFn returns true', () => {
    const result = doTest(condition, true);
    expect(result).toBe(true);
  });

  it('should return false if testFn returns false', () => {
    const result = doTest(condition, false);
    expect(result).toBe(false);
  });

  it('should use cached result for 2nd call', () => {
    doTest(condition, true);
    const result = doTest(condition, false);

    expect(result).toBe(true);
    expect(testFn).toHaveBeenCalledTimes(1);
  });
});
