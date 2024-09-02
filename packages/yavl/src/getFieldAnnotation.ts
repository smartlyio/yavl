import { Annotation, noValue } from './types';
import { ModelValidationContext } from './validate/types';
import getFieldAnnotations from './getFieldAnnotations';

interface GetFieldAnnotationFn {
  <Value>(context: ModelValidationContext<any, any, any>, field: string, annotation: Annotation<Value>): Value;

  <Value, DefaultValue>(
    context: ModelValidationContext<any, any, any>,
    field: string,
    annotation: Annotation<Value>,
    defaultValue: DefaultValue,
  ): Value | DefaultValue;
}

const getFieldAnnotation: GetFieldAnnotationFn = <Value, DefaultValue>(
  context: ModelValidationContext<any, any, any>,
  field: string,
  annotation: Annotation<Value>,
  ...rest: [DefaultValue?]
): any => {
  const defaultValue = rest.length > 0 ? (rest[0] as DefaultValue) : noValue;
  const fieldAnnotations = getFieldAnnotations(context, field);

  if (annotation in fieldAnnotations) {
    return fieldAnnotations[annotation];
  } else if (defaultValue !== noValue) {
    return defaultValue;
  } else {
    throw new Error(`Annotation "${annotation.toString()}" not found for ${field}`);
  }
};

export default getFieldAnnotation;
