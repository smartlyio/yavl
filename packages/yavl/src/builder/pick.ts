import * as R from 'ramda';
import {
  AnyContext,
  ContextType,
  KeysOfUnion,
  SameContextOfType
} from '../types';
import compute from './compute';
import isComputedContext from '../utils/isComputedContext';
import { isPreviousContext } from '../utils/isPreviousContext';

export interface PickBuilderFn {
  <
    Context extends AnyContext<Record<string, unknown> | undefined>,
    Keys extends KeysOfUnion<ContextType<Context>> & string
  >(
    context: Context,
    keys: readonly Keys[]
  ): SameContextOfType<
    Context,
    | Pick<Extract<ContextType<Context>, Record<string, unknown>>, Keys>
    | Exclude<ContextType<Context>, Record<string, unknown>>
  >;
}

const pick: PickBuilderFn = (
  context: AnyContext<any>,
  keys: readonly string[]
): any => {
  if (isComputedContext(context) || isPreviousContext(context)) {
    // we can't use dependsOn on for computed data, we must depend on the whole computed data
    return compute(context, R.pick(keys));
  } else {
    return {
      ...context,
      // if the parent context was created with dependsOn, we want to ignore that
      dependsOn: undefined,
      pathToField: context.pathToField.concat({
        type: 'pick',
        keys
      })
    };
  }
};

export default pick;
