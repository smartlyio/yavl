import { ProcessingContext } from './types';
import getDependencyPathPermutations from '../utils/getDependencyPathPermutations';
import getIndicesFromStrPath from '../utils/getIndicesFromStrPath';
import dataPathToStr from '../utils/dataPathToStr';
import { processChangedDependency } from './processChangedDependency';

export const processArraysWithChangedLength = <Data, ExternalData, ErrorType>(
  processingContext: ProcessingContext<Data, ExternalData, ErrorType>,
  pass: 'annotations' | 'conditions' | 'validations',
  type: 'external' | 'internal',
  arraysWithChangedLength: ReadonlyArray<ReadonlyArray<string | number>>
): void => {
  arraysWithChangedLength.forEach((arrayPath) => {
    // handle array.all dependencies to the array
    const currentIndices = getIndicesFromStrPath(dataPathToStr(arrayPath));
    const dependentPaths = getDependencyPathPermutations(type, arrayPath);
    const dependentPathsWithArrayAll = dependentPaths.map(
      (path) => `${path}[all]`
    );

    // find all fields that depend on this array having items removed
    const fieldDependencies = Object.entries(
      processingContext.fieldDependencyCache
    ).flatMap(([field, dependencies]) => {
      if (!dependencies) {
        return [];
      }
      const fieldMatches = dependentPathsWithArrayAll.some((dependentPath) =>
        field.startsWith(dependentPath)
      );
      if (!fieldMatches) {
        return [];
      }
      return dependencies;
    });

    fieldDependencies.forEach((fieldDependency) => {
      processChangedDependency(
        processingContext,
        pass,
        type,
        fieldDependency,
        currentIndices
      );
    });
  });
};
