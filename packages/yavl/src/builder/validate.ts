import {
  ValidateDefinitionInput,
  ValidatorFnWithoutDependencies,
  ValidatorFnWithDependencies,
  ModelContext,
  NoInfer,
  OptionallyArray,
  SupportedDefinition
} from '../types';
import { ExtractDependencies } from './dependency';
import validator from './validator';

export interface ValidateFn<
  FormData = unknown,
  ExternalData = unknown,
  ErrorType = string
> {
  <ContextType>(
    context: ModelContext<ContextType>,
    validatorFn: OptionallyArray<
      ValidatorFnWithoutDependencies<
        NoInfer<ContextType>,
        FormData,
        ExternalData,
        ErrorType | readonly ErrorType[] | undefined
      >
    >
  ): SupportedDefinition<ErrorType>;

  <ContextType, Dependencies>(
    context: ModelContext<ContextType>,
    dependencies: Dependencies,
    validatorFn: OptionallyArray<
      ValidatorFnWithDependencies<
        NoInfer<ContextType>,
        ExtractDependencies<Dependencies>,
        FormData,
        ExternalData,
        ErrorType | readonly ErrorType[] | undefined
      >
    >
  ): SupportedDefinition<ErrorType>;

  <ContextType>(
    context: ModelContext<ContextType>,
    testFn: ValidatorFnWithoutDependencies<
      NoInfer<ContextType>,
      FormData,
      ExternalData,
      boolean
    >,
    error:
      | ErrorType
      | readonly ErrorType[]
      | ValidatorFnWithoutDependencies<
          NoInfer<ContextType>,
          FormData,
          ExternalData,
          ErrorType | readonly ErrorType[]
        >
  ): SupportedDefinition<ErrorType>;

  <ContextType, Dependencies>(
    context: ModelContext<ContextType>,
    dependencies: Dependencies,
    testFn: ValidatorFnWithDependencies<
      NoInfer<ContextType>,
      ExtractDependencies<Dependencies>,
      FormData,
      ExternalData,
      boolean
    >,
    error:
      | ErrorType
      | readonly ErrorType[]
      | ValidatorFnWithDependencies<
          NoInfer<ContextType>,
          ExtractDependencies<Dependencies>,
          FormData,
          ExternalData,
          ErrorType | readonly ErrorType[]
        >
  ): SupportedDefinition<ErrorType>;
}

type Args = {
  context: ModelContext<any>;
  dependencies?: any;
  validators: ReadonlyArray<(...args: any[]) => any>;
};

const getArgs = (args: any[]): Args => {
  if (args.length === 4) {
    return {
      context: args[0],
      dependencies: args[1],
      validators: [validator(args[2], args[3])]
    };
  } else if (args.length === 3) {
    if (typeof args[1] === 'function') {
      return {
        context: args[0],
        dependencies: undefined,
        validators: [validator(args[1], args[2])]
      };
    } else {
      return {
        context: args[0],
        dependencies: args[1],
        validators: Array.isArray(args[2]) ? args[2] : [args[2]]
      };
    }
  } else {
    return {
      context: args[0],
      dependencies: undefined,
      validators: Array.isArray(args[1]) ? args[1] : [args[1]]
    };
  }
};

const validate: ValidateFn<any, any, any> = (
  ...args: any[]
): ValidateDefinitionInput<any> => {
  const { context, dependencies, validators } = getArgs(args);

  return {
    type: 'validate',
    context,
    dependencies,
    validators
  };
};

export default validate;
