import { RecursiveDefinition, DefinitionWithContext, PathToField } from '../types';

const findClosestArrayFromDefinitions = (definitions: readonly RecursiveDefinition<any>[]): PathToField => {
  const closestArray = definitions.findLast(definition => definition.type === 'array') as
    | DefinitionWithContext<any>
    | undefined;

  return closestArray ? closestArray.context.pathToField : [];
};

export default findClosestArrayFromDefinitions;
