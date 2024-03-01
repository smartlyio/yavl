import * as R from 'ramda';
import { ProcessingContext } from './types';
import { ValidateDefinition, RecursiveDefinition } from '../types';
import resolveDependencies from './resolveDependencies';
import rejectUndefinedValues from '../utils/rejectUndefinedValues';
import getProcessingCacheForField from './getProcessingCacheForField';
import resolveModelPathStr from './resolveModelPathStr';
import findErrorCacheEntry from './findErrorCacheEntry';
import resolveDependency from './resolveDependency';
import findClosestArrayFromDefinitions from './findClosestArrayFromDefinitions';
import { updateChangedValidation } from './updateChangedValidation';

const processValidation = <Data, ExternalData, ErrorType>(
  processingContext: ProcessingContext<Data, ExternalData, ErrorType>,
  validation: ValidateDefinition<ErrorType>,
  parentDefinitions: RecursiveDefinition<ErrorType>[],
  currentIndices: Record<string, number>
): void => {
  const {
    data,
    externalData,
    fieldProcessingCache,
    validateDiffCache
  } = processingContext;

  const closestArray = findClosestArrayFromDefinitions(parentDefinitions);
  const pathToArrayStr = resolveModelPathStr(closestArray, currentIndices);
  const runCacheForField = getProcessingCacheForField(
    fieldProcessingCache,
    pathToArrayStr
  );

  if (runCacheForField.ranValidations.has(validation)) {
    return;
  }

  const resolvedValue = resolveDependency(
    processingContext,
    validation.context.type,
    validation.context.pathToField,
    currentIndices,
    runCacheForField
  );

  const resolvedDependencies =
    validation.dependencies &&
    resolveDependencies(
      processingContext,
      validation.dependencies,
      currentIndices,
      runCacheForField
    );

  const errors = R.unnest(
    rejectUndefinedValues(
      validation.validators.map((validator) => {
        const errorOrErrors = validation.dependencies
          ? validator(resolvedValue, resolvedDependencies, data, externalData)
          : validator(resolvedValue, data, externalData);
        if (Array.isArray(errorOrErrors)) {
          return errorOrErrors;
        } else if (errorOrErrors !== undefined) {
          return [errorOrErrors];
        } else {
          return undefined;
        }
      })
    )
  );

  const cacheEntry = findErrorCacheEntry(
    validateDiffCache,
    parentDefinitions,
    currentIndices
  );

  const field = resolveModelPathStr(
    validation.context.pathToField,
    currentIndices
  );

  if (errors.length > 0) {
    cacheEntry.errors.set(validation, { field, errors });
  } else {
    cacheEntry.errors.delete(validation);
  }

  runCacheForField.ranValidations.set(validation, true);

  updateChangedValidation(processingContext, field);
};

export default processValidation;
