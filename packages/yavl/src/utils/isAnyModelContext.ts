import * as R from 'ramda';
import { AnyModelContext } from '../types';

const isAnyModelContext = (data: any): data is AnyModelContext<any> => {
  return (
    R.is(Object, data) &&
    'type' in data &&
    ['internal', 'external'].includes(data.type) &&
    'pathToField' in data &&
    Array.isArray(data.pathToField)
  );
};

export default isAnyModelContext;
