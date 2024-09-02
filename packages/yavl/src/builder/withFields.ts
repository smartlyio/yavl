import { ModelContext, SupportedDefinition, MaybeField, KeysOfUnion, ContextType } from '../types';

type ObjectOfModelContexts<T, K> = {
  [P in K & KeysOfUnion<T>]: ModelContext<MaybeField<T, P>>;
};

export type ModelDefinitionFnWithMultipleContexts<
  FieldTypes extends Record<string, ModelContext<unknown>>,
  ErrorType
> = (fields: FieldTypes) => SupportedDefinition<ErrorType>;

export interface WithFieldsFn<ErrorType = string> {
  <
    Context extends ModelContext<Record<string, unknown> | undefined>,
    K extends KeysOfUnion<Extract<ContextType<Context>, Record<string, unknown>>> & string
  >(
    parentContext: Context,
    fields: K[],
    modelDefinitionFn: ModelDefinitionFnWithMultipleContexts<ObjectOfModelContexts<ContextType<Context>, K>, ErrorType>,
  ): SupportedDefinition<ErrorType>;
}

const withFields: WithFieldsFn<any> = (
  parentContext: ModelContext<any>,
  fields: string[],
  modelDefinitionFn: ModelDefinitionFnWithMultipleContexts<any, any>,
): SupportedDefinition<any> => {
  const fieldContexts: Record<string, ModelContext<any>> = Object.fromEntries(
    fields.map(name => [
      name,
      {
        type: parentContext.type,
        pathToField: parentContext.pathToField.concat({ type: 'field', name }),
      },
    ]),
  );

  const definitions = modelDefinitionFn(fieldContexts);

  return definitions;
};

export default withFields;
