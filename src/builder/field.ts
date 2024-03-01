import {
  ModelContext,
  ModelDefinitionFn,
  MaybeField,
  KeysOfUnion,
  ContextType,
  SupportedDefinition,
  SameContextOfType
} from '../types';

export type FieldFn<ErrorType = string> = <
  Context extends ModelContext<Record<string, unknown> | undefined>,
  Key extends KeysOfUnion<
    Extract<ContextType<Context>, Record<string, unknown>>
  > &
    string
>(
  parentContext: Context,
  name: Key,
  modelDefinitionFn?: ModelDefinitionFn<
    SameContextOfType<Context, MaybeField<ContextType<Context>, Key>>,
    ErrorType
  >
) => SupportedDefinition<ErrorType>;

const field: FieldFn<any> = (
  parentContext: ModelContext<any>,
  name: string,
  modelDefinitionFn?: any
): SupportedDefinition<any> => {
  const context: ModelContext<any> = {
    type: parentContext.type,
    pathToField: parentContext.pathToField.concat({ type: 'field', name })
  };

  const definitions = modelDefinitionFn?.(context) ?? [];

  return definitions;
};

export default field;
