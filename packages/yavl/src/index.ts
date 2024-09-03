import { ModelDefinitionFn, ModelDefinitionFnWithNoArg, SupportedDefinition } from './types';

export { default as model } from './model';
export { default as createValidationContext } from './validate/createValidationContext';
export { default as updateModel } from './validate/updateModel';
export { default as validateModel } from './validate/validateModel';
export { default as getAllAnnotations } from './getAllAnnotations';
export { default as getFieldsWithAnnotations } from './getFieldsWithAnnotations';
export { default as getFieldAnnotations } from './getFieldAnnotations';
export { default as getFieldAnnotation } from './getFieldAnnotation';
export { default as hasFieldAnnotation } from './hasFieldAnnotation';
export { default as array } from './builder/array';
export { createAnnotation, annotations } from './annotations';
export { default as subscribeToFieldAnnotation } from './subscribeToFieldAnnotation';
export { default as getValidationErrors } from './validate/getValidationErrors';
export { getModelData } from './validate/getModelData';
export { getExternalData } from './validate/getExternalData';
export { transaction } from './transaction';
export { getAnnotationValue } from './getAnnotationValue';
export { subscribeToAnnotations } from './subscribeToAnnotations';
export { default as isModelContext } from './utils/isModelContext';
export { noValue } from './types';

export type WhenFn<If = never, Else = never, ErrorType = string> = (
  ifFn: [If] extends [never] ? ModelDefinitionFnWithNoArg<ErrorType> : ModelDefinitionFn<If, ErrorType>,
  elseFn?: [Else] extends [never] ? ModelDefinitionFnWithNoArg<ErrorType> : ModelDefinitionFn<Else, ErrorType>,
) => SupportedDefinition<ErrorType>[];

export type { ModelBuilder } from './model';
export type {
  Model,
  ModelContext,
  ExternalModelContext,
  ArrayModelContext,
  ExternalArrayModelContext,
  ComputedContext,
  AnyContext,
  AnySingleContext,
  AnyModelContext,
  AnySingleModelContext,
  AnyArrayModelContext,
  SupportedDefinition,
  ModelDefinitionFn,
  ModelDefinitionFnWithNoArg,
  Annotation,
  ValueOrContextOfType,
  ContextType,
  SameContextOfType,
  AnnotationData,
  AnnotationsSubscriptionFilters,
  AnnotationsSubscriptionValue,
  NoValue,
} from './types';
export type { ModelValidationContext, ModelValidationErrors, CompareFn } from './validate/types';
export type { FieldFn } from './builder/field';
export type { ArrayFn } from './builder/array';
export type { RequiredFn } from './builder/required';
export type { OptionalFn } from './builder/optional';
export type { ValidateFn } from './builder/validate';
export type { ExtractDependencies } from './builder/dependency';
