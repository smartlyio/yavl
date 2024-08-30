import { ChangedAnnotationsDependency, ProcessingContext } from './types';
import getIndicesFromStrPath from '../utils/getIndicesFromStrPath';
import { processChangedDependency } from './processChangedDependency';
import { isClosestArrayDeleted } from './isClosestArrayDeleted';

export const processChangedAnnotations = <Data, ExternalData, ErrorType>(
  processingContext: ProcessingContext<Data, ExternalData, ErrorType>,
  pass: 'annotations' | 'conditions' | 'validations',
  changedAnnotations: ChangedAnnotationsDependency[]
): void => {
  changedAnnotations.forEach(({ field, dependencies }) => {
    // don't process changed annotations of deleted array items
    const isDeleted = isClosestArrayDeleted(processingContext.data, field);
    if (isDeleted) {
      return;
    }
    const indices = getIndicesFromStrPath(field);

    dependencies.forEach((dependency) => {
      processChangedDependency(
        processingContext,
        pass,
        'internal',
        dependency,
        indices
      );
    });
  });
};
