import { WhenDefinition, RecursiveDefinition } from '../types';
import { ModelValidationCache, ProcessingContext } from './types';
import { processModelRecursively } from './processModelRecursively';
import getProcessingCacheForField from './getProcessingCacheForField';
import findErrorCacheEntry from './findErrorCacheEntry';
import findClosestArrayFromDefinitions from './findClosestArrayFromDefinitions';
import resolveModelPathStr from './resolveModelPathStr';
import checkParentConditions from './checkParentConditions';
import { updateChangedAnnotation } from './updateChangedAnnotation';
import { updateChangedValidation } from './updateChangedValidation';
import { getIsPathActive } from './getIsPathActive';

const handleInactivatedChildDefinitions = (
  processingContext: ProcessingContext<any, any, any>,
  cacheEntry: ModelValidationCache<any>,
  handledFields: Set<string> = new Set()
) => {
  cacheEntry.annotations.forEach((fieldAnnotationCache, pathToField) => {
    fieldAnnotationCache.forEach((_, { annotation }) => {
      updateChangedAnnotation(processingContext, pathToField, annotation);
    });
  });

  cacheEntry.errors.forEach(({ field }) => {
    if (!handledFields.has(field)) {
      updateChangedValidation(processingContext, field);
      handledFields.add(field);
    }
  });

  cacheEntry.children.forEach((childCacheEntry) => {
    // we don't need to care about old inactive paths of children conditions
    if (childCacheEntry.isPathActive) {
      handleInactivatedChildDefinitions(
        processingContext,
        childCacheEntry,
        handledFields
      );
    }
  });
};

const processCondition = <Data, ExternalData, ErrorType>(
  processingContext: ProcessingContext<Data, ExternalData, ErrorType>,
  condition: WhenDefinition<ErrorType>,
  parentDefinitions: RecursiveDefinition<ErrorType>[],
  isNewCondition: boolean,
  currentIndices: Record<string, number>
) => {
  const isParentPathActive = getIsPathActive(
    processingContext.validateDiffCache,
    parentDefinitions,
    currentIndices
  );

  /**
   * We can have a situation when nested conditions change from inactive to active at the same time.
   * If the inner nested condition has never been true before, the cache entry will have a value of
   * true for the "isPathActive" for that entry, because we don't care about keeping the activity
   * information up-to-date deeply, it's enough if one of the parent conditions has it.
   *
   * However if the inner nested condition gets processed first before the outer condition, the code
   * below that computes "conditionChangedToTrue" would determine it to be false, because it uses
   * the cached information. In reality the condition did turn active however, because the parent
   * condition turned active.
   *
   * In this case because "conditionChangedToTrue" was determined to be false, we do not process the
   * children definitions of the condition. However at the same time we mark the condition as processed.
   * When later the outer condition is processed and it'll process its children recursively because
   * "conditionChangedToTrue" is true, it'll skip processing the inner nested condition because the
   * condition is already marked as processed.
   *
   * In order to deal with this race condition, let's not process the inner condition before the outer
   * condition. The "getIsPathActive" returns whether the path is active based on the current cache
   * values, meaning that if outer when has not yet been processed, the value would be false.
   *
   * When the outer when gets processed, it'll recursively process all its children, including the inner
   * nested "when", and at that point of time the getIsPathActive will return true and this condition
   * will get processed correctly.
   *
   * This optimization also helps in the case where only the dependencies for the inner condition would
   * change, but the dependencies of the outer condition would remain the same. Without this optimization
   * we would always re-evaluate the parent conditions for no reason, but with this we can just do an early
   * return because we know the parents have not changed.
   */
  if (!isParentPathActive) {
    return;
  }

  const closestArray = findClosestArrayFromDefinitions(parentDefinitions);
  const pathToArrayStr = resolveModelPathStr(closestArray, currentIndices);

  const cacheForField = getProcessingCacheForField(
    processingContext.fieldProcessingCache,
    pathToArrayStr
  );

  // if this when() is aready processed by eg. dependency changing, don't re-process
  if (cacheForField.processedConditionDefinitions.has(condition)) {
    return;
  }

  // regardless of how we exit from this function, we don't want re-process this later
  cacheForField.processedConditionDefinitions.set(condition, true);

  const isPathActive = checkParentConditions(
    processingContext,
    parentDefinitions.concat(condition),
    currentIndices
  );

  const errorCacheEntry = findErrorCacheEntry(
    processingContext.validateDiffCache,
    parentDefinitions.concat(condition),
    currentIndices
  );

  const wasConditionTruePreviously = errorCacheEntry.isPathActive;
  const conditionChangedToTrue = !wasConditionTruePreviously && isPathActive;
  const conditionChangedToFalse = wasConditionTruePreviously && !isPathActive;

  /**
   * Mark the path as active/inactive. This does two things:
   * - Excludes all errors from inactive paths when aggregating the result from validation
   * - Allows us to detect when the branch re-actives so we can force re-validation
   */
  errorCacheEntry.isPathActive = isPathActive;

  if (isPathActive && (isNewCondition || conditionChangedToTrue)) {
    /**
     * When path changes to active we need to first update any annotations
     * that were affected by the change.
     */
    processModelRecursively(
      processingContext,
      'annotations',
      parentDefinitions.concat(condition),
      currentIndices
    );

    /**
     * If the condition just turned to true, we want to re-validate everything under
     * the path. This is needed because the path might've been activated by a dependency
     * update, meaning the data itself under the path might not have been updated, but
     * we still want to re-run the validations to gather the errors.
     */
    processModelRecursively(
      processingContext,
      'conditions',
      parentDefinitions.concat(condition),
      currentIndices
    );

    if (!processingContext.isInitialValidation) {
      /**
       * Since processCondition is called during the conditions pass, we do not want to execute validations yet
       * at this point. For initial update we don't need to do anything because we always process all validations
       * in the last pass, but for the incremental updates we must record that we must process validations for this
       * actived branch after the condition pass is done
       */
      processingContext.unprocessedValidationsForConditons.push({
        pathToCondition: parentDefinitions.concat(condition),
        indices: currentIndices
      });
    }
  } else if (conditionChangedToFalse) {
    /**
     * In case the condition changed from true to false, that also affects all nested annotations
     * and validations inside the condition. We must recursively find all the inactivated
     * definitions, update the resolved annotation/validation caches, and mark the annotations
     * as changed so the annotation subscribers will get notified.
     */
    handleInactivatedChildDefinitions(processingContext, errorCacheEntry);
  }
};

export default processCondition;
