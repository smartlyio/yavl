import { PreviousContext } from '../types';

export const isPreviousContext = (data: any): data is PreviousContext<any> => {
  return (
    typeof data === 'object' && data !== null && 'type' in data && data.type === 'previous' && 'dependencies' in data
  );
};
