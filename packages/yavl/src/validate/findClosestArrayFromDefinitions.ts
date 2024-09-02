import * as R from 'ramda';
import { RecursiveDefinition, DefinitionWithContext, PathToField } from '../types';

const findClosestArrayFromDefinitions = (definitions: readonly RecursiveDefinition<any>[]): PathToField => {
  const closestArray = R.findLast(definition => definition.type === 'array', definitions) as
    | DefinitionWithContext<any>
    | undefined;

  return closestArray ? closestArray.context.pathToField : [];
};

export default findClosestArrayFromDefinitions;
