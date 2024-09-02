import { AnyExtensibleModelContext, ContextType } from '../types';
import isAnyModelContext from '../utils/isAnyModelContext';

export type DependsOnFn = <Context extends AnyExtensibleModelContext<any>>(
  context: Context,
  dependencies: ReadonlyArray<(keyof ContextType<Context> & string) | AnyExtensibleModelContext<any>>,
) => Context;

const dependsOn: DependsOnFn = <Context extends AnyExtensibleModelContext<any>>(
  context: Context,
  dependencies: ReadonlyArray<string | AnyExtensibleModelContext<any>>,
): Context => {
  const dependsOn = dependencies.map(
    (dependency): AnyExtensibleModelContext<any> => {
      if (isAnyModelContext(dependency)) {
        return dependency;
      } else {
        return {
          ...context,
          pathToField: context.pathToField.concat({
            type: 'field',
            name: dependency,
          }),
        };
      }
    },
  );

  return {
    ...context,
    dependsOn,
  };
};

export default dependsOn;
