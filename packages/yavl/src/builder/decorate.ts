import { SupportedDefinition } from '../types';

type AnyModelFn<ErrorType> = (...args: any[]) => SupportedDefinition<ErrorType>;
type DecoratorFn<ErrorType, ModelFn extends AnyModelFn<ErrorType>> = (
  definitions: SupportedDefinition<ErrorType>,
  ...modelFnArgs: Parameters<ModelFn>
) => SupportedDefinition<ErrorType>;

type GetErrorTypeFromModelFn<ModelFn> = ModelFn extends AnyModelFn<
  infer ErrorType
>
  ? ErrorType
  : never;

export interface DecorateFn {
  <ModelFn extends AnyModelFn<any>>(
    modelFn: ModelFn,
    decorator: DecoratorFn<GetErrorTypeFromModelFn<ModelFn>, ModelFn>
  ): ModelFn;
}

const decorate: DecorateFn = <ModelFn extends AnyModelFn<any>>(
  modelFn: ModelFn,
  decorator: DecoratorFn<any, ModelFn>
): any => {
  return (...args: Parameters<ModelFn>) => {
    const definitions = modelFn(...args);
    return decorator(definitions, ...args);
  };
};

export default decorate;
