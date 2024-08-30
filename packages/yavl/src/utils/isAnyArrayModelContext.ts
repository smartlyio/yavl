import { AnyArrayModelContext } from '../types';
import isAnyModelContext from './isAnyModelContext';

const isAnyArrayModelContext = (
  data: any
): data is AnyArrayModelContext<any> => {
  return isAnyModelContext(data) && Boolean(data.multiFocus);
};

export default isAnyArrayModelContext;
