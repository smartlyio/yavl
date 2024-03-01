import dependency, { DependencyFn } from './dependency';
import { AnyModelContext } from '../types';

// TODO: will be deprecated in favor of passiveDependency
const passiveDependency: DependencyFn = (...args: any[]): any => {
  const dependencyContext: AnyModelContext<any> = (dependency as any)(...args);

  return {
    type: dependencyContext.type,
    pathToField: dependencyContext.pathToField,
    isPassive: true
  };
};

export default passiveDependency;
