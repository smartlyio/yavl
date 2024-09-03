import { AnnotateDefinition } from '../types';
import { ProcessingContext } from './types';
import processDependenciesRecursively from '../utils/processDependenciesRecursively';
import modelPathToStr from '../utils/modelPathToStr';
import processDependentPermutations from './processDependentPermutations';
import processAnnotation from './processAnnotation';

// TODO: should we also figure out do we have a computed field as a dependency here?
export const processAnnotationDependencies = <Data, ExternalData, ErrorType>(
  processingContext: ProcessingContext<Data, ExternalData, ErrorType>,
  annotateDefinition: AnnotateDefinition,
  currentIndices: Record<string, number>,
): void => {
  processDependenciesRecursively(annotateDefinition.value, dependency => {
    const { type, pathToField } = dependency;
    const lastPathPart = pathToField[pathToField.length - 1];
    if (lastPathPart?.type === 'annotation') {
      const modelPathToField = modelPathToStr(
        type,
        pathToField.slice(0, -1), // remove the annotation part
      );

      const annotationDependencies = processingContext.fieldDependencyCache[modelPathToField];

      annotationDependencies?.annotations.forEach(dependentAnnotation => {
        if (dependentAnnotation.isDependencyOfValue) {
          return;
        }

        if (dependentAnnotation.definition.annotation !== lastPathPart.annotation) {
          return;
        }

        // TODO: should this use the processDependencyPermutations from processChangedDependency.ts?
        processDependentPermutations(
          dependentAnnotation.parentDefinitions,
          processingContext.data,
          currentIndices,
          indexPermutation => {
            processAnnotation(
              processingContext,
              dependentAnnotation.definition,
              dependentAnnotation.parentDefinitions,
              indexPermutation,
            );
          },
        );
      });
    }
  });
};
