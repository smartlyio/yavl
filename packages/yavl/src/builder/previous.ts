import { ExtractDependencies } from './dependency';
import { PreviousContext } from '../types';

export type PreviousBuilderFn = <Dependencies>(
  dependencies: Dependencies
) => PreviousContext<ExtractDependencies<Dependencies> | undefined>;

export const previous: PreviousBuilderFn = (dependencies: any) => {
  const previousContext: PreviousContext<any> = {
    type: 'previous',
    dependencies
  };

  return previousContext;
};
