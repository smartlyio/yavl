import { AnyExtensibleSingleModelContext, SameNonExtensibleModelContextOfType } from '../types';

export interface PathFn {
  <Context extends AnyExtensibleSingleModelContext<any>>(context: Context): SameNonExtensibleModelContextOfType<
    Context,
    string
  >;
}

// TODO: update signature to support dealing with array contexts,
// the resolveDependency implementation already supports this
const path: PathFn = (context: AnyExtensibleSingleModelContext<any>): any => {
  return {
    ...context,
    pathToField: context.pathToField.concat({ type: 'path' }),
    // the index can never change, so we can treat this as a passive dep
    isPassive: true,
    // disables from using this with dependency() etc.
    nonExtensible: true,
  };
};

export default path;
