import resolveDependency from './resolveDependency';
import isAnyModelContext from '../utils/isAnyModelContext';
import isComputedContext from '../utils/isComputedContext';
import { MutatingFieldProcessingCacheEntry, ProcessingContext } from './types';
import isObject from '../utils/isObject';
import { isPreviousContext } from '../utils/isPreviousContext';

const resolveDependencies = <Data, ExternalData, ErrorType>(
  processingContext: ProcessingContext<Data, ExternalData, ErrorType>,
  dependencies: any,
  currentIndices: Record<string, number>,
  runCacheForField: MutatingFieldProcessingCacheEntry<any> | undefined,
): any => {
  if (isAnyModelContext(dependencies)) {
    const modelContext = dependencies;

    return resolveDependency(
      processingContext,
      modelContext.type,
      modelContext.pathToField,
      currentIndices,
      runCacheForField,
    );
  } else if (isComputedContext(dependencies)) {
    // for computed context simply resolve the dependencies and pass to the computeFn
    const computedContext = dependencies;
    if (runCacheForField?.processedComputations.has(computedContext)) {
      return runCacheForField.processedComputations.get(computedContext);
    }
    const computeInput = resolveDependencies(
      processingContext,
      computedContext.dependencies,
      currentIndices,
      runCacheForField,
    );
    const result = computedContext.computeFn(computeInput);
    runCacheForField?.processedComputations.set(computedContext, result);
    return result;
  } else if (isPreviousContext(dependencies)) {
    const previousContext = dependencies;
    const previousData = processingContext.previousDataAtStartOfUpdate;
    // make sure we always return undefined if this is initial update
    if (previousData === undefined) {
      return undefined;
    }
    // Temporarily swap data/externalData to resolve against previous state,
    // avoiding a full ProcessingContext spread.
    const savedData = processingContext.data;
    const savedExternalData = processingContext.externalData;
    processingContext.data = previousData;
    processingContext.externalData = processingContext.previousExternalDataAtStartOfUpdate as ExternalData;
    const result = resolveDependencies(
      processingContext,
      previousContext.dependencies,
      currentIndices,
      runCacheForField,
    );
    processingContext.data = savedData;
    processingContext.externalData = savedExternalData;
    return result;
  } else if (Array.isArray(dependencies)) {
    return dependencies.map(dependency =>
      resolveDependencies(processingContext, dependency, currentIndices, runCacheForField),
    );
  } else if (isObject(dependencies) && typeof dependencies !== 'function') {
    const result: any = {};
    for (const key in dependencies) {
      if (dependencies.hasOwnProperty(key)) {
        result[key] = resolveDependencies(processingContext, dependencies[key], currentIndices, runCacheForField);
      }
    }
    return result;
  } else {
    return dependencies;
  }
};

export default resolveDependencies;
