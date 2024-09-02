import { ProcessingContext } from './types';
import getDependencyPathPermutations from '../utils/getDependencyPathPermutations';
import getIndicesFromStrPath from '../utils/getIndicesFromStrPath';
import dataPathToStr from '../utils/dataPathToStr';
import rejectUndefinedValues from '../utils/rejectUndefinedValues';
import { processChangedDependency } from './processChangedDependency';

const processChangedFields = <Data, ExternalData, ErrorType>(
  processingContext: ProcessingContext<Data, ExternalData, ErrorType>,
  pass: 'annotations' | 'conditions' | 'validations',
  type: 'external' | 'internal',
  changedPaths: ReadonlyArray<ReadonlyArray<string | number>>,
): void => {
  changedPaths.forEach(changedPath => {
    const dependentPathPermutations = getDependencyPathPermutations(type, changedPath);

    const currentIndices = getIndicesFromStrPath(dataPathToStr(changedPath));
    const fieldDependencies = rejectUndefinedValues(
      dependentPathPermutations.map(path => processingContext.fieldDependencyCache[path]),
    );

    fieldDependencies.forEach(fieldDependency => {
      processChangedDependency(processingContext, pass, type, fieldDependency, currentIndices);
    });
  });
};

export default processChangedFields;
