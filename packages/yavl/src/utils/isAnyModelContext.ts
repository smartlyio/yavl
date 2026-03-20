import { AnyModelContext } from '../types';
import isObject from './isObject';

const isAnyModelContext = (data: unknown): data is AnyModelContext<any> => {
  return (
    isObject(data) &&
    'type' in data &&
    typeof data.type === 'string' &&
    ['internal', 'external'].includes(data.type) &&
    'pathToField' in data &&
    Array.isArray(data.pathToField)
  );
};

export default isAnyModelContext;
