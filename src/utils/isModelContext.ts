import { AnyContext, ModelContext } from '../types';

const isModelContext = <T>(
  context: AnyContext<T>
): context is ModelContext<T> =>
  context.type === 'internal' && !context.nonExtensible;

export default isModelContext;
