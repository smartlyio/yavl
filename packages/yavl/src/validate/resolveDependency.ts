import { noValue, PathToField } from '../types';
import dataPathToStr from '../utils/dataPathToStr';
import { getResolvedAnnotation } from '../utils/resolvedAnnotationsHelpers';
import { assertUnreachable } from '../utils/typeUtils';
import resolveDependencies from './resolveDependencies';
import { MutatingFieldProcessingCacheEntry, ProcessingContext } from './types';
import { pick } from '../utils/pick';

const resolveDependency = <Data, ExternalData, ErrorType>(
  processingContext: ProcessingContext<Data, ExternalData, ErrorType>,
  dependencyType: 'internal' | 'external',
  pathToDependency: PathToField,
  currentIndices: Record<string, number>,
  runCacheForField: MutatingFieldProcessingCacheEntry<any> | undefined,
): any | undefined => {
  const { data: rootData, externalData, resolvedAnnotations, annotationBeingResolved } = processingContext;

  const formOrExternalData = dependencyType === 'internal' ? rootData : externalData;

  const lastPart = pathToDependency[pathToDependency.length - 1];

  let data: any = formOrExternalData;
  let paths: Array<Array<string | number>> = [[]];
  let isFocusedOnSinglePath = true;

  for (const pathPart of pathToDependency) {
    if (pathPart.type === 'field') {
      if (isFocusedOnSinglePath) {
        data = data?.[pathPart.name];
        paths[0]?.push(pathPart.name);
      } else {
        if (data === undefined) {
          paths = [];
        } else {
          if (!Array.isArray(data)) {
            throw new Error('data should be array');
          }

          data = data.map((item: any) => item?.[pathPart.name]);
          for (const path of paths) {
            path.push(pathPart.name);
          }
        }
      }
    } else if (pathPart.type === 'array') {
      if (pathPart.focus === 'index') {
        const isSingleFocus = isFocusedOnSinglePath || pathPart.multiToSingleFocus;

        /**
         * There are two different cases for having an "index" focus in the path:
         * - With "nthFocus(0)": in this case we're not actually diving deeper to the data,
         *   but rather we just focus on a given index. This means that we need to
         *   pick the corresponding path from the paths array.
         * - With "dep('list', 0)": in this case we're diving deeper to the data, so we
         *   want to add the index to all the currently aggregated paths.
         *
         * NOTE. It's possible that the paths is an empty array at this point, if we've
         * filtered an array and the filter function didn't match any items.
         */
        if (pathPart.multiToSingleFocus) {
          paths = paths.length > 0 ? [paths[pathPart.index]] : [];
        } else {
          for (const path of paths) {
            path.push(pathPart.index);
          }
        }

        if (isSingleFocus) {
          data = data?.[pathPart.index];
          isFocusedOnSinglePath = true;
        } else {
          if (data === undefined) {
            paths = [];
            isFocusedOnSinglePath = false;
          } else {
            if (!Array.isArray(data)) {
              throw new Error('data should be array');
            }

            data = data.map((item: any) => item?.[pathPart.index]);
            isFocusedOnSinglePath = false;
          }
        }
      } else if (pathPart.focus === 'current') {
        if (!isFocusedOnSinglePath) {
          throw new Error(
            `Trying to focus current array index after already focusing on all elements earlier in the path`,
          );
        }

        const currentPath = paths[0];
        const pathStr = dataPathToStr(currentPath);

        if (dependencyType === 'external') {
          throw new Error(
            `Trying to focus current path of ${pathStr} failed; current focus is not supported for external data`,
          );
        }

        const currentIndex = currentIndices[pathStr];

        if (currentIndex === undefined) {
          throw new Error(`Trying to access current index of ${pathStr}, but current index missing for the path`);
        }

        data = data?.[currentIndex];
        currentPath.push(currentIndex);
      } else {
        if (data === undefined) {
          data = [];
          paths = [];
          isFocusedOnSinglePath = false;
        } else {
          if (!Array.isArray(data)) {
            throw new Error('data should be array');
          }

          if (isFocusedOnSinglePath) {
            const basePath = paths[0];
            paths = data.map((_: unknown, idx: number) => [...basePath, idx]);
          } else {
            const prevData: unknown[][] = data;
            data = prevData.flat();
            paths = paths.flatMap((path, pathIndex) => {
              const nestedData = prevData[pathIndex];
              if (nestedData === undefined) {
                return [];
              }
              if (!Array.isArray(nestedData)) {
                throw new Error('data should be array');
              }
              return nestedData.map((_: unknown, idx: number) => [...path, idx]);
            });
          }

          isFocusedOnSinglePath = false;
        }
      }
    } else if (pathPart.type === 'annotation') {
      /**
       * The only situation resolvedAnnotations is not defined is when we are in createWithDefaultValues.
       * It's not trivial to support annotations (or computed values) when resolving default values.
       */
      if (!resolvedAnnotations) {
        throw new Error('Using annotations as dependencies to default values is not supported');
      }

      const getAnnotationForField = (annotationPath: ReadonlyArray<string | number>) => {
        const pathStr = dataPathToStr(annotationPath);

        if (annotationBeingResolved) {
          if (annotationBeingResolved.field === pathStr && annotationBeingResolved.annotation === pathPart.annotation) {
            throw new Error(`Cyclical dependency to annotation "${pathPart.annotation}" for field "${pathStr}"`);
          }
        }

        const annotationValue = getResolvedAnnotation(resolvedAnnotations.current, pathStr, pathPart.annotation);

        if (annotationValue === noValue) {
          if (!pathPart.defaultValue.hasValue) {
            throw new Error(
              `Annotation "${pathPart.annotation}" from field "${pathStr}" used as a dependency, but there is no data for the annotation`,
            );
          }

          return pathPart.defaultValue.value;
        }

        return annotationValue;
      };

      if (isFocusedOnSinglePath) {
        data = getAnnotationForField(paths[0]);
      } else {
        if (data === undefined) {
          data = [];
        } else {
          if (!Array.isArray(data)) {
            throw new Error('Expected data to be array');
          }

          data = paths.map(annotationPath => getAnnotationForField(annotationPath));
        }
      }
    } else if (pathPart.type === 'pick') {
      /**
       * We only need to actually narrow the data if the narrow is the last
       * part of the path. If it's not the last one, the next step will already
       * dive deeper to the data, so the narrowing is lost anyways. This is a
       * minor optimization.
       */
      if (pathPart !== lastPart) {
        continue;
      }

      if (data !== undefined) {
        if (Array.isArray(data)) {
          data = data.map((obj: any) => pick(pathPart.keys, obj));
        } else {
          data = pick(pathPart.keys, data);
        }
      }
    } else if (pathPart.type === 'filter') {
      if (!Array.isArray(data)) {
        throw new Error('called filter() on non-array');
      }

      const filteredDataWithIndices = data.flatMap((value, index) => {
        const pickedKeys = pick(pathPart.keys, value);
        let isFiltered: boolean;

        if ('dependencies' in pathPart) {
          const resolvedDependencies = resolveDependencies(
            processingContext,
            pathPart.dependencies,
            currentIndices,
            runCacheForField,
          );

          isFiltered = pathPart.filterFn(pickedKeys, resolvedDependencies, index);
        } else {
          isFiltered = pathPart.filterFn(pickedKeys, index);
        }

        if (!isFiltered) {
          return [];
        }

        return { value, index };
      });

      const filteredIndexSet = new Set(filteredDataWithIndices.map(it => it.index));
      data = filteredDataWithIndices.map(it => it.value);
      paths = paths.filter((_, index) => filteredIndexSet.has(index));
      isFocusedOnSinglePath = false;
    } else if (pathPart.type === 'path') {
      if (isFocusedOnSinglePath) {
        data = dataPathToStr(paths[0]);
      } else {
        data = paths.map(path => dataPathToStr(path));
      }
    } else if (pathPart.type === 'index') {
      const getIndexOfPath = (indexPath: Array<string | number>) => {
        const lastPathPart = indexPath[indexPath.length - 1];
        if (typeof lastPathPart !== 'number') {
          throw new Error('index() cannot be used on non-arrays');
        }
        return lastPathPart;
      };

      if (isFocusedOnSinglePath) {
        data = getIndexOfPath(paths[0]);
      } else {
        data = paths.map(indexPath => getIndexOfPath(indexPath));
      }
    } else {
      assertUnreachable(pathPart);
    }
  }

  if (!resolvedAnnotations) {
    /**
     * TODO:
     * When creating default values (resolvedAnnotations === undefined), we should detect a situation that a default value
     * depends on a field whose value is computed. In order to do so we should look at the fieldDependencyCache and just check
     * if there's a computed value annotation definition for the field. If there is one, we should throw an error saying
     * that it's not a supported situation, instead of just passing the uncomputed value to the resolver.
     *
     * In order to do this we need to pass the fieldDependencyCache here, as well as create a new function that allows us
     * to check the existence of the annotation statically.
     */
  }

  return data;
};

export default resolveDependency;
