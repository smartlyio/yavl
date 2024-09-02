import { Annotation } from '../types';
import { ChangedAnnotationsCache } from './types';

export const getChangedAnnotationsCacheForPath = (
  changedAnnotationsCache: ChangedAnnotationsCache,
  path: string,
): Set<Annotation<any>> => {
  const existingCache = changedAnnotationsCache.get(path);
  if (existingCache) {
    return existingCache;
  }

  const newCache = new Set<Annotation<any>>();
  changedAnnotationsCache.set(path, newCache);

  return newCache;
};
