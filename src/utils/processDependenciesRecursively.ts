import * as R from 'ramda';
import isAnyModelContext from './isAnyModelContext';
import { AnyModelContext, PathToField } from '../types';
import isComputedContext from './isComputedContext';

const processDependenciesRecursively = (
  dependencies: any,
  processFn: (dependency: AnyModelContext<any>) => void,
  options: { processPassiveDependencies?: boolean } = {}
) => {
  const processPickedKeys = (
    context: AnyModelContext<any>,
    keys: readonly string[],
    basePathToField: PathToField
  ): void => {
    keys.forEach((key) => {
      const pickedKeyContext = {
        ...context,
        pathToField: basePathToField.concat({
          type: 'field',
          name: key
        })
      };

      processFn(pickedKeyContext);
    });
  };

  const processContextPath = (context: AnyModelContext<any>) => {
    const lastPathPart = R.last(context.pathToField);

    /**
     * In case the last part of the path is from pick(), we only
     * want to add the picked keys as dependencies. If it's not
     * the last part, we can just ignore the picked keys, as
     * there is already more focused dependency.
     */
    if (lastPathPart?.type === 'pick') {
      processPickedKeys(context, lastPathPart.keys, context.pathToField);
    } else {
      processFn(context);
    }

    /**
     * If there is any filtered data within the path, we need to
     * add the dependencies of the filter function as well
     */
    context.pathToField.forEach((pathPart, index) => {
      if (pathPart.type === 'filter') {
        // the picked array data for the filter function
        processPickedKeys(
          context,
          pathPart.keys,
          context.pathToField.slice(0, index) // the path up to this part, excluding the filter part
        );

        // and other dependencies
        if ('dependencies' in pathPart) {
          processDependenciesRecursively(
            pathPart.dependencies,
            processFn,
            options
          );
        }
      }
    });
  };

  if (isAnyModelContext(dependencies)) {
    const modelContext = dependencies;

    if (modelContext.dependsOn) {
      modelContext.dependsOn.forEach((dependency) => processFn(dependency));
    } else if (!modelContext.isPassive || options.processPassiveDependencies) {
      // model context is treated as an active dependency when
      // isPassive is false and dependsOn is not defined
      processContextPath(modelContext);
    }
  } else if (isComputedContext(dependencies)) {
    // in case of computed context, we just want to add a cache entry for every dependency in it
    const computedContext = dependencies;

    processDependenciesRecursively(
      computedContext.dependencies,
      processFn,
      options
    );
  } else if (Array.isArray(dependencies)) {
    dependencies.forEach((dependency) => {
      // create a cache entry for each dependency
      processDependenciesRecursively(dependency, processFn, options);
    });
  } else if (R.is(Object, dependencies)) {
    Object.values(dependencies).forEach((dependency) => {
      // create a cache entry for each dependency
      processDependenciesRecursively(dependency, processFn, options);
    });
  }
};

export default processDependenciesRecursively;
