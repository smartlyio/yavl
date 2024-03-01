jest.mock('./getDependentIndexPermutations');
jest.mock('./findClosestArrayFromDefinitions');

import processDependentPermutations from './processDependentPermutations';
import getDependentIndexPermutations from './getDependentIndexPermutations';
import findClosestArrayFromDefinitions from './findClosestArrayFromDefinitions';

describe('processDependentPermutations', () => {
  const parentDefinitions: any = { mock: 'parentDefinitions' };
  const mockData: any = { mock: 'mockData' };
  const currentIndices: any = { mock: 'currentIndices' };
  const processFn = jest.fn();

  const pathToField: any = { mock: 'pathToField' };
  const indexPermutations: any = [
    { mock: 'indexPermutationA' },
    { mock: 'indexPermutationB' }
  ];

  beforeEach(() => {
    jest.mocked(findClosestArrayFromDefinitions).mockReturnValue(pathToField);
    jest
      .mocked(getDependentIndexPermutations)
      .mockReturnValue(indexPermutations);
  });

  beforeEach(() => {
    processDependentPermutations(
      parentDefinitions,
      mockData,
      currentIndices,
      processFn
    );
  });

  it('should resolve path to field', () => {
    expect(findClosestArrayFromDefinitions).toHaveBeenCalledTimes(1);
    expect(findClosestArrayFromDefinitions).toHaveBeenCalledWith(
      parentDefinitions
    );
  });

  it('should get dependent index permutations', () => {
    expect(getDependentIndexPermutations).toHaveBeenCalledTimes(1);
    expect(getDependentIndexPermutations).toHaveBeenCalledWith(
      pathToField,
      mockData,
      currentIndices
    );
  });

  it('should call processFn for each returned permutation', () => {
    expect(processFn).toHaveBeenCalledTimes(2);
    expect(processFn).toHaveBeenNthCalledWith(1, indexPermutations[0]);
    expect(processFn).toHaveBeenNthCalledWith(2, indexPermutations[1]);
  });
});
