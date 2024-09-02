import * as R from 'ramda';
import { WhenDefinitionInput, ModelDefinitionFn, ModelDefinitionFnWithNoArg, WhenTestFn } from '../types';
import { ExtractDependencies } from './dependency';
import { IsTypeNarrowed, WhenModelDefinitionFn } from './types';

export interface MakeWhenFn<FormData, ExternalData = undefined, ErrorType = string> {
  <Data, NarrowedType extends ExtractDependencies<Data>>(
    data: Data,
    testFn: WhenTestFn<ExtractDependencies<Data>, FormData, ExternalData, NarrowedType>,
  ): (
    modelDefinitionFn: IsTypeNarrowed<
      ExtractDependencies<Data>,
      NarrowedType,
      WhenModelDefinitionFn<Data, NarrowedType, ErrorType>,
      ModelDefinitionFnWithNoArg<ErrorType>
    >,
    elseModelDefinitionFn?: IsTypeNarrowed<
      ExtractDependencies<Data>,
      NarrowedType,
      WhenModelDefinitionFn<Data, Exclude<ExtractDependencies<Data>, NarrowedType>, ErrorType>,
      ModelDefinitionFnWithNoArg<ErrorType>
    >,
  ) => WhenDefinitionInput<ErrorType>[];
}

const makeWhen: MakeWhenFn<any, any, any> = (data: any, testFn: WhenTestFn<any, any, any, any>): any => {
  const when = (
    modelDefinitionFn: ModelDefinitionFn<any, any> | ModelDefinitionFnWithNoArg<any>,
    elseModelDefinitionFn?: ModelDefinitionFn<any, any> | ModelDefinitionFnWithNoArg<any>,
  ): WhenDefinitionInput<any>[] => {
    const definitions = modelDefinitionFn(data);

    const whenDefinition: WhenDefinitionInput<any> = {
      type: 'when',
      dependencies: data,
      testFn,
      children: [definitions],
    };

    if (elseModelDefinitionFn) {
      const elseDefinitions = elseModelDefinitionFn(data);

      const elseDefinition: WhenDefinitionInput<any> = {
        type: 'when',
        dependencies: data,
        testFn: R.complement(testFn),
        children: [elseDefinitions],
      };

      return [whenDefinition, elseDefinition];
    } else {
      return [whenDefinition];
    }
  };

  return when;
};

export default makeWhen;
