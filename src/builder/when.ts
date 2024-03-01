import {
  ModelDefinitionFn,
  ModelDefinitionFnWithNoArg,
  WhenTestFn,
  SupportedDefinition
} from '../types';
import { ExtractDependencies } from './dependency';
import makeWhen from './makeWhen';
import { IsTypeNarrowed, WhenModelDefinitionFn } from './types';
export interface WhenFn<
  FormData,
  ExternalData = undefined,
  ErrorType = string
> {
  <Data, NarrowedType extends ExtractDependencies<Data>>(
    data: Data,
    testFn: WhenTestFn<
      ExtractDependencies<Data>,
      FormData,
      ExternalData,
      NarrowedType
    >,
    modelDefinitionFn: WhenModelDefinitionFn<Data, NarrowedType, ErrorType>,
    elseModelDefinitionFn?: WhenModelDefinitionFn<
      Data,
      IsTypeNarrowed<
        ExtractDependencies<Data>,
        NarrowedType,
        Exclude<ExtractDependencies<Data>, NarrowedType>,
        NarrowedType
      >,
      ErrorType
    >
  ): SupportedDefinition<ErrorType>[];
}

const when: WhenFn<any, any, any> = (
  data: any,
  testFn: WhenTestFn<any, any, any, any>,
  modelDefinitionFn:
    | ModelDefinitionFn<any, any>
    | ModelDefinitionFnWithNoArg<any>,
  elseModelDefinitionFn?:
    | ModelDefinitionFn<any, any>
    | ModelDefinitionFnWithNoArg<any>
): any => {
  const when = makeWhen(data, testFn);

  // it's impossible for TS to know which version of model definition fn it needs to use
  return when(modelDefinitionFn as any, elseModelDefinitionFn as any);
};

export default when;
