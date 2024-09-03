import {
  FieldDependencyCache,
  WhenDefinition,
  RecursiveDefinition,
  ValidateDefinition,
  AnyModelContext,
  AnnotateDefinition,
  ModelDefinition,
  DefinitionList,
} from './types';
import modelPathToStr from './utils/modelPathToStr';
import processDependenciesRecursively from './utils/processDependenciesRecursively';

const createCacheEntryIfNeeded = (
  fieldDependencyCache: FieldDependencyCache<any>,
  dependency: AnyModelContext<any>,
) => {
  const dependencyPath = modelPathToStr(dependency.type, dependency.pathToField);

  if (!fieldDependencyCache[dependencyPath]) {
    fieldDependencyCache[dependencyPath] = {
      annotations: [],
      validations: [],
      conditions: [],
    };
  }

  return fieldDependencyCache[dependencyPath]!;
};

const createValidationCacheEntry = (
  fieldDependencyCache: FieldDependencyCache<any>,
  dependency: AnyModelContext<any>,
  validateDefinition: ValidateDefinition<any>,
  parentDefinitions: RecursiveDefinition<any>[],
  isDependency: boolean,
) => {
  const cacheEntry = createCacheEntryIfNeeded(fieldDependencyCache, dependency);

  cacheEntry.validations.push({
    definition: validateDefinition,
    modelPath: dependency.pathToField,
    parentDefinitions,
    isDependency,
    isPassive: dependency.isPassive ?? false,
  });
};

const createValidationCacheEntries = (
  fieldDependencyCache: FieldDependencyCache<any>,
  validateDefinition: ValidateDefinition<any>,
  parentDefinitions: RecursiveDefinition<any>[],
) => {
  processDependenciesRecursively(
    [validateDefinition.context],
    dependency => {
      createValidationCacheEntry(fieldDependencyCache, dependency, validateDefinition, parentDefinitions, false);
    },
    /**
     * For the field which we add the validation for, we want to add a cach
     * entry even if the field is a passive dependency, eg. the case:
     *
     * validate(passive(field), deps, validateFn)
     *
     * The reason is that user might not want the validate to re-run when the
     * field changes, but only when the deps change. Our getFieldValidationErrors
     * uses the field cache to evaluate errors for fields, and we need to add a
     * cache entry in order to look-up the errors for a field during update model.
     *
     * We check whether the validation entry is passive entry in processChangedDependency,
     * and skip processing validations when the passive field changes.
     */
    { processPassiveDependencies: true },
  );

  processDependenciesRecursively([validateDefinition.dependencies], dependency => {
    createValidationCacheEntry(fieldDependencyCache, dependency, validateDefinition, parentDefinitions, true);
  });
};

const createConditionCacheEntry = (
  fieldDependencyCache: FieldDependencyCache<any>,
  dependency: AnyModelContext<any>,
  conditionDefinition: WhenDefinition<any>,
  parentDefinitions: RecursiveDefinition<any>[],
) => {
  const cacheEntry = createCacheEntryIfNeeded(fieldDependencyCache, dependency);

  cacheEntry.conditions.push({
    definition: conditionDefinition,
    modelPath: dependency.pathToField,
    parentDefinitions,
  });
};

const createConditionCacheEntries = (
  fieldDependencyCache: FieldDependencyCache<any>,
  conditionDefinition: WhenDefinition<any>,
  parentDefinitions: RecursiveDefinition<any>[],
) => {
  processDependenciesRecursively(conditionDefinition.dependencies, dependency => {
    createConditionCacheEntry(fieldDependencyCache, dependency, conditionDefinition, parentDefinitions);
  });
};

const createAnnotationCacheEntry = (
  fieldDependencyCache: FieldDependencyCache<any>,
  dependency: AnyModelContext<any>,
  annotateDefinition: AnnotateDefinition,
  parentDefinitions: RecursiveDefinition<any>[],
  isDependencyOfValue: boolean,
  isComputedValue: boolean,
) => {
  const cacheEntry = createCacheEntryIfNeeded(fieldDependencyCache, dependency);

  cacheEntry.annotations.push({
    definition: annotateDefinition,
    modelPath: dependency.pathToField,
    parentDefinitions,
    isDependencyOfValue,
    isComputedValue,
  });
};

const createAnnotationCacheEntries = (
  fieldDependencyCache: FieldDependencyCache<any>,
  annotateDefinition: AnnotateDefinition,
  parentDefinitions: RecursiveDefinition<any>[],
) => {
  createAnnotationCacheEntry(
    fieldDependencyCache,
    annotateDefinition.context,
    annotateDefinition,
    parentDefinitions,
    false,
    annotateDefinition.context.isComputedValue ?? false,
  );

  processDependenciesRecursively(annotateDefinition.value, dependency => {
    createAnnotationCacheEntry(fieldDependencyCache, dependency, annotateDefinition, parentDefinitions, true, false);
  });
};

const buildFieldDependencyCacheRecursively = (
  definitions: DefinitionList<any>,
  fieldDependencyCache: FieldDependencyCache<any>,
  parentDefinitions: RecursiveDefinition<any>[],
): FieldDependencyCache<any> => {
  definitions.forEach(definition => {
    if (definition.type === 'annotation') {
      createAnnotationCacheEntries(fieldDependencyCache, definition, parentDefinitions);

      // no children for annotations
      return;
    }

    if (definition.type === 'validate') {
      createValidationCacheEntries(fieldDependencyCache, definition, parentDefinitions);

      // no children for validate
      return;
    }

    if (definition.type === 'when') {
      createConditionCacheEntries(fieldDependencyCache, definition, parentDefinitions);
    }

    buildFieldDependencyCacheRecursively(
      definition.children,
      fieldDependencyCache,
      parentDefinitions.concat(definition),
    );
  });

  return fieldDependencyCache;
};

/**
 * Builds a cache for validation code to quickly look up all validations must be
 * run when a field changes. For instance headline and brandName depends on each
 * other. Whenever headline changes, we must also run validations for brandName.
 * To do so we will build a cache object like this:
 *
 * ['internal:adTemplates[current].creative.headline']: [dependentBrandNameValidationObject]
 *
 * When the model validation code detects a change in the headline field, all it
 * has to do is look up from the cache does the headline have any dependencies.
 * Since we store it in an object, it's super fast to do the look-up due to objects
 * being implemented as hash maps.
 *
 * Whenever we check for dependent validations, and there are arrays involved,
 * we check for permutations of [current] and [all] entries. So if someone had
 * a dependency to ALL creative headlines, that would also be triggered by
 * the validation code.
 *
 * External dependencies are also saved in this same cache and are prefixed with
 * "external:" instead of "internal:".
 *
 * Cache is never exposed outside this function, let's do
 * this with mutations for some extra performance.
 */
const buildFieldDependencyCache = (modelDefinition: ModelDefinition<any, any>): FieldDependencyCache<any> => {
  return buildFieldDependencyCacheRecursively(modelDefinition.children, {}, [modelDefinition]);
};

export default buildFieldDependencyCache;
