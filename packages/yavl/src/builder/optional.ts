import { AnyContext, ContextType, ModelDefinitionFn, SameContextOfType, SupportedDefinition } from '../types';
import when from './when';

export interface OptionalFn<ErrorType = string> {
  <Context extends AnyContext<any>>(
    parentContext: Context,
    modelDefinitionFn: ModelDefinitionFn<
      SameContextOfType<Context, Exclude<ContextType<Context>, undefined>>,
      ErrorType
    >,
  ): SupportedDefinition<ErrorType>;
}

export type MakeOptionalFn<ErrorType> = (testFn: (value: any) => boolean) => OptionalFn<ErrorType>;

const makeOptional: MakeOptionalFn<any> = (testFn: (value: any) => boolean) => (
  ...args: any[]
): SupportedDefinition<any> => {
  const parentContext = args[0];
  const modelDefinitionFn: ModelDefinitionFn<any, any> = args[1];

  return when(parentContext, testFn, modelDefinitionFn);
};

export default makeOptional;
