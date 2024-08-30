import * as R from 'ramda';
import {
  AnyArrayModelContext,
  ContextType,
  SameContextOfType,
  NoInfer,
  FilterFnWithDependencies,
  FilterFnWithoutDependencies,
  FilterFocus,
  AnySingleModelContext,
  ComputedContext,
  ArrayOfSameContextType,
  ArrayAllFocus
} from '../types';
import compute from './compute';
import isComputedContext from '../utils/isComputedContext';
import { ExtractDependencies } from './dependency';
import isAnyArrayModelContext from '../utils/isAnyArrayModelContext';

/**
 * TODO:
 *
 * It would be nice if filtering supported objects too, but for
 * that to be useful we would first need to support dynamic objects
 * in yavl similar to how arrays are implemented. We could have
 * values() / entries() builder function for iterating through dynamic
 * objects
 *
 * Consider if you wanted to eg. store your ad templates in form model
 * as Record<FormAdId, AdTemplateFormModel> - this would currently not be
 * supported by yavl.
 */
export interface FilterBuilderFn {
  <
    Context extends AnyArrayModelContext<Record<string, unknown>>,
    Keys extends keyof ContextType<Context> & string
  >(
    context: Context,
    keys: readonly Keys[],
    filterFn: NoInfer<FilterFnWithoutDependencies<ContextType<Context>, Keys>>
  ): SameContextOfType<Context, ContextType<Context>>;

  <
    Context extends AnyArrayModelContext<Record<string, unknown>>,
    Keys extends keyof ContextType<Context> & string,
    Dependencies
  >(
    context: Context,
    keys: readonly Keys[],
    dependencies: Dependencies,
    filterFn: NoInfer<
      FilterFnWithDependencies<
        ContextType<Context>,
        Keys,
        ExtractDependencies<Dependencies>
      >
    >
  ): SameContextOfType<Context, ContextType<Context>>;

  <
    Context extends
      | AnySingleModelContext<ReadonlyArray<Record<string, unknown>>>
      | ComputedContext<ReadonlyArray<Record<string, unknown>>>,
    Keys extends keyof ContextType<Context>[number] & string
  >(
    context: Context,
    keys: readonly Keys[],
    filterFn: NoInfer<
      FilterFnWithoutDependencies<ContextType<Context>[number], Keys>
    >
  ): ArrayOfSameContextType<Context>;

  <
    Context extends
      | AnySingleModelContext<ReadonlyArray<Record<string, unknown>>>
      | ComputedContext<ReadonlyArray<Record<string, unknown>>>,
    Keys extends keyof ContextType<Context>[number] & string,
    Dependencies
  >(
    context: Context,
    keys: readonly Keys[],
    dependencies: Dependencies,
    filterFn: NoInfer<
      FilterFnWithDependencies<
        ContextType<Context>[number],
        Keys,
        ExtractDependencies<Dependencies>
      >
    >
  ): ArrayOfSameContextType<Context>;
}

const filter: FilterBuilderFn = (
  context:
    | AnyArrayModelContext<any>
    | AnySingleModelContext<any[]>
    | ComputedContext<any[]>,
  keys: readonly string[],
  dependenciesOrFilterFn: any,
  maybeFilterFn?: any
): any => {
  const hasDependencies = typeof maybeFilterFn === 'function';
  const filterFn = hasDependencies ? maybeFilterFn : dependenciesOrFilterFn;
  const maybeDependencies = hasDependencies
    ? dependenciesOrFilterFn
    : undefined;

  if (isComputedContext(context)) {
    return compute(
      {
        array: context,
        deps: maybeDependencies
      },
      ({ array, deps }) =>
        array.filter((value, index) =>
          hasDependencies
            ? filterFn(R.pick(keys, value), deps, index)
            : filterFn(R.pick(keys, value), index)
        )
    );
  }

  // if there are no dependencies, omit the whole dependencies key so resolveDependencies
  // knows to call the correct overload of the filterFn function
  const filterFocus: FilterFocus = hasDependencies
    ? {
        type: 'filter',
        keys,
        dependencies: maybeDependencies,
        filterFn
      }
    : {
        type: 'filter',
        keys,
        filterFn
      };

  if (isAnyArrayModelContext(context)) {
    return {
      ...context,
      // if the parent context was created with dependsOn, we want to ignore that
      dependsOn: undefined,
      pathToField: context.pathToField.concat(filterFocus)
    };
  } else {
    const arrayAllFocus: ArrayAllFocus = {
      type: 'array',
      focus: 'all'
    };

    const arrayModelContext: AnyArrayModelContext<any> = {
      ...context,
      multiFocus: true,
      // if the parent context was created with dependsOn, we want to ignore that
      dependsOn: undefined,
      pathToField: context.pathToField
        // add array all focus before filter in order to build dependency cache correctly
        .concat(arrayAllFocus)
        .concat(filterFocus)
    };

    return arrayModelContext;
  }
};

export default filter;
