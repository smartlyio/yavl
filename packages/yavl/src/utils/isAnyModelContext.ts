import { AnyModelContext } from '../types';

const isAnyModelContext = (data: any): data is AnyModelContext<any> => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    ['internal', 'external'].includes(data.type) &&
    'pathToField' in data &&
    Array.isArray(data.pathToField)
  );
};

export default isAnyModelContext;
