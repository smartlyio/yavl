import * as R from 'ramda';
import {
  DefinitionListInput,
  DefinitionList,
  ModelContext,
  FlattenedDefinitionListInput,
  ProcessedDefinition,
  OptionallyArray
} from './types';

const processDefinitionList = (
  currentContexts: ModelContext<any>[],
  definitions: DefinitionListInput<any>
): DefinitionList<any> => {
  const flattenedDefinitions = R.flatten(
    definitions
  ) as FlattenedDefinitionListInput<any>;

  const processedDefinitions = flattenedDefinitions.flatMap(
    (definition): OptionallyArray<ProcessedDefinition<any>> => {
      if ('children' in definition) {
        return {
          ...definition,
          children: processDefinitionList(currentContexts, definition.children)
        };
      } else {
        return definition;
      }
    }
  );

  return processedDefinitions;
};

export default processDefinitionList;
