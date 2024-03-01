import * as R from 'ramda';
import { CurrentIndices } from './types';
import { PathToField, FieldFocus } from '../types';
import dataPathToStr from '../utils/dataPathToStr';

const getDependentIndexPermutationsRecursively = (
  remainingPathToField: PathToField,
  data: any,
  currentIndices: CurrentIndices,
  currentPath: (string | number)[]
): CurrentIndices[] => {
  const arrayIndex = remainingPathToField.findIndex(
    (part) => part.type === 'array'
  );

  // as soon as there is no more arrays in the path, return our current permutations
  if (arrayIndex === -1) {
    return [currentIndices];
  }

  const [fieldParts, restOfThePathIncludingArray] = R.splitAt(
    arrayIndex,
    remainingPathToField
  );

  const [[arrayPart], restOfThePath] = R.splitAt(
    1,
    restOfThePathIncludingArray
  );

  if (arrayPart.type !== 'array') {
    throw new Error('never happens, done to type-narrow arrayPart');
  }

  // fieldParts are always FieldFocus since we split at first array index
  const pathToArray = currentPath.concat(
    (fieldParts as FieldFocus[]).map((it) => it.name)
  );

  const pathToArrayStr = dataPathToStr(pathToArray);

  /**
   * - For array.all deps we always want to calculate all permutations.
   * - For array.current we want to use the current index if one is found
   *   from the current path.
   * - For array deps with explicit index, we just use the index in the dependency.
   */
  if (arrayPart.focus !== 'all') {
    const currentIndex =
      arrayPart.focus === 'current'
        ? currentIndices[pathToArrayStr]
        : arrayPart.index;

    if (currentIndex !== undefined) {
      // still at focused path, continue from rest of the path
      return getDependentIndexPermutationsRecursively(
        restOfThePath,
        data,
        { ...currentIndices, [pathToArrayStr]: currentIndex },
        pathToArray.concat(currentIndex)
      );
    }
  }

  // we're missing index information for an array, calculate all different
  // permutations based on how many elements are in the actual form data
  const arrayData = R.view(R.lensPath(pathToArray), data);

  if (!Array.isArray(arrayData) || arrayData.length === 0) {
    // if an array has no items at any part of the path, that means there
    // are no any permutations at all for the path
    return [];
  }

  return arrayData.flatMap((_, idx) =>
    getDependentIndexPermutationsRecursively(
      restOfThePath,
      data,
      { ...currentIndices, [pathToArrayStr]: idx },
      pathToArray.concat(idx)
    )
  );
};

/**
 * Gets all dependent permutations for array indices for a path based on
 * current indices and the actual current form data.
 *
 * Eg. if you have a dependency inside an array validation to a value that is
 * outside of the array, when we process that dependency we must run the
 * validation for all of the elements in the array. This is done by calculating
 * permutations of all the indices that we don't yet know. So basically if
 * "data.list[].innerValue" depends on "data.outerValue", when "data.outerValue"
 * changes and there are 3 items in the list, we must come up with the permutations
 * that cover all of them:
 *
 * [
 *   { 'data.list': 0 },
 *   { 'data.list': 1 },
 *   { 'data.list': 2 }
 * ]
 *
 * If there are multiple nested arrays that depend on an outer value, we will then
 * calculate permutations for all of the combination of array indices.
 */
const getDependentIndexPermutations = (
  pathToField: PathToField,
  data: any,
  currentIndices: CurrentIndices
): CurrentIndices[] => {
  return getDependentIndexPermutationsRecursively(
    pathToField,
    data,
    currentIndices,
    []
  );
};

export default getDependentIndexPermutations;
