import * as R from 'ramda';
import { AnnotateDefinition, RecursiveDefinition, noValue } from '../types';
import checkParentConditions from './checkParentConditions';
import findErrorCacheEntry from './findErrorCacheEntry';
import getProcessingCacheForField from './getProcessingCacheForField';
import { updateChangedAnnotation } from './updateChangedAnnotation';
import resolveDependencies from './resolveDependencies';
import resolveModelPathStr from './resolveModelPathStr';
import { ProcessingContext } from './types';
import findClosestArrayFromDefinitions from './findClosestArrayFromDefinitions';
import { processAnnotationDependencies } from './processAnnotationDependencies';

const processAnnotation = <Data, ExternalData, ErrorType>(
  processingContext: ProcessingContext<Data, ExternalData, ErrorType>,
  annotateDefinition: AnnotateDefinition,
  parentDefinitions: readonly RecursiveDefinition<ErrorType>[],
  currentIndices: Record<string, number>
) => {
  if (
    !checkParentConditions(processingContext, parentDefinitions, currentIndices)
  ) {
    return;
  }

  const pathToFieldStr = resolveModelPathStr(
    annotateDefinition.context.pathToField,
    currentIndices
  );

  const closestArray = findClosestArrayFromDefinitions(parentDefinitions);
  const pathToArrayStr = resolveModelPathStr(closestArray, currentIndices);

  const cacheForField = getProcessingCacheForField(
    processingContext.fieldProcessingCache,
    pathToArrayStr
  );

  // if this annotate() is already processed by some other dependency changing, don't re-process
  const processingState = cacheForField.processedAnnotationDefinitions.get(
    annotateDefinition
  );

  if (processingState === 'processed') {
    return;
  } else if (processingState === 'processing') {
    throw new Error(
      `Cyclical dependency to annotation "${annotateDefinition.annotation}" for field "${pathToFieldStr}"`
    );
  }

  // mark as processing so if processAnnotationDependencies tries to process this annotation again
  // we know there's a cycle and we can throw an error
  cacheForField.processedAnnotationDefinitions.set(
    annotateDefinition,
    'processing'
  );

  /**
   * You can have a situation such as:
   *
   * annotate(fieldA, someAnnotation, annotation(fieldB, someAnnotation)),
   * annotate(fieldB, someAnnotation, 'value')
   *
   * In this case the annotation definition for fieldA is processed first, but it depends on annotation
   * on fieldB. processAnnotationDependencies will figure out what annotation dependencies need to be
   * resolved, and processes them first.
   */
  processAnnotationDependencies(
    processingContext,
    annotateDefinition,
    currentIndices
  );

  cacheForField.processedAnnotationDefinitions.set(
    annotateDefinition,
    'processed'
  );

  const cacheEntry = findErrorCacheEntry(
    processingContext.validateDiffCache,
    parentDefinitions,
    currentIndices
  );

  let fieldAnnotationCache = cacheEntry.annotations.get(pathToFieldStr);

  if (!fieldAnnotationCache) {
    fieldAnnotationCache = new Map();
    cacheEntry.annotations.set(pathToFieldStr, fieldAnnotationCache);
  }

  processingContext.annotationBeingResolved = {
    field: pathToFieldStr,
    annotation: annotateDefinition.annotation
  };

  const resolvedValue = resolveDependencies(
    processingContext,
    annotateDefinition.value,
    currentIndices,
    cacheForField
  );

  const cacheForAnnoation = fieldAnnotationCache.get(annotateDefinition);
  const hasPreviousValue =
    cacheForAnnoation && annotateDefinition.annotation in cacheForAnnoation;
  const previousValue = hasPreviousValue
    ? cacheForAnnoation[annotateDefinition.annotation]
    : noValue;
  const hasAnnotationChanged = !R.equals(resolvedValue, previousValue);

  // Only update the annotation cache if the value has changed, stops infinite recursion
  // when the annotation value is an object, but the data does not actually change
  if (hasAnnotationChanged) {
    fieldAnnotationCache.set(annotateDefinition, {
      [annotateDefinition.annotation]: resolvedValue
    });
  }

  updateChangedAnnotation(
    processingContext,
    pathToFieldStr,
    annotateDefinition.annotation
  );

  processingContext.annotationBeingResolved = undefined;
};

export default processAnnotation;
