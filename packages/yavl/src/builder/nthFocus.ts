import { AnyArrayModelContext, ArrayModelContextToSingleModelContext, ContextType, SameContextOfType } from '../types';

/**
 * When taking nth focus, there's no way to know whether the specified focus exists,
 * hence let's always add undefined to the returned context type.
 */
type AddUndefinedToContextType<Context> = SameContextOfType<Context, ContextType<Context> | undefined>;

/**
 * TODO:
 * You should not be able to use the returned ModelContext as parent context for validate()
 * and annotate() etc. calls. This is currently not possible, but this will be dealt with when
 * the ModelContext types are going to be improved/refactored to allow method chaining way
 * of defining dependencies.
 */
export interface NthFocusFn {
  <Context extends AnyArrayModelContext<unknown>>(arrayContext: Context, index: number): AddUndefinedToContextType<
    ArrayModelContextToSingleModelContext<Context>
  >;
}

const nthFocus: NthFocusFn = (arrayContext: AnyArrayModelContext<unknown>, index: number): any => {
  return {
    ...arrayContext,
    pathToField: arrayContext.pathToField.concat({
      type: 'array',
      focus: 'index',
      index,
      multiToSingleFocus: true,
    }),
  };
};

export default nthFocus;
