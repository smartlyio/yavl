import { ProcessingContext } from './types';
import { RecursiveDefinition } from '../types';
import getConditionResult from './getConditionResult';

const checkParentConditions = <Data, ExternalData, ErrorType>(
  processingContext: ProcessingContext<Data, ExternalData, ErrorType>,
  parentDefinitions: readonly RecursiveDefinition<any>[],
  currentIndices: Record<string, number>,
): boolean => {
  return parentDefinitions.every((definition, idx) => {
    if (definition.type === 'when') {
      return getConditionResult(processingContext, definition, parentDefinitions.slice(0, idx), currentIndices);
    } else {
      return true;
    }
  });
};

export default checkParentConditions;
