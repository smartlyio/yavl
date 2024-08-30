import { valueAnnotation } from '../annotations';
import {
  ModelContext,
  SupportedDefinition,
  ValueOrContextOfType
} from '../types';
import annotate from './annotate';

export interface ValueFn {
  <FieldType>(
    context: ModelContext<FieldType>,
    value: ValueOrContextOfType<FieldType>
  ): SupportedDefinition;
}

const value: ValueFn = (
  context: ModelContext<any>,
  value: any
): SupportedDefinition => {
  return annotate(
    /**
     * Mark the context as a computed value. This makes sure that the annotation is re-evaluated
     * in processChangedDependency if the context's value is changed outside of the model
     */
    { ...context, isComputedValue: true },
    valueAnnotation,
    value
  );
};

export default value;
