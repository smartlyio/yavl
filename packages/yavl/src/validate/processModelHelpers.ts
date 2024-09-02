import { CompareFn, ModelValidationContext, ProcessingContext } from './types';
import { getChangedAnnotationsCacheForPath } from './getChangedAnnotationsCacheForPath';

export const createProcessingContext = <Data, ExternalData, ErrorType>({
  context,
  isInitialValidation,
  data,
  externalData,
  previousDataAtStartOfUpdate,
  previousExternalDataAtStartOfUpdate,
  isEqualFn,
}: {
  context: ModelValidationContext<Data, ExternalData, ErrorType>;
  isInitialValidation: boolean;
  data: Data;
  previousDataAtStartOfUpdate: Data | undefined;
  previousExternalDataAtStartOfUpdate: ExternalData | undefined;
  externalData: ExternalData;
  isEqualFn: CompareFn;
}): ProcessingContext<Data, ExternalData, ErrorType> => ({
  isInitialValidation,
  data,
  externalData,
  previousDataAtStartOfUpdate,
  previousExternalDataAtStartOfUpdate,
  dataAtStartOfPass: data,
  validateDiffCache: context.cache,
  resolvedAnnotations: context.resolvedAnnotations,
  resolvedValidations: context.resolvedValidations,
  annotationBeingResolved: undefined,
  fieldDependencyCache: context.model.fieldDependencyCache,
  fieldProcessingCache: {},
  changedAnnotationsCache: new Map(),
  unprocessedValidationsForConditons: [],
  isEqualFn,
});

export const updateContextDataAndChangedAnnotations = <Data, ExternalData, ErrorType>(
  context: ModelValidationContext<Data, ExternalData, ErrorType>,
  processingContext: ProcessingContext<Data, ExternalData, ErrorType>,
): void => {
  context.previousData = processingContext.dataAtStartOfPass;
  context.previousExternalData = processingContext.externalData;

  processingContext.changedAnnotationsCache.forEach((annotations, field) => {
    const pendingAnnotationsForField = getChangedAnnotationsCacheForPath(context.pendingChangedAnnotations, field);

    annotations.forEach(annotation => {
      pendingAnnotationsForField.add(annotation);
    });
  });
};
