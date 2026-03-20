import { ComputedContext } from '../types';

const isComputedContext = (data: any): data is ComputedContext<any> => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    data.type === 'computed' &&
    'dependencies' in data &&
    'computeFn' in data
  );
};

export default isComputedContext;
