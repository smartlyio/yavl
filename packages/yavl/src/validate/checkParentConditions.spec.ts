jest.mock('./getConditionResult');

import { getMockProcessingContext } from '../../tests/helpers/getMockProcessingContext';
import checkParentConditions from './checkParentConditions';
import getConditionResult from './getConditionResult';

describe('checkParentConditions', () => {
  let result: boolean;

  const mockProcessingContext = getMockProcessingContext();

  const mockCurrentIndices: any = {
    mock: 'mockCurrentIndices',
  };

  const parentDefinitionA: any = { type: 'when', mock: 'parentDefinitionA' };
  const parentDefinitionB: any = { type: 'array', mock: 'parentDefinitionB' };
  const parentDefinitionC: any = { type: 'when', mock: 'parentDefinitionC' };

  const parentDefinitions = [parentDefinitionA, parentDefinitionB, parentDefinitionC];

  const testCheckParentConditions = (firstCondition: boolean, secondCondition: boolean) => {
    jest.mocked(getConditionResult).mockReturnValueOnce(firstCondition).mockReturnValueOnce(secondCondition);

    result = checkParentConditions(mockProcessingContext, parentDefinitions, mockCurrentIndices);
  };

  describe('when all conditions are truthy', () => {
    beforeEach(() => {
      testCheckParentConditions(true, true);
    });

    it('should call getConditionResult for each when definition in the list', () => {
      expect(getConditionResult).toHaveBeenCalledTimes(2);
      expect(getConditionResult).toHaveBeenNthCalledWith(
        1,
        mockProcessingContext,
        parentDefinitionA,
        [],
        mockCurrentIndices,
      );
      expect(getConditionResult).toHaveBeenNthCalledWith(
        2,
        mockProcessingContext,
        parentDefinitionC,
        parentDefinitions.slice(0, 2),
        mockCurrentIndices,
      );
    });

    it('should return true', () => {
      expect(result).toBe(true);
    });
  });

  describe('when first condition is truthy and second is falsy', () => {
    beforeEach(() => {
      testCheckParentConditions(true, false);
    });

    it('should call getConditionResult for each when definition in the list', () => {
      expect(getConditionResult).toHaveBeenCalledTimes(2);
    });

    it('should return false', () => {
      expect(result).toBe(false);
    });
  });

  describe('when first condition is falsy and second is truthy', () => {
    beforeEach(() => {
      testCheckParentConditions(false, true);
    });

    it('should only call getConditionResult for first definition', () => {
      expect(getConditionResult).toHaveBeenCalledTimes(1);
    });

    it('should return false', () => {
      expect(result).toBe(false);
    });
  });
});
