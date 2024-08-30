import * as R from 'ramda';
import { PreviousContext } from '../types';

export const isPreviousContext = (data: any): data is PreviousContext<any> => {
  return (
    R.is(Object, data) &&
    'type' in data &&
    data.type === 'previous' &&
    'dependencies' in data
  );
};
