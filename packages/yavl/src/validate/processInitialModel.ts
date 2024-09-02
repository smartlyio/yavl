import { CompareFn, ModelValidationContext } from './types';
import { processModelRecursively } from './processModelRecursively';
import { updateModelCaches } from './updateModelCaches';
import { processModelChanges } from './processModelChanges';
import { createProcessingContext, updateContextDataAndChangedAnnotations } from './processModelHelpers';

export const processInitialModel = <Data, ExternalData = undefined, ErrorType = string>(
  context: ModelValidationContext<Data, ExternalData, ErrorType>,
  data: Data,
  externalData: ExternalData,
  isEqualFn: CompareFn = Object.is,
): void => {
  const model = context.model;
  const isInitialValidation = true;

  /**
   * Reset resolvedAnnotations to an empty object. It is possible that someone
   * has called eg. getAllAnnotations() after createValidationContext() but before
   * updateModel(), in which case we've already exposed context.resolvedAnnotations.current
   * to an outside calling code. For the initial model update we use a mutating update
   * for resolved annotations, because using R.assoc/R.assocPath can be really slow if
   * you have large initial data with lots of annotations.
   */
  context.resolvedAnnotations.current = {};

  let processingContext = createProcessingContext({
    context,
    isInitialValidation,
    data,
    previousDataAtStartOfUpdate: undefined,
    previousExternalDataAtStartOfUpdate: undefined,
    externalData,
    isEqualFn,
  });

  updateModelCaches(processingContext, [model.modelDefinition], context.previousData, {}, false);

  processModelRecursively(processingContext, 'annotations', [model.modelDefinition], {});

  {
    // update any new computed fields and re-run the loop
    updateContextDataAndChangedAnnotations(context, processingContext);

    if (!isEqualFn(processingContext.data, data) || processingContext.changedAnnotationsCache.size > 0) {
      processingContext = processModelChanges(
        context,
        processingContext,
        'annotations',
        isInitialValidation,
        processingContext.data,
        externalData,
        isEqualFn,
      );
    }
  }

  processModelRecursively(processingContext, 'conditions', [model.modelDefinition], {});

  // update any new computed fields and re-run the loop
  updateContextDataAndChangedAnnotations(context, processingContext);

  if (!isEqualFn(processingContext.data, data) || processingContext.changedAnnotationsCache.size > 0) {
    processingContext = processModelChanges(
      context,
      processingContext,
      'conditions',
      isInitialValidation,
      processingContext.data,
      externalData,
      isEqualFn,
    );
  }

  processModelRecursively(processingContext, 'validations', [model.modelDefinition], {});
};
