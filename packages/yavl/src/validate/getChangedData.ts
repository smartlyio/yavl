import * as R from 'ramda';
import { FieldsWithDependencies, HasDependenciesInfo } from '../types';
import dataPathToStr from '../utils/dataPathToStr';
import { assertUnreachable } from '../utils/typeUtils';
import { getPathWithoutIndices } from '../utils/getPathWithoutIndices';

type CompareFn = (a: any, b: any) => boolean;
type PathToField = ReadonlyArray<string | number>;
type ListOfFields = Array<PathToField>;

export type GetChangedDataResult = {
  changedFields: ListOfFields;
  arraysWithChangedLength: ListOfFields;
};

const shouldIncludeField = (
  changesFor: 'annotations' | 'conditions' | 'validations',
  hasDependencies: HasDependenciesInfo,
) => {
  if (changesFor === 'annotations') {
    return hasDependencies.computedValues;
  }

  if (changesFor === 'conditions') {
    return hasDependencies.computedValues || hasDependencies.conditions;
  }

  if (changesFor === 'validations') {
    return hasDependencies.computedValues || hasDependencies.conditions || hasDependencies.validations;
  }

  return assertUnreachable(changesFor);
};

const getChangedDataRecursively = (
  currentNewData: any,
  currentOldData: any,
  type: 'internal' | 'external',
  fieldsWithDependencies: FieldsWithDependencies,
  changedFields: ListOfFields,
  arraysWithChangedLength: ListOfFields,
  currentPath: PathToField,
  includeFieldsWithoutDependencies: boolean,
  changesFor: 'annotations' | 'conditions' | 'validations',
  isEqualFn: CompareFn,
): GetChangedDataResult => {
  const strippedPath = getPathWithoutIndices(dataPathToStr(currentPath));
  const dependencyInfo = fieldsWithDependencies[`${type}:${strippedPath}`];

  // if this path is not depended on by anyone, no need to report changes to it
  if (!dependencyInfo) {
    return { changedFields, arraysWithChangedLength };
  }

  // don't include non-cascading changes unless requested
  if (includeFieldsWithoutDependencies || shouldIncludeField(changesFor, dependencyInfo.hasDependencies)) {
    changedFields.push(currentPath);
  }

  const isNewDataArray = Array.isArray(currentNewData);
  const isOldDataArray = Array.isArray(currentOldData);

  /**
   * If an array was added or removed, or new items were added or removed,
   * mark the array's length as changed. This causes YAVL to re-evaluate
   * any definitions that depend on all items of the array using array.all.
   */
  if (
    (isNewDataArray && isOldDataArray && currentNewData.length !== currentOldData.length) ||
    isNewDataArray !== isOldDataArray
  ) {
    arraysWithChangedLength.push(currentPath);
  }

  if (isNewDataArray && isOldDataArray) {
    currentNewData.forEach((_, idx) => {
      const nextPath = currentPath.concat(idx);
      const nextNewData = currentNewData[idx];
      const nextOldData = currentOldData[idx];

      if (idx < currentOldData.length && !isEqualFn(nextNewData, nextOldData)) {
        getChangedDataRecursively(
          nextNewData,
          nextOldData,
          type,
          fieldsWithDependencies,
          changedFields,
          arraysWithChangedLength,
          nextPath,
          includeFieldsWithoutDependencies,
          changesFor,
          isEqualFn,
        );
      }
    });
  } else if (R.is(Object, currentNewData) || R.is(Object, currentOldData)) {
    const isNewDataObject = R.is(Object, currentNewData);
    const isOldDataObject = R.is(Object, currentOldData);

    const allKeys = R.uniq(
      (isNewDataObject ? Object.keys(currentNewData) : []).concat(isOldDataObject ? Object.keys(currentOldData) : []),
    );

    allKeys.forEach(fieldName => {
      const nextPath = currentPath.concat(fieldName);
      const nextNewData = isNewDataObject ? currentNewData[fieldName] : undefined;
      const nextOldData = isOldDataObject ? currentOldData[fieldName] : undefined;

      if (
        !(
          (isNewDataObject && fieldName in currentNewData) === (isOldDataObject && fieldName in currentOldData) &&
          isEqualFn(nextNewData, nextOldData)
        )
      ) {
        getChangedDataRecursively(
          nextNewData,
          nextOldData,
          type,
          fieldsWithDependencies,
          changedFields,
          arraysWithChangedLength,
          nextPath,
          includeFieldsWithoutDependencies,
          changesFor,
          isEqualFn,
        );
      }
    });
  }

  return { changedFields, arraysWithChangedLength };
};

const getChangedData = <Data>(args: {
  newData: Data;
  oldData: Data;
  type: 'internal' | 'external';
  changesFor: 'annotations' | 'conditions' | 'validations';
  fieldsWithDependencies: FieldsWithDependencies;
  includeFieldsWithoutDependencies: boolean;
  isEqualFn?: CompareFn;
}): GetChangedDataResult => {
  const {
    newData,
    oldData,
    type,
    fieldsWithDependencies,
    includeFieldsWithoutDependencies,
    changesFor,
    isEqualFn = Object.is,
  } = args;

  if (isEqualFn(newData, oldData)) {
    return { changedFields: [], arraysWithChangedLength: [] };
  }

  return getChangedDataRecursively(
    newData,
    oldData,
    type,
    fieldsWithDependencies,
    [],
    [],
    [],
    includeFieldsWithoutDependencies,
    changesFor,
    isEqualFn,
  );
};

export default getChangedData;
