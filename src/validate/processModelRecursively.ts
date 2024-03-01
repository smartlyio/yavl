import * as R from 'ramda';
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
  currentIndices: Record<string, number>
): void => {
  const currentDefinition = R.last(pathToCurrentDefinition)!;

  currentDefinition.children.forEach((childDefinition) => {
    if (childDefinition.type === 'annotation' && pass === 'annotations') {
      processAnnotation(
        processingContext,
        childDefinition,
        pathToCurrentDefinition,
        currentIndices
      );
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
          currentIndices
        );
      } else if (pass === 'annotations') {
        // for annotations pass we want to always recurse to the child definitions
        // this allows us to process all annotations no matter how deep they are
        processModelRecursively(
          processingContext,
          pass,
          pathToCurrentDefinition.concat(childDefinition),
          currentIndices
        );
      } else if (pass === 'validations') {
        const isPathActive = getIsPathActive(
          processingContext.validateDiffCache,
          pathToCurrentDefinition.concat(childDefinition),
          currentIndices
        );

        if (isPathActive) {
          processModelRecursively(
            processingContext,
            pass,
            pathToCurrentDefinition.concat(childDefinition),
            currentIndices
          );
        }
      }
    }

    if (childDefinition.type === 'validate' && pass === 'validations') {
      processValidation(
        processingContext,
        childDefinition,
        pathToCurrentDefinition,
        currentIndices
      );
    }

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

      if (!Array.isArray(newParentArray)) {
        return;
      }

      const pathToArrayDef = pathToCurrentDefinition.concat(childDefinition);

      newParentArray.forEach((_, idx) => {
        const nextIndices = { ...currentIndices, [pathToArrayStr]: idx };

        processModelRecursively(
          processingContext,
          pass,
          pathToArrayDef,
          nextIndices
        );
      });
    }
  });
};
