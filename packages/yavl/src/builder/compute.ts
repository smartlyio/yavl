import { ComputedContext, ComputeFn } from '../types';
import { ExtractDependencies } from './dependency';

export type ComputeBuilderFn = <Dependencies, ReturnType>(
  dependencies: Dependencies,
  computeFn: ComputeFn<ExtractDependencies<Dependencies>, ReturnType>,
) => ComputedContext<ReturnType>;

const compute: ComputeBuilderFn = (dependencies: any, computeFn: ComputeFn<any, any>) => {
  const computedContext: ComputedContext<any> = {
    type: 'computed',
    dependencies,
    computeFn,
  };

  return computedContext;
};

export default compute;
