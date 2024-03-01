import { ModelContext, Annotation, SupportedDefinition } from '../types';
import { ExtractDependencies } from './dependency';

type EnsureValueIsOfAnnotationType<
  Value,
  AnnotationType
> = ExtractDependencies<Value> extends AnnotationType ? unknown : never;

export interface AnnotateFn {
  <
    FieldType,
    AnnotationType,
    Value extends EnsureValueIsOfAnnotationType<Value, AnnotationType>
  >(
    context: ModelContext<FieldType>,
    annotation: Annotation<AnnotationType>,
    value: Value
  ): SupportedDefinition;
}

const annotate: AnnotateFn = (
  context: ModelContext<any>,
  annotation: Annotation<any>,
  value: any
): SupportedDefinition => {
  return {
    type: 'annotation',
    context,
    annotation,
    value
  };
};

export default annotate;
