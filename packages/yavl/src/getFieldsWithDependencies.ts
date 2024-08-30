import { getPathWithoutIndices } from './utils/getPathWithoutIndices';
import { valueAnnotation } from './annotations';
import {
  FieldDependencyCache,
  FieldDependencyEntry,
  FieldsWithDependencies,
  HasDependenciesInfo
} from './types';

const noDependencies: HasDependenciesInfo = {
  computedValues: false,
  conditions: false,
  validations: false
};

const getFieldWithParents = (field: string) => {
  const fields: string[] = [];

  while (true) {
    const lastPeriod = field.lastIndexOf('.');
    const lastArray = field.lastIndexOf('[]');

    // no more parts to process
    if (lastPeriod === -1 && lastArray === -1) {
      break;
    }

    // remove the last part and push the parent field
    const lastIndex = Math.max(lastPeriod, lastArray);
    field = field.substring(0, lastIndex);
    fields.push(field);
  }

  return fields;
};

/**
 * We have dependencies for a field in three different situations:
 * - The field is used as a dependency of a computed value
 * - The field is used as a dependency for a when() condition, which can active
 *   a new branch that has cascading changes.
 * - The field is used as a dependency for a validate() definition, which means that
 *   a cascading change for the field can cause a new error to appear.
 *
 * We don't need to consider the case if field is used as a dependency for an annotation
 * other than computed value. This is because annotation changes are not processed with
 * getChangedData, which the "hasDependencies" is used for. Annotations are instead handled
 * by the getChangedAnnotations() in processModelChanges(), which processes all annotations
 * if there are any dependencies for them.
 */
const hasFieldDependencies = (
  fieldCache: FieldDependencyEntry<any> | undefined
): HasDependenciesInfo => {
  if (!fieldCache) {
    return noDependencies;
  }

  const isFieldUsedAsConditionDependency = fieldCache.conditions.length > 0;
  const isFieldUsedAsValidationDependency = fieldCache.validations.length > 0;
  const isFieldUsedAsComputedValueDependency = fieldCache.annotations.some(
    ({ definition, isDependencyOfValue }) =>
      definition.annotation === valueAnnotation && isDependencyOfValue
  );

  return {
    computedValues: isFieldUsedAsComputedValueDependency,
    conditions: isFieldUsedAsConditionDependency,
    validations: isFieldUsedAsValidationDependency
  };
};

export const getFieldsWithDependencies = (
  fieldDependencyCache: FieldDependencyCache<any>
): FieldsWithDependencies => {
  // always nclude the root paths, if there is something that depends on root directly,
  // the loop below will overwrite this entry with hasDependencies = true
  const result: FieldsWithDependencies = {
    'internal:': {
      hasDependencies: noDependencies
    },
    'external:': {
      hasDependencies: noDependencies
    }
  };

  Object.entries(fieldDependencyCache).forEach(([field, fieldCache]) => {
    const normalizedField = getPathWithoutIndices(field);
    const fieldWithParents = getFieldWithParents(normalizedField);

    const hasDependencies = hasFieldDependencies(fieldCache);
    const existingHasDependencies: HasDependenciesInfo =
      result[normalizedField]?.hasDependencies ?? noDependencies;

    result[normalizedField] = {
      hasDependencies: {
        computedValues:
          hasDependencies.computedValues ||
          existingHasDependencies.computedValues,
        conditions:
          hasDependencies.conditions || existingHasDependencies.conditions,
        validations:
          hasDependencies.validations || existingHasDependencies.validations
      }
    };

    fieldWithParents.forEach((fieldPart) => {
      // don't process parent field if we already have an entry for it
      if (result[fieldPart] !== undefined) {
        return;
      }

      result[fieldPart] = {
        hasDependencies: noDependencies
      };
    });
  });

  return result;
};
