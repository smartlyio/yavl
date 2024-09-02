import { Annotation } from './types';
import { ModelValidationContext } from './validate/types';
import getIndicesFromStrPath from './utils/getIndicesFromStrPath';
import { getIsPathActive } from './validate/getIsPathActive';

type HasFieldAnnotationsOptions = {
  includeInactive: boolean;
};

interface HasFieldAnnotationsFn {
  // hasFieldAnnotation(validationContext, 'list[0].value', annotation)
  (
    context: ModelValidationContext<any, any, any>,
    field: string,
    annotation: Annotation<unknown>,
    options?: HasFieldAnnotationsOptions,
  ): boolean;
}

const hasFieldAnnotation: HasFieldAnnotationsFn = (
  context,
  field,
  annotation,
  opts = { includeInactive: false },
): boolean => {
  // TODO: we should consider all [current] and [\d] permutations if we want to support
  // adding annotations to specific index with "annotate(dep(array, 0), ...)", we already have
  // a function that does this: getDependencyPathPermutations
  const modelField = field.replace(/\[\d+\]/g, '[current]');
  const fieldCache = context.model.fieldDependencyCache[`internal:${modelField}`];

  if (!fieldCache || fieldCache.annotations.length === 0) {
    return false;
  }

  const indices = getIndicesFromStrPath(field);

  return fieldCache.annotations.some(fieldAnnotation => {
    if (fieldAnnotation.definition.annotation !== annotation) {
      return false;
    }

    const isPathActive = getIsPathActive(context.cache, fieldAnnotation.parentDefinitions, indices);

    // if the path is not active, do early return unless includeInactive is set
    if (!isPathActive && !opts.includeInactive) {
      return false;
    }

    return true;
  });
};

export default hasFieldAnnotation;
