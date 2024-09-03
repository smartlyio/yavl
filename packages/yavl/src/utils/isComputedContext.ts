import * as R from 'ramda';
import { ComputedContext } from '../types';

const isComputedContext = (data: any): data is ComputedContext<any> => {
  return (
    R.is(Object, data) && 'type' in data && data.type === 'computed' && 'dependencies' in data && 'computeFn' in data
  );
};

export default isComputedContext;
