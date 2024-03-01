import getChangedData from './getChangedData';
import {
  createProcessingContext,
  updateContextDataAndChangedAnnotations
} from './processModelHelpers';
import processChangedFields from './processChangedFields';
import { processModelRecursively } from './processModelRecursively';
import {
  ChangedAnnotationsDependency,
  CompareFn,
  ModelValidationContext,
  NewDefinition,
  ProcessingContext,
  UnprocessedValidationsForCondition
} from './types';
import { updateModelCaches } from './updateModelCaches';
import { Annotation, FieldDependencyEntry } from '../types';
import getDependencyPathPermutations from '../utils/getDependencyPathPermutations';
import { strPathToArray } from '../utils/strPathToArray';
import rejectUndefinedValues from '../utils/rejectUndefinedValues';
import { processChangedAnnotations } from './processChangedAnnotations';
import { processArraysWithChangedLength } from './processArraysWithChangedLength';
import dataPathToStr from '../utils/dataPathToStr';

type Definitions = 'annotations' | 'conditions' | 'validations';

type ChangedPath = ReadonlyArray<string | number>;
type ChangedData = Set<ChangedPath>;
type ChangedDataByPathLength = Map<number, Set<string>>;

type UnprocessedChangedData = Record<Definitions, ChangedDataByPathLength>;
type UnprocessedChangedExternalData = Record<Definitions, ChangedData>;
type UnprocessedArraysWithChangedLength = Record<Definitions, ChangedData>;
type UnprocessedChangedAnnotations = Record<
  Definitions,
  ChangedAnnotationsDependency[]
>;
type UnprocessedNewDefinitions<ErrorType> = Record<
  Definitions,
  NewDefinition<ErrorType>[]
>;

type UnprocessedContext<ErrorType> = {
  changedData: UnprocessedChangedData;
  changedExternalData: UnprocessedChangedExternalData;
  arraysWithRemovedData: UnprocessedArraysWithChangedLength;
  externalArraysWithRemovedData: UnprocessedArraysWithChangedLength;
  changedAnnotations: UnprocessedChangedAnnotations;
  newDefinitions: UnprocessedNewDefinitions<ErrorType>;
};

type ProcessPassResult<Data> =
  | {
      needsAnotherPass: true;
      needsNewProcessingContext: boolean;
      data: Data;
    }
  | { needsAnotherPass: false };

const getChangedFieldAnnotationDependencies = (
  processingContext: ProcessingContext<any, any, any>,
  field: string,
  annotation: Annotation<any>
): FieldDependencyEntry<any>[] => {
  const changedPath = strPathToArray(field);
  const dependentPathPermutations = getDependencyPathPermutations(
    'internal', // annotations are always internal
    changedPath
  );

  const dependencies = rejectUndefinedValues(
    dependentPathPermutations.map(
      (path) => processingContext.fieldDependencyCache[`${path}/${annotation}`]
    )
  );

  return dependencies;
};

const getChangedAnnotations = (
  processingContext: ProcessingContext<any, any, any>
): ChangedAnnotationsDependency[] => {
  const result: ChangedAnnotationsDependency[] = [];

  processingContext.changedAnnotationsCache.forEach(
    (changedAnnotations, field) => {
      changedAnnotations.forEach((annotation) => {
        result.push({
          field,
          annotation,
          dependencies: getChangedFieldAnnotationDependencies(
            processingContext,
            field,
            annotation
          )
        });
      });
    }
  );

  return result;
};

const needsAnotherPassDueToAnnotationChange = (
  pass: Definitions,
  changedAnnotations: ChangedAnnotationsDependency[]
) => {
  const summary = changedAnnotations.reduce(
    (acc: Record<Definitions, number>, { dependencies }) => {
      dependencies.forEach((dependency) => {
        acc.annotations += dependency.annotations.length;
        acc.conditions += dependency.conditions.length;
        acc.validations += dependency.validations.length;
      });

      return acc;
    },
    { annotations: 0, conditions: 0, validations: 0 }
  );

  if (pass === 'annotations') {
    return summary.annotations > 0;
  }

  if (pass === 'conditions') {
    return summary.annotations > 0 || summary.conditions > 0;
  }

  return false;
};

const getChangedDataByMaxPathLength = (
  data: ChangedDataByPathLength
): Set<string> | undefined => {
  let maxLength = -1;
  for (const [length, changedData] of data) {
    if (length > maxLength && changedData.size > 0) {
      maxLength = length;
    }
  }

  const changedData = data.get(maxLength);
  if (!changedData) {
    return undefined;
  }
  return changedData;
};

const needsAnotherPassDueToUnprocessedData = (
  data: ChangedDataByPathLength
) => {
  for (const changedData of data.values()) {
    if (changedData.size > 0) {
      return true;
    }
  }

  return false;
};

const processChangedData = (
  processingContext: ProcessingContext<any, any, any>,
  unprocessedContext: UnprocessedContext<any>,
  pass: Definitions
) => {
  while (true) {
    const changedData = getChangedDataByMaxPathLength(
      unprocessedContext.changedData[pass]
    );

    if (!changedData) {
      break;
    }

    processChangedFields(
      processingContext,
      pass,
      'internal',
      Array.from(changedData).map((path) => strPathToArray(path))
    );

    changedData.clear();

    // only process one set of changed data for annotations and conditions, but process all changed
    // data for validations because we never have to process another pass for validations
    if (pass !== 'validations') {
      break;
    }
  }

  processChangedFields(
    processingContext,
    pass,
    'external',
    Array.from(unprocessedContext.changedExternalData[pass])
  );

  processArraysWithChangedLength(
    processingContext,
    pass,
    'internal',
    Array.from(unprocessedContext.arraysWithRemovedData[pass])
  );

  processArraysWithChangedLength(
    processingContext,
    pass,
    'external',
    Array.from(unprocessedContext.externalArraysWithRemovedData[pass])
  );

  processChangedAnnotations(
    processingContext,
    pass,
    unprocessedContext.changedAnnotations[pass]
  );

  unprocessedContext.changedExternalData[pass].clear();
  unprocessedContext.arraysWithRemovedData[pass].clear();
  unprocessedContext.externalArraysWithRemovedData[pass].clear();
  unprocessedContext.changedAnnotations[pass] = [];
};

const processModelChangesPass = <Data, ExternalData, ErrorType>(
  context: ModelValidationContext<Data, ExternalData, ErrorType>,
  processingContext: ProcessingContext<Data, ExternalData, ErrorType>,
  unprocessedContext: UnprocessedContext<ErrorType>,
  pass: 'annotations' | 'conditions' | 'validations',
  data: Data,
  isEqualFn: CompareFn
): ProcessPassResult<Data> => {
  unprocessedContext.newDefinitions[pass].forEach(
    ({ pathToDefinition, indices }) => {
      processModelRecursively(
        processingContext,
        pass,
        pathToDefinition,
        indices
      );
    }
  );

  unprocessedContext.newDefinitions[pass] = [];

  processChangedData(processingContext, unprocessedContext, pass);

  // validations can never cause cascading changes
  if (pass === 'validations') {
    return {
      needsAnotherPass: false
    };
  }

  // update any new computed fields and re-run the loop
  updateContextDataAndChangedAnnotations(context, processingContext);

  const changedAnnotations = getChangedAnnotations(processingContext);

  unprocessedContext.changedAnnotations.annotations.push(...changedAnnotations);
  unprocessedContext.changedAnnotations.conditions.push(...changedAnnotations);
  unprocessedContext.changedAnnotations.validations.push(...changedAnnotations);

  // at this point we have copied the changed annotations to the validation context for notifying later on
  // as well as updated computed values, let's clear the changed annotations so we don't re-process them later
  processingContext.changedAnnotationsCache.clear();

  const isAnotherPassNeededDueToAnnotationChange = needsAnotherPassDueToAnnotationChange(
    pass,
    changedAnnotations
  );

  const isAnotherPassNeededDueToComputedDataChange = !isEqualFn(
    processingContext.data,
    data
  );

  const isAnotherPassNeededDueToUnprocessedData = needsAnotherPassDueToUnprocessedData(
    unprocessedContext.changedData[pass]
  );

  const needsAnotherPass =
    isAnotherPassNeededDueToAnnotationChange ||
    isAnotherPassNeededDueToComputedDataChange ||
    isAnotherPassNeededDueToUnprocessedData;

  if (needsAnotherPass) {
    // we don't need a new processing context if we're only processing unprocessed changed paths
    const needsNewProcessingContext =
      isAnotherPassNeededDueToAnnotationChange ||
      isAnotherPassNeededDueToComputedDataChange;

    return {
      needsAnotherPass: true,
      needsNewProcessingContext,
      data: processingContext.data
    };
  } else {
    return { needsAnotherPass: false };
  }
};

const MAX_PATH_LENGTH = 50;

const createChangedDataByPathLengthMap = (): ChangedDataByPathLength => {
  const map = new Map<number, Set<string>>();
  for (let i = 0; i <= MAX_PATH_LENGTH; i++) {
    map.set(i, new Set());
  }
  return map;
};

/**
 * processModelChanges are called by both the initial validation and incremental validation.
 *
 * For initial validation we call this after processing annotations & conditions to process
 * any consequent changes in case of computed values or annotation changes caused cascading
 * changes. This is called after annotation pass with stopAfter = 'annotations' and after
 * conditions pass with stopAfter = 'conditions'.
 *
 * For incremental updates this is always called with stopAfter = 'validations', which always
 * does the full processing.
 */
export const processModelChanges = <Data, ExternalData, ErrorType>(
  context: ModelValidationContext<Data, ExternalData, ErrorType>,
  processingContext:
    | ProcessingContext<Data, ExternalData, ErrorType>
    | undefined,
  stopAfter: 'annotations' | 'conditions' | 'validations',
  isInitialValidation: boolean,
  data: Data,
  externalData: ExternalData,
  isEqualFn: CompareFn
): ProcessingContext<Data, ExternalData, ErrorType> => {
  const previousDataAtStartOfUpdate = isInitialValidation
    ? undefined
    : context.previousData;
  const previousExternalDataAtStartOfUpdate = isInitialValidation
    ? undefined
    : context.previousExternalData;

  const unprocessedContext: UnprocessedContext<ErrorType> = {
    changedData: {
      annotations: createChangedDataByPathLengthMap(),
      conditions: createChangedDataByPathLengthMap(),
      validations: createChangedDataByPathLengthMap()
    },
    changedExternalData: {
      annotations: new Set(),
      conditions: new Set(),
      validations: new Set()
    },
    arraysWithRemovedData: {
      annotations: new Set(),
      conditions: new Set(),
      validations: new Set()
    },
    externalArraysWithRemovedData: {
      annotations: new Set(),
      conditions: new Set(),
      validations: new Set()
    },
    changedAnnotations: {
      annotations: [],
      conditions: [],
      validations: []
    },
    newDefinitions: {
      annotations: [],
      conditions: [],
      validations: []
    }
  };

  /**
   * External data cannot change between passes, so we only need to check for changes at the start
   */
  const {
    changedFields: changedExternalData,
    arraysWithChangedLength: externalArraysWithChangedLength
  } = getChangedData({
    newData: externalData,
    oldData: context.previousExternalData,
    type: 'external',
    fieldsWithDependencies: context.model.fieldsWithDependencies,
    includeFieldsWithoutDependencies: true,
    changesFor: stopAfter,
    isEqualFn
  });

  changedExternalData.forEach((changedField) => {
    unprocessedContext.changedExternalData.annotations.add(changedField);
    unprocessedContext.changedExternalData.conditions.add(changedField);
    unprocessedContext.changedExternalData.validations.add(changedField);
  });

  const resetProcessingContext = () => {
    return createProcessingContext({
      context,
      isInitialValidation,
      data,
      previousDataAtStartOfUpdate,
      previousExternalDataAtStartOfUpdate,
      externalData,
      isEqualFn
    });
  };

  if (processingContext) {
    const changedAnnotations = getChangedAnnotations(processingContext);

    unprocessedContext.changedAnnotations.annotations.push(
      ...changedAnnotations
    );
    unprocessedContext.changedAnnotations.conditions.push(
      ...changedAnnotations
    );
    unprocessedContext.changedAnnotations.validations.push(
      ...changedAnnotations
    );
  }

  // after we have copied changed annotations from initial processing context, create a new one
  processingContext = resetProcessingContext();

  const unprocessedValidationsForConditons: UnprocessedValidationsForCondition[] = [];

  let pass = 0;

  while (true) {
    /**
     * The only time we want to include fields without dependencies is:
     * - When we are running incremental update (isInitialValidation = false)
     * AND
     * - When we're running the first pass (pass = 0)
     */
    const isFirstPass = pass === 0;
    const includeFieldsWithoutDependencies =
      isFirstPass && !isInitialValidation;

    pass += 1;

    // If there are too many cascading changes bail out to avoid infinite loops
    if (pass === 200) {
      throw new Error(
        'Too many cascading changes in model, this probably means you have cyclical computed data in your model'
      );
    }

    const {
      changedFields: changedData,
      arraysWithChangedLength
    } = getChangedData({
      newData: data,
      oldData: context.previousData,
      type: 'internal',
      fieldsWithDependencies: context.model.fieldsWithDependencies,
      includeFieldsWithoutDependencies,
      changesFor: stopAfter,
      isEqualFn
    });

    changedData.forEach((changedField) => {
      const fieldStr = dataPathToStr(changedField);
      const pathLength = changedField.length;
      if (pathLength > MAX_PATH_LENGTH) {
        throw new Error(`Only paths up to ${MAX_PATH_LENGTH} are supported`);
      }
      unprocessedContext.changedData.annotations.get(pathLength)?.add(fieldStr);
      unprocessedContext.changedData.conditions.get(pathLength)?.add(fieldStr);
      unprocessedContext.changedData.validations.get(pathLength)?.add(fieldStr);
    });

    arraysWithChangedLength.forEach((arrayPath) => {
      unprocessedContext.arraysWithRemovedData.annotations.add(arrayPath);
      unprocessedContext.arraysWithRemovedData.conditions.add(arrayPath);
      unprocessedContext.arraysWithRemovedData.validations.add(arrayPath);
    });

    externalArraysWithChangedLength.forEach((arrayPath) => {
      unprocessedContext.externalArraysWithRemovedData.annotations.add(
        arrayPath
      );
      unprocessedContext.externalArraysWithRemovedData.conditions.add(
        arrayPath
      );
      unprocessedContext.externalArraysWithRemovedData.validations.add(
        arrayPath
      );
    });

    // We always want to update model caches at start of a pass, because it is possible that earlier computed values change
    // created new dynamic data (like arrays) to the data, which won't yet have caches created for them.
    // TODO:
    // This could be optimized in future to not do the full recursion of the definitions. It's still quite fast as it is
    // because we only dive into changed paths.
    const newDefinitions: NewDefinition<ErrorType>[] = [];

    updateModelCaches(
      processingContext,
      [context.model.modelDefinition],
      context.previousData,
      {},
      true,
      newDefinitions
    );

    unprocessedContext.newDefinitions.annotations.push(...newDefinitions);
    unprocessedContext.newDefinitions.conditions.push(...newDefinitions);
    unprocessedContext.newDefinitions.validations.push(...newDefinitions);

    const annotationPassResult = processModelChangesPass(
      context,
      processingContext,
      unprocessedContext,
      'annotations',
      data,
      isEqualFn
    );

    if (annotationPassResult.needsAnotherPass) {
      data = annotationPassResult.data;
      if (annotationPassResult.needsNewProcessingContext) {
        processingContext = resetProcessingContext();
      }
      continue;
    }

    if (stopAfter === 'annotations') {
      return processingContext;
    }

    const conditionPassResult = processModelChangesPass(
      context,
      processingContext,
      unprocessedContext,
      'conditions',
      data,
      isEqualFn
    );

    /**
     * We want to run the unprocessed validations as a very last thing.
     * In case some computed values have updated, we'll jump to the start of the loop
     * and create a new processing context, so we want to save these for later on.
     */
    unprocessedValidationsForConditons.push(
      ...processingContext.unprocessedValidationsForConditons
    );

    if (conditionPassResult.needsAnotherPass) {
      data = conditionPassResult.data;
      if (conditionPassResult.needsNewProcessingContext) {
        processingContext = resetProcessingContext();
      }
      continue;
    }

    if (stopAfter === 'conditions') {
      return processingContext;
    }

    processModelChangesPass(
      context,
      processingContext,
      unprocessedContext,
      'validations',
      data,
      isEqualFn
    );

    // as the very last thing we want to process any validations for conditions that changed from inactive to active.
    for (const {
      pathToCondition,
      indices
    } of unprocessedValidationsForConditons) {
      processModelRecursively(
        processingContext,
        'validations',
        pathToCondition,
        indices
      );
    }

    return processingContext;
  }
};
