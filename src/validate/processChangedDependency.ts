import { ProcessingContext } from './types';
import processCondition from './processCondition';
import processValidation from './processValidation';
import processAnnotation from './processAnnotation';
import { getIsPathActive } from './getIsPathActive';
import { FieldDependency, FieldDependencyEntry } from '../types';
import findClosestArrayFromDefinitions from './findClosestArrayFromDefinitions';
import modelPathToStr from '../utils/modelPathToStr';
import { getPathWithoutIndices } from '../utils/getPathWithoutIndices';
import getDependentIndexPermutations from './getDependentIndexPermutations';

/**
 * There's two different ways we need to process permutations for dependency.
 *
 * If you have data model such as:
 * {
 *   value: string;
 *   list: string[]
 * }
 *
 * Case A:
 *
 * withFields(root, ['value', 'list'], ({ value, list }) => [
 *   array(list, (item) => [
 *     validate(item, value, validator)
 *   ])
 * ])
 *
 * In this case when "value" changes, it affects the validation for every
 * item in the list, so we need to process all the permutations for the list.
 *
 * In this case the "parentDefinitionsOfDependency" refer to the parent definitions
 * of the "validate" definition which child of the array definition, and the changed
 * value is outside that array. This means that the "currentIndices" will not have
 * a current index for the "list" array, which will make processDependentPermutations
 * process all items of the array for the validate definition.
 *
 * Case B:
 *
 * field(root, 'list', (list) => [
 *   array(list, (item) => [
 *     validate(item, dependency(list, array.all), validator)
 *   ])
 * ])
 *
 * In this case when eg. "list[1]" changes, it also should affect the validation for
 * every item in the list. However the way how case A is processed doesn't work here.
 * The reason is that in this case since it's the list[1] that changed, the "currentIndices"
 * has a value for the "list" (eg. "list": 1). This means that processDependentPermutations
 * will only process the validation for the list[1] and not for the other items in the list.
 *
 * It's important for processDependentPermutations to work like this, otherwise even if the
 * validate didn't include a dependency to all elements in the same list, we'd process all
 * items for no reason which can have a negative impact on performance.
 *
 * In order to handle case B correctly, we need to check whether parent definition for the
 * definition (the "validate") refer to the same array as the changed dependency ("list[all]")
 * that we deduced from the changed path ("list[1]").
 *
 * If the parent definitions refers to the same array, we'll instead process the permutations
 * of the changed dependency ("list[all]"). This works because processDependentPermutations will
 * ignore the current indices if it sees "[all]" instead of "[current]" in the path.
 *
 * These two cases are mutually exclusive, se we need to just do either way, not both.
 */
const processDependencyPermutations = (
  processingContext: ProcessingContext<any, any, any>,
  type: 'internal' | 'external',
  fieldDependency: FieldDependency<any>,
  currentIndices: Record<string, number>,
  callback: (indexPermutation: Record<string, number>) => void
) => {
  const closestArrayOfDependency = findClosestArrayFromDefinitions(
    fieldDependency.parentDefinitions
  );
  // field dependencies are always to internal data
  const closestArrayOfDependencyNormalized = getPathWithoutIndices(
    modelPathToStr('internal', closestArrayOfDependency)
  );

  const changedFieldPathNormalized = getPathWithoutIndices(
    modelPathToStr(type, fieldDependency.modelPath)
  );

  const isDependencyInsideArray = closestArrayOfDependency.length > 0;
  const isSameArray =
    isDependencyInsideArray &&
    changedFieldPathNormalized.indexOf(closestArrayOfDependencyNormalized) ===
      0;

  if (isSameArray) {
    const indexPermutations = getDependentIndexPermutations(
      fieldDependency.modelPath,
      processingContext.data,
      currentIndices
    );

    indexPermutations.forEach((indexPermutation) => {
      callback(indexPermutation);
    });
  } else {
    const indexPermutations = getDependentIndexPermutations(
      closestArrayOfDependency,
      processingContext.data,
      currentIndices
    );

    indexPermutations.forEach((indexPermutation) => {
      callback(indexPermutation);
    });
  }
};

export const processChangedDependency = <Data, ExternalData, ErrorType>(
  processingContext: ProcessingContext<Data, ExternalData, ErrorType>,
  pass: 'annotations' | 'conditions' | 'validations',
  type: 'internal' | 'external',
  changedFieldDependency: FieldDependencyEntry<ErrorType>,
  currentIndices: Record<string, number>
) => {
  if (pass === 'annotations') {
    const dependentAnnotations = changedFieldDependency.annotations.filter(
      // we only need to process annotations if a dependency of the value has changed
      // or if the annotation is a computed value
      (dependentAnnotation) =>
        dependentAnnotation.isDependencyOfValue ||
        dependentAnnotation.isComputedValue
    );

    dependentAnnotations.forEach((dependentAnnotation) => {
      processDependencyPermutations(
        processingContext,
        type,
        dependentAnnotation,
        currentIndices,
        (indexPermutation) => {
          processAnnotation(
            processingContext,
            dependentAnnotation.definition,
            dependentAnnotation.parentDefinitions,
            indexPermutation
          );
        }
      );
    });
  }

  if (pass === 'conditions') {
    changedFieldDependency.conditions.forEach((dependentCondition) => {
      processDependencyPermutations(
        processingContext,
        type,
        dependentCondition,
        currentIndices,
        (indexPermutation) => {
          processCondition(
            processingContext,
            dependentCondition.definition,
            dependentCondition.parentDefinitions,
            false, // isNewCondition = false
            indexPermutation
          );
        }
      );
    });
  }

  if (pass === 'validations') {
    changedFieldDependency.validations.forEach((dependentValidation) => {
      if (dependentValidation.isPassive) {
        return;
      }

      processDependencyPermutations(
        processingContext,
        type,
        dependentValidation,
        currentIndices,
        (indexPermutation) => {
          const isActive = getIsPathActive(
            processingContext.validateDiffCache,
            dependentValidation.parentDefinitions,
            indexPermutation
          );

          // don't process validation unless the path is active
          if (isActive) {
            processValidation(
              processingContext,
              dependentValidation.definition,
              dependentValidation.parentDefinitions,
              indexPermutation
            );
          }
        }
      );
    });
  }
};
