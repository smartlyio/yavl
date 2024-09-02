import * as R from 'ramda';
import { Annotation, noValue } from '../types';
import getIndicesFromStrPath from '../utils/getIndicesFromStrPath';
import checkParentConditions from './checkParentConditions';
import findClosestArrayFromDefinitions from './findClosestArrayFromDefinitions';
import findErrorCacheEntry from './findErrorCacheEntry';
import getDependentIndexPermutations from './getDependentIndexPermutations';
import { ProcessingContext } from './types';

/**
 * This is very similar to what getFieldAnnotation does, with main difference being that
 * getFieldAnnotation() works with the assumption that all the conditions have already been
 * processed, meaning that one can just check whether path is active by looking at the cached value.
 *
 * However when processing the model updates in passes, it's possible that we have not yet processed
 * the conditions so they can be marked inactive in the cache, but the condition is about to turn to true,
 * we have not yet just processed it. This fucntion uses the "checkParentConditions" to get the real-time
 * value using processing context, instead of using the cached value.
 */
export const getFieldResolvedAnnotation = (
  processingContext: ProcessingContext<any, any, any>,
  field: string,
  annotation: Annotation<any>,
): any => {
  // TODO: we should consider all [current] and [\d] permutations if we want to support
  // adding annotations to specific index with "annotate(dep(array, 0), ...)", we already have
  // a function that does this: getDependencyPathPermutations
  const modelField = field.replace(/\[\d+\]/g, '[current]');
  const fieldCache = processingContext.fieldDependencyCache[`internal:${modelField}`];

  if (!fieldCache) {
    return noValue;
  }

  const indices = getIndicesFromStrPath(field);

  // check the annotations in reverse order, this allows us to do early return for first active annotation
  for (let i = fieldCache.annotations.length - 1; i >= 0; --i) {
    const { definition: annotateDefinition, parentDefinitions, isDependencyOfValue } = fieldCache.annotations[i];

    if (isDependencyOfValue || annotateDefinition.annotation !== annotation) {
      // we're only interested in the specific annotation
      continue;
    }

    /**
     * It's possible that you have a situation where annotation for a field is inside array, eg.
     *
     * array(arr, (item) => [
     *  annotate(field, annotation, item) // field is outside of array
     * ])
     *
     * In order to handle these cases, we should take the value from the last array element,
     * as that is considered to be the active one.
     */

    const indexPermutation = R.last(
      getDependentIndexPermutations(
        findClosestArrayFromDefinitions(parentDefinitions),
        processingContext.data,
        indices,
      ),
    );

    if (!indexPermutation) {
      throw new Error('Missing indexPermutation, should never happen');
    }

    const isPathActive = checkParentConditions(processingContext, parentDefinitions, indexPermutation);

    if (!isPathActive) {
      // if the path is not active, check next one
      continue;
    }

    /**
     * NOTE.
     * Although we have already checked for path activity, we still need to specify
     * "followInactivePaths" as true for finding the error cache entry. The reason
     * is that checkParentConditions does not update the cache entries to say the path
     * is active, so if a path changed from inactive into active in this update and the
     * corresponding when definition has not yet been processed, the path is still marked
     * as inactive in the cache.
     */
    const { annotations } = findErrorCacheEntry(
      processingContext.validateDiffCache,
      parentDefinitions,
      indexPermutation,
      true,
      true,
    );

    const fieldRuntimeAnnotationData = annotations.get(field);
    const annotationData = fieldRuntimeAnnotationData?.get(annotateDefinition);

    if (annotationData) {
      return annotationData[annotateDefinition.annotation];
    }
  }

  return noValue;
};
