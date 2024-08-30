import {
  AnyExtensibleSingleModelContext,
  SameNonExtensibleModelContextOfType
} from '../types';

export interface IndexFn {
  <Context extends AnyExtensibleSingleModelContext<any>>(
    context: Context
  ): SameNonExtensibleModelContextOfType<Context, number>;
}

// TODO: update signature to support dealing with array contexts,
// the resolveDependency implementation already supports this
const index: IndexFn = (context: AnyExtensibleSingleModelContext<any>): any => {
  return {
    ...context,
    pathToField: context.pathToField.concat({ type: 'index' }),
    // disables from using this with dependency() etc.
    nonExtensible: true
  };
};

export default index;
