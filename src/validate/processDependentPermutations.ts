import { RecursiveDefinition } from '../types';
import getDependentIndexPermutations from './getDependentIndexPermutations';
import findClosestArrayFromDefinitions from './findClosestArrayFromDefinitions';

const processDependentPermutations = (
  parentDefinitions: readonly RecursiveDefinition<any>[],
  data: any,
  currentIndices: Record<string, number>,
  processFn: (indexPermutation: Record<string, number>) => void
) => {
  const indexPermutations = getDependentIndexPermutations(
    findClosestArrayFromDefinitions(parentDefinitions),
    data,
    currentIndices
  );

  indexPermutations.forEach((indices) => processFn(indices));
};

export default processDependentPermutations;
