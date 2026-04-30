import { RecursiveDefinition } from '../types';
import { ProcessingContext } from './types';
import resolveDependency from './resolveDependency';
import processValidation from './processValidation';
import processCondition from './processCondition';
import resolveModelPathStr from './resolveModelPathStr';
import processAnnotation from './processAnnotation';
import { getIsPathActive } from './getIsPathActive';
import getProcessingCacheForField from './getProcessingCacheForField';

export const processModelRecursively = <Data, ExternalData, ErrorType>(
  processingContext: ProcessingContext<Data, ExternalData, ErrorType>,
  pass: 'annotations' | 'conditions' | 'validations',
  pathToCurrentDefinition: RecursiveDefinition<ErrorType>[],
  currentIndices: Record<string, number>,
): void => {
  const currentDefinition = pathToCurrentDefinition[pathToCurrentDefinition.length - 1]!;

  currentDefinition.children.forEach(childDefinition => {
    if (childDefinition.type === 'annotation' && pass === 'annotations') {
      processAnnotation(processingContext, childDefinition, pathToCurrentDefinition, currentIndices);
    }

    // processCondition will continue recursing if needed
    if (childDefinition.type === 'when') {
      if (pass === 'conditions') {
        // for conditions pass process the condition
        processCondition(
          processingContext,
          childDefinition,
          pathToCurrentDefinition,
          true, // isNewCondition = true
          currentIndices,
        );
      } else if (pass === 'annotations') {
        pathToCurrentDefinition.push(childDefinition);
        processModelRecursively(processingContext, pass, pathToCurrentDefinition, currentIndices);
        pathToCurrentDefinition.pop();
      } else if (pass === 'validations') {
        pathToCurrentDefinition.push(childDefinition);
        const isPathActive = getIsPathActive(
          processingContext.validateDiffCache,
          pathToCurrentDefinition,
          currentIndices,
        );

        if (isPathActive) {
          processModelRecursively(processingContext, pass, pathToCurrentDefinition, currentIndices);
        }
        pathToCurrentDefinition.pop();
      }
    }

    if (childDefinition.type === 'validate' && pass === 'validations') {
      processValidation(processingContext, childDefinition, pathToCurrentDefinition, currentIndices);
    }

    if (childDefinition.type === 'array') {
      const parentPath = childDefinition.context.pathToField.slice(0, -1);
      const pathToArrayStr = resolveModelPathStr(parentPath, currentIndices);
      const runCacheForField = getProcessingCacheForField(processingContext.fieldProcessingCache, pathToArrayStr);

      const newParentArray: any[] | undefined = resolveDependency(
        processingContext,
        'internal',
        parentPath,
        currentIndices,
        runCacheForField,
      );

      if (!Array.isArray(newParentArray)) {
        return;
      }

      // Mutate pathToCurrentDefinition and currentIndices in place to avoid per-iteration
      // allocations. try/finally guarantees cleanup after the loop.
      pathToCurrentDefinition.push(childDefinition);
      try {
        newParentArray.forEach((_, idx) => {
          currentIndices[pathToArrayStr] = idx;
          processModelRecursively(processingContext, pass, pathToCurrentDefinition, currentIndices);
        });
      } finally {
        delete currentIndices[pathToArrayStr];
        pathToCurrentDefinition.pop();
      }
    }
  });
};
