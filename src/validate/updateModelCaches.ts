import * as R from 'ramda';
import { Annotation, RecursiveDefinition } from '../types';
import {
  ModelValidationCache,
  NewDefinition,
  ProcessingContext
} from './types';
import resolveDependency from './resolveDependency';
import findErrorCacheEntry, {
  getOrCreateErrorCacheEntry
} from './findErrorCacheEntry';
import resolveModelPathStr from './resolveModelPathStr';
import { removeValidationsForField } from './updateChangedValidation';
import { removeAnnotationForField } from './updateChangedAnnotation';
import getProcessingCacheForField from './getProcessingCacheForField';

type DeletedChildDefinitions = {
  fieldsWithValidations: readonly string[];
  annotations: Array<{
    field: string;
    annotation: Annotation<any>;
  }>;
};

const collectDeletedDefinitions = (
  processingContext: ProcessingContext<any, any, any>,
  cacheEntry: ModelValidationCache<any>,
  fieldsWithValidations: Set<string>,
  annotations: DeletedChildDefinitions['annotations']
): void => {
  cacheEntry.errors.forEach(({ field }) => {
    fieldsWithValidations.add(field);
  });

  cacheEntry.annotations.forEach((fieldAnnotationCache, field) => {
    fieldAnnotationCache.forEach((_, { annotation }) => {
      annotations.push({ field, annotation });
    });
  });

  cacheEntry.children.forEach((childCacheEntry) => {
    // we don't need to care about inactive paths
    if (childCacheEntry.isPathActive) {
      collectDeletedDefinitions(
        processingContext,
        childCacheEntry,
        fieldsWithValidations,
        annotations
      );
    }
  });
};

const getDeletedDefinitions = (
  processingContext: ProcessingContext<any, any, any>,
  cacheEntries: ModelValidationCache<any>[]
): DeletedChildDefinitions => {
  const fieldsWithValidations = new Set<string>();
  const annotations: DeletedChildDefinitions['annotations'] = [];

  cacheEntries.forEach((cacheEntry) => {
    collectDeletedDefinitions(
      processingContext,
      cacheEntry,
      fieldsWithValidations,
      annotations
    );
  });

  return {
    fieldsWithValidations: Array.from(fieldsWithValidations),
    annotations
  };
};

const handleDeletedChildDefinitions = (
  processingContext: ProcessingContext<any, any, any>,
  deletedDefinitions: DeletedChildDefinitions
) => {
  deletedDefinitions.fieldsWithValidations.forEach((field) => {
    removeValidationsForField(processingContext, field);
  });
  deletedDefinitions.annotations.forEach(({ field, annotation }) => {
    removeAnnotationForField(processingContext, field, annotation);
  });
};

export const updateModelCaches = <Data, ExternalData, ErrorType>(
  processingContext: ProcessingContext<Data, ExternalData, ErrorType>,
  pathToCurrentDefinition: RecursiveDefinition<ErrorType>[],
  previousData: Data | undefined,
  currentIndices: Record<string, number>,
  collectNewDefinitions: boolean,
  newDefinitions: NewDefinition<ErrorType>[] = []
): void => {
  const currentDefinition = R.last(pathToCurrentDefinition)!;

  currentDefinition.children.forEach((childDefinition) => {
    // We always need to recurse for conditions, because they might have nested array definitions.
    // If items are deleted from the arrays, we need to clean up all related caches, including ones
    // that are inside conditions. In case the data has not changed for this branch, we can skip
    // the recursion as there's nothing to do in that case.
    if (
      childDefinition.type === 'when' &&
      !processingContext.isEqualFn(processingContext.data, previousData)
    ) {
      updateModelCaches(
        processingContext,
        pathToCurrentDefinition.concat(childDefinition),
        previousData,
        currentIndices,
        collectNewDefinitions,
        newDefinitions
      );
    }

    // TODO: process new array items/deleted items separately for diffed data?
    // If we do it that way, we would not need to recurse through the model
    // for incremental updates.
    if (childDefinition.type === 'array') {
      const parentPath = childDefinition.context.pathToField.slice(0, -1);
      const pathToArrayStr = resolveModelPathStr(
        R.dropLast(1, childDefinition.context.pathToField),
        currentIndices
      );
      const runCacheForField = getProcessingCacheForField(
        processingContext.fieldProcessingCache,
        pathToArrayStr
      );

      const newParentArray: any[] | undefined = resolveDependency(
        processingContext,
        'internal',
        parentPath,
        currentIndices,
        runCacheForField
      );

      const oldParentArray: any[] | undefined = resolveDependency(
        { ...processingContext, data: previousData },
        'internal',
        parentPath,
        currentIndices,
        runCacheForField
      );

      const pathToArrayDef = pathToCurrentDefinition.concat(childDefinition);
      const arrayCache = findErrorCacheEntry(
        processingContext.validateDiffCache,
        pathToArrayDef,
        currentIndices,
        false
      );

      if (!Array.isArray(newParentArray) || newParentArray.length === 0) {
        const deletedDefinitions = getDeletedDefinitions(processingContext, [
          arrayCache
        ]);
        arrayCache.children.clear();
        handleDeletedChildDefinitions(processingContext, deletedDefinitions);
        return;
      }

      if (
        Array.isArray(oldParentArray) &&
        oldParentArray.length > newParentArray.length
      ) {
        /**
         * When items are removed from an array we need to update any affected resolved annotations and validation
         * errors. We do this in two passes, first we gather all the affected caches (before removing them), we then
         * find all affected definitinos from those caches.
         *
         * After that we remove the caches which will remove all the annotations and validation errors, and finally
         * we will update all the resolved annotations and validations based on the deleted definitions we gathered
         * before.
         */
        const cachesToCheck: ModelValidationCache<any>[] = [];

        for (
          let idx = newParentArray.length;
          idx < oldParentArray.length;
          idx += 1
        ) {
          cachesToCheck.push(getOrCreateErrorCacheEntry(arrayCache, idx));
        }

        const deletedDefinitions = getDeletedDefinitions(
          processingContext,
          cachesToCheck
        );

        for (
          let idx = newParentArray.length;
          idx < oldParentArray.length;
          idx += 1
        ) {
          arrayCache.children.delete(idx);
        }

        handleDeletedChildDefinitions(processingContext, deletedDefinitions);
      }

      newParentArray.forEach((_, idx) => {
        const nextIndices = { ...currentIndices, [pathToArrayStr]: idx };

        const isNewArrayElem =
          !Array.isArray(oldParentArray) || idx >= oldParentArray.length;

        if (
          !isNewArrayElem &&
          processingContext.isEqualFn(
            newParentArray[idx],
            oldParentArray?.[idx]
          )
        ) {
          return;
        }

        if (isNewArrayElem && collectNewDefinitions) {
          newDefinitions.push({
            pathToDefinition: pathToArrayDef,
            indices: nextIndices
          });
        }

        updateModelCaches(
          processingContext,
          pathToArrayDef,
          previousData,
          nextIndices,
          collectNewDefinitions && !isNewArrayElem, // only collect definitions for existing paths
          newDefinitions
        );
      });
    }
  });
};
