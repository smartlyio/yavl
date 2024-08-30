import {
  AnyContext,
  ModelDefinitionFn,
  ModelDefinitionFnWithNoArg,
  SameContextOfType
} from '../types';

export type WhenModelDefinitionFn<
  Data,
  NarrowedType,
  ErrorType
> = Data extends AnyContext<any>
  ? ModelDefinitionFn<SameContextOfType<Data, NarrowedType>, ErrorType>
  : ModelDefinitionFnWithNoArg<ErrorType>;

export type IsTypeNarrowed<
  Data,
  NarrowedType extends Data,
  TrueType,
  FalseType
> = Data extends NarrowedType ? FalseType : TrueType;
