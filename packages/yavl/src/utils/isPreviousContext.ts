import { PreviousContext } from '../types';
import isObject from './isObject';

export const isPreviousContext = (data: any): data is PreviousContext<any> => {
  return isObject(data) && 'type' in data && data.type === 'previous' && 'dependencies' in data;
};
