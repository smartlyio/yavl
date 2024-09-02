import { ModelContext, ModelDefinitionFn, SupportedDefinition } from '../types';
import annotate from './annotate';
import when from './when';
import validate from './validate';
import validator from './validator';
import { annotations } from '../annotations';

export interface RequiredFn<ErrorType = string> {
  <FieldType>(
    parentContext: ModelContext<FieldType>,
    error: ErrorType,
    modelDefinitionFn?: ModelDefinitionFn<ModelContext<Exclude<FieldType, undefined>>, ErrorType>,
  ): SupportedDefinition<ErrorType>[];
}

export type MakeRequiredFn<ErrorType> = (testFn: (value: any) => boolean) => RequiredFn<ErrorType>;

const makeRequired: MakeRequiredFn<any> = (testFn: (value: any) => boolean) => (
  ...args: any[]
): SupportedDefinition<any>[] => {
  const parentContext: ModelContext<any> = args[0];
  const error: any = args[1];
  const modelDefinitionFn: ModelDefinitionFn<any, any> | undefined = args[2];

  const definitions: SupportedDefinition<any> = [
    annotate(parentContext, annotations.isRequired, true),
    validate(parentContext, parentContext, validator(testFn, error)),
  ];

  if (modelDefinitionFn) {
    return definitions.concat(when(parentContext, testFn, modelDefinitionFn));
  } else {
    return definitions;
  }
};

export default makeRequired;
