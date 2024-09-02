import {
  ModelContext,
  Annotation,
  NonExtensibleModelContext,
  ArrayModelContext,
  NonExtensibleArrayModelContext,
} from '../types';
import isAnyArrayModelContext from '../utils/isAnyArrayModelContext';

// TODO: add support for annotations on array.all deps
export interface AnnotationFn {
  <Type>(context: ModelContext<any>, annotation: Annotation<Type>): NonExtensibleModelContext<Type>;

  <Type>(context: ArrayModelContext<any>, annotation: Annotation<Type>): NonExtensibleArrayModelContext<Type>;

  <Type, DefaultValue>(
    context: ModelContext<any>,
    annotation: Annotation<Type>,
    defaultValue: DefaultValue,
  ): NonExtensibleModelContext<Type | DefaultValue>;

  <Type, DefaultValue>(
    context: ArrayModelContext<any>,
    annotation: Annotation<Type>,
    defaultValue: DefaultValue,
  ): NonExtensibleArrayModelContext<Type | DefaultValue>;
}

const annotation: AnnotationFn = (
  context: ModelContext<any> | ArrayModelContext<any>,
  annotation: Annotation<any>,
  ...rest: any[]
): any => {
  const multiFocus = isAnyArrayModelContext(context);
  const annotationContext: NonExtensibleModelContext<any> | NonExtensibleArrayModelContext<any> = {
    type: context.type,
    multiFocus,
    nonExtensible: true,
    pathToField: context.pathToField.concat({
      type: 'annotation',
      annotation,
      defaultValue: rest.length > 0 ? { hasValue: true, value: rest[0] } : { hasValue: false },
    }),
  };

  return annotationContext;
};

export default annotation;
