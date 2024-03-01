import * as R from 'ramda';
import resolveDependency from './resolveDependency';
import isAnyModelContext from '../utils/isAnyModelContext';
import isComputedContext from '../utils/isComputedContext';
import { MutatingFieldProcessingCacheEntry, ProcessingContext } from './types';
import { isPreviousContext } from '../utils/isPreviousContext';

const resolveDependencies = <Data, ExternalData, ErrorType>(
  processingContext: ProcessingContext<Data, ExternalData, ErrorType>,
  dependencies: any,
  currentIndices: Record<string, number>,
  runCacheForField: MutatingFieldProcessingCacheEntry<any> | undefined
): any => {
  if (isAnyModelContext(dependencies)) {
    const modelContext = dependencies;

    return resolveDependency(
      processingContext,
      modelContext.type,
      modelContext.pathToField,
      currentIndices,
      runCacheForField
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
      runCacheForField
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
    return resolveDependencies(
      {
        ...processingContext,
        data: previousData,
        externalData: processingContext.previousExternalDataAtStartOfUpdate
      },
      previousContext.dependencies,
      currentIndices,
      runCacheForField
    );
  } else if (Array.isArray(dependencies)) {
    return dependencies.map((dependency) =>
      resolveDependencies(
        processingContext,
        dependency,
        currentIndices,
        runCacheForField
      )
    );
  } else if (R.is(Object, dependencies) && typeof dependencies !== 'function') {
    return R.mapObjIndexed(
      (dependency) =>
        resolveDependencies(
          processingContext,
          dependency,
          currentIndices,
          runCacheForField
        ),
      dependencies
    );
  } else {
    return dependencies;
  }
};

export default resolveDependencies;
