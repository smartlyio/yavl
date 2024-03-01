import { WhenDefinition, RecursiveDefinition } from '../types';
import { ProcessingContext } from './types';
import getProcessingCacheForField from './getProcessingCacheForField';
import resolveDependencies from './resolveDependencies';
import findClosestArrayFromDefinitions from './findClosestArrayFromDefinitions';
import resolveModelPathStr from './resolveModelPathStr';

const getConditionResult = <Data, ExternalData, ErrorType>(
  processingContext: ProcessingContext<Data, ExternalData, ErrorType>,
  condition: WhenDefinition<ErrorType>,
  parentDefinitions: RecursiveDefinition<ErrorType>[],
  currentIndices: Record<string, number>
): boolean => {
  const { data, externalData, fieldProcessingCache } = processingContext;
  const { dependencies, testFn } = condition;

  const closestArray = findClosestArrayFromDefinitions(parentDefinitions);
  const pathToArrayStr = resolveModelPathStr(closestArray, currentIndices);

  const runCacheForField = getProcessingCacheForField(
    fieldProcessingCache,
    pathToArrayStr
  );

  const resultFromCache = runCacheForField.conditionTestFnResults.get(
    condition
  );
  if (resultFromCache !== undefined) {
    return resultFromCache;
  }

  const dependenciesData = resolveDependencies(
    processingContext,
    dependencies,
    currentIndices,
    runCacheForField
  );

  const result = testFn(dependenciesData, data, externalData);

  runCacheForField.conditionTestFnResults.set(condition, result);

  return result;
};

export default getConditionResult;
