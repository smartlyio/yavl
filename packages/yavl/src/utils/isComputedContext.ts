import { ComputedContext } from '../types';
import isObject from './isObject';

const isComputedContext = (data: unknown): data is ComputedContext<any> => {
  return isObject(data) && 'type' in data && data.type === 'computed' && 'dependencies' in data && 'computeFn' in data;
};

export default isComputedContext;
