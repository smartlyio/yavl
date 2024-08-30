import isAnyModelContext from '../utils/isAnyModelContext';
import isComputedContext from '../utils/isComputedContext';

export interface PassiveFn {
  <T>(dependencies: T): T;
}

/**
 * Recursively marks all contexts as passive in passed dependencies.
 */
export const passive = <T>(dependencies: T): T => {
  if (isAnyModelContext(dependencies)) {
    return { ...dependencies, isPassive: true };
  }
  if (isComputedContext(dependencies)) {
    return {
      ...dependencies,
      dependencies: passive(dependencies.dependencies)
    };
  }
  if (Array.isArray(dependencies)) {
    return dependencies.map((dependency) => passive(dependency)) as T;
  }
  if (typeof dependencies === 'object' && dependencies !== null) {
    return Object.entries(dependencies).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: passive(value)
      }),
      {} as T
    );
  }
  return dependencies;
};
