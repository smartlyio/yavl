jest.mock('./buildFieldDependencyCache');
jest.mock('./processDefinitionList');
jest.mock('./builder/required');
jest.mock('./builder/optional');
jest.mock('./getFieldsWithDependencies');

import model, { defaultTestRequiredFn } from './model';
import { Model } from './types';
import processDefinitionList from './processDefinitionList';
import buildFieldDependencyCache from './buildFieldDependencyCache';
import makeRequired from './builder/required';
import makeOptional from './builder/optional';
import { getFieldsWithDependencies } from './getFieldsWithDependencies';

describe('model', () => {
  let testModel: Model<any>;

  const modelBuilder = jest.fn();

  const requiredFn = (): any => [];
  const optionalFn = (): any => [];

  const mockModelDefinitions: any = {
    mock: 'mockModelDefinitions',
  };

  const processedMockModelDefinitions: any = {
    mock: 'processedMockModelDefinitions',
  };

  const mockFieldDependencyCache: any = {
    mock: 'mockFieldDependencyCache',
  };

  const mockFieldsWithDependencies: any = {
    mock: 'mockFieldsWithDependencies',
  };

  const expectedRootContext = { type: 'internal', pathToField: [] };
  const expectedModelDefinition = {
    type: 'model',
    context: expectedRootContext,
    children: processedMockModelDefinitions,
  };

  beforeEach(() => {
    modelBuilder.mockReturnValue(mockModelDefinitions);
    jest.mocked(makeRequired).mockReturnValue(requiredFn);
    jest.mocked(makeOptional).mockReturnValue(optionalFn);
    jest.mocked(processDefinitionList).mockReturnValue(processedMockModelDefinitions);
    jest.mocked(buildFieldDependencyCache).mockReturnValue(mockFieldDependencyCache);
    jest.mocked(getFieldsWithDependencies).mockReturnValue(mockFieldsWithDependencies);
  });

  describe('when options are not provided', () => {
    beforeEach(() => {
      testModel = model<any>(modelBuilder);
    });

    it('should make required function with default implementation', () => {
      expect(makeRequired).toHaveBeenCalledTimes(1);
      expect(makeRequired).toHaveBeenCalledWith(defaultTestRequiredFn);
    });

    it('should make optional function with default implementation', () => {
      expect(makeOptional).toHaveBeenCalledTimes(1);
      expect(makeOptional).toHaveBeenCalledWith(defaultTestRequiredFn);
    });

    it('should call the model builder', () => {
      expect(modelBuilder).toHaveBeenCalledTimes(1);
      expect(modelBuilder).toHaveBeenCalledWith(expectedRootContext, expect.anything());
    });

    it('should process returned definitions', () => {
      expect(processDefinitionList).toHaveBeenCalledTimes(1);
      expect(processDefinitionList).toHaveBeenCalledWith([expectedRootContext], [mockModelDefinitions]);
    });

    it('should build a field dependency cache', () => {
      expect(buildFieldDependencyCache).toHaveBeenCalledTimes(1);
      expect(buildFieldDependencyCache).toHaveBeenCalledWith(expectedModelDefinition);
    });

    it('should return correct model', () => {
      expect(testModel).toEqual({
        modelDefinition: expectedModelDefinition,
        fieldDependencyCache: mockFieldDependencyCache,
        fieldsWithDependencies: mockFieldsWithDependencies,
      });
    });
  });

  describe('when options are provided', () => {
    const testRequiredFn = jest.fn();

    beforeEach(() => {
      testModel = model<any>({ testRequiredFn }, modelBuilder);
    });

    it('should make required function with given testRequiredFn implementation', () => {
      expect(makeRequired).toHaveBeenCalledTimes(1);
      expect(makeRequired).toHaveBeenCalledWith(testRequiredFn);
    });

    it('should make optional function with given testRequiredFn implementation', () => {
      expect(makeOptional).toHaveBeenCalledTimes(1);
      expect(makeOptional).toHaveBeenCalledWith(testRequiredFn);
    });
  });
});
