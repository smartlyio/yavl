import { Annotation } from './types';

export const createAnnotation = <T>(name: string): Annotation<T> => {
  return name;
};

export const annotations = {
  isRequired: createAnnotation<boolean>('YAVL:isRequired'),
};

// we don't want to export this outside the library which is why it's not annotations object
export const valueAnnotation = createAnnotation<unknown>('value');
