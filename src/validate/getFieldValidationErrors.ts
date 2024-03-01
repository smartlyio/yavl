import getIndicesFromStrPath from '../utils/getIndicesFromStrPath';
import findErrorCacheEntry from './findErrorCacheEntry';
import processDependentPermutations from './processDependentPermutations';
import { ProcessingContext, ValidateDefinitionErrors } from './types';

export const getFieldValidationErrors = <ErrorType>(
  processingContext: ProcessingContext<any, any, ErrorType>,
  field: string
): ErrorType[] | undefined => {
  // TODO: we should consider all [current] and [\d] permutations if we want to support
  // adding errors to specific index with "validate(dep(array, 0), ...)", we already have
  // a function that does this: getDependencyPathPermutations
  const modelField = field.replace(/\[\d+\]/g, '[current]');
  const fieldCache =
    processingContext.fieldDependencyCache[`internal:${modelField}`];

  if (!fieldCache) {
    return undefined;
  }

  const indices = getIndicesFromStrPath(field);
  const errors: ErrorType[] = [];
  const processedErrorCaches = new Set<ValidateDefinitionErrors<ErrorType>>();

  fieldCache.validations.forEach(({ parentDefinitions, isDependency }) => {
    // we only care about dependencies where field is the context of the validation
    if (isDependency) {
      return;
    }

    // TODO: add comment why this is needed
    processDependentPermutations(
      parentDefinitions,
      processingContext.data,
      indices,
      (indexPermutation) => {
        const { errors: errorCache, isPathActive } = findErrorCacheEntry(
          processingContext.validateDiffCache,
          parentDefinitions,
          indexPermutation,
          true,
          false
        );

        if (!isPathActive || processedErrorCaches.has(errorCache)) {
          // if the path is not active, check next one
          return;
        }

        processedErrorCaches.add(errorCache);

        errorCache.forEach(
          ({ field: fieldFromCache, errors: errorsFromCache }) => {
            if (fieldFromCache === field) {
              errors.push(...errorsFromCache);
            }
          }
        );
      }
    );
  });

  return errors.length > 0 ? errors : undefined;
};
