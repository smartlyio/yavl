import * as R from 'ramda';
import { noValue, PathToField } from '../types';
import dataPathToStr from '../utils/dataPathToStr';
import { getResolvedAnnotation } from '../utils/resolvedAnnotationsHelpers';
import { assertUnreachable } from '../utils/typeUtils';
import resolveDependencies from './resolveDependencies';
import { MutatingFieldProcessingCacheEntry, ProcessingContext } from './types';
import { pick } from '../utils/pick';

type DependencyReducerContext = {
  data: any;
  paths: Array<Array<string | number>>;
  isFocusedOnSinglePath: boolean;
};

const resolveDependency = <Data, ExternalData, ErrorType>(
  processingContext: ProcessingContext<Data, ExternalData, ErrorType>,
  dependencyType: 'internal' | 'external',
  pathToDependency: PathToField,
  currentIndices: Record<string, number>,
  runCacheForField: MutatingFieldProcessingCacheEntry<any> | undefined,
): any | undefined => {
  const { data: rootData, externalData, resolvedAnnotations, annotationBeingResolved } = processingContext;

  const formOrExternalData = dependencyType === 'internal' ? rootData : externalData;

  const lastPart = R.last(pathToDependency);
  const result = pathToDependency.reduce<DependencyReducerContext>(
    (acc, pathPart): DependencyReducerContext => {
      const { data, paths, isFocusedOnSinglePath } = acc;

      if (pathPart.type === 'field') {
        if (isFocusedOnSinglePath) {
          return {
            ...acc,
            data: data?.[pathPart.name],
            paths: paths.map(path => path.concat(pathPart.name)),
          };
        } else {
          if (data === undefined) {
            return {
              ...acc,
              data: undefined,
              paths: [],
            };
          }

          if (!Array.isArray(data)) {
            throw new Error('data should be array');
          }

          return {
            ...acc,
            data: R.pluck(pathPart.name, data),
            paths: paths.map(path => path.concat(pathPart.name)),
          };
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
          const indexedPaths = pathPart.multiToSingleFocus
            ? paths.length > 0
              ? [paths[pathPart.index]]
              : []
            : paths.map(path => path.concat(pathPart.index));

          if (isSingleFocus) {
            return {
              ...acc,
              data: data?.[pathPart.index],
              paths: indexedPaths,
              isFocusedOnSinglePath: true,
            };
          } else {
            if (data === undefined) {
              return {
                ...acc,
                data: undefined,
                paths: [],
                isFocusedOnSinglePath: false,
              };
            }

            if (!Array.isArray(data)) {
              throw new Error('data should be array');
            }

            return {
              ...acc,
              // the data we pick from is already filtered, so here we use the index as is, not the original one
              data: R.pluck(pathPart.index, data),
              paths: indexedPaths,
              isFocusedOnSinglePath: false,
            };
          }
        } else if (pathPart.focus === 'current') {
          if (!isFocusedOnSinglePath) {
            throw new Error(
              `Trying to focus current array index after already focusing on all elements earlier in the path`,
            );
          }

          const path = paths[0];
          const pathStr = dataPathToStr(path);

          if (dependencyType === 'external') {
            throw new Error(
              `Trying to focus current path of ${pathStr} failed; current focus is not supported for external data`,
            );
          }

          const currentIndex = currentIndices[pathStr];

          if (currentIndex === undefined) {
            throw new Error(`Trying to access current index of ${pathStr}, but current index missing for the path`);
          }

          return {
            ...acc,
            data: isFocusedOnSinglePath ? data?.[currentIndex] : R.pluck(currentIndex, data as any[]),
            paths: paths.map(path => path.concat(currentIndex)),
          };
        } else {
          // if there's no data at this path, reset paths to empty since we're no longer focusing any data
          if (data === undefined) {
            return {
              ...acc,
              data: [],
              paths: [],
              isFocusedOnSinglePath: false,
            };
          }

          if (!Array.isArray(data)) {
            throw new Error('data should be array');
          }

          const arrayData = isFocusedOnSinglePath ? data : R.unnest(data);
          const nextPaths = isFocusedOnSinglePath
            ? data.map((_, idx) => paths[0].concat(idx))
            : paths.flatMap((path, pathIndex) => {
                const nestedData = data[pathIndex];
                // if there's no data at this path, reset paths to empty since we're no longer focusing any data
                if (nestedData === undefined) {
                  return [];
                }
                if (!Array.isArray(nestedData)) {
                  throw new Error('data should be array');
                }
                return nestedData.map((_, idx) => path.concat(idx));
              });

          return {
            ...acc,
            data: arrayData,
            paths: nextPaths,
            isFocusedOnSinglePath: false,
          };
        }
      } else if (pathPart.type === 'annotation') {
        /**
         * The only situation resolvedAnnotations is not defined is when we are in createWithDefaultValues.
         * It's not trivial to support annotations (or computed values) when resolving default values.
         */
        if (!resolvedAnnotations) {
          throw new Error('Using annotations as dependencies to default values is not supported');
        }

        const getAnnotationForField = (path: ReadonlyArray<string | number>) => {
          const pathStr = dataPathToStr(path);

          if (annotationBeingResolved) {
            if (
              annotationBeingResolved.field === pathStr &&
              annotationBeingResolved.annotation === pathPart.annotation
            ) {
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
          return {
            ...acc,
            data: getAnnotationForField(paths[0]),
          };
        } else {
          // Handle the case having array.all of "T | undefined" as dependency.
          // This means that the data itself can be undefined, in which case
          // let's just return an empty array since we're in array.all context.
          if (data === undefined) {
            return { ...acc, data: [] };
          }

          if (!Array.isArray(data)) {
            throw new Error('Expected data to be array');
          }

          return {
            ...acc,
            data: paths.map(path => getAnnotationForField(path)),
          };
        }
      } else if (pathPart.type === 'pick') {
        /**
         * We only need to actually narrow the data if the narrow is the last
         * part of the path. If it's not the last one, the next step will already
         * dive deeper to the data, so the narrowing is lost anyways. This is a
         * minor optimization.
         */
        if (pathPart !== lastPart) {
          return acc;
        }

        /**
         * If we are dealing with an array, we want to pick the keys
         * from every array element, otherwise pick from the object
         */
        const narrowFn = Array.isArray(data) ? R.project(pathPart.keys) : pick.bind(null, pathPart.keys);

        return {
          ...acc,
          data: data !== undefined ? narrowFn(data) : data,
        };
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

          return {
            value,
            index,
          };
        });

        const filteredIndices = filteredDataWithIndices.map(it => it.index);

        return {
          ...acc,
          data: filteredDataWithIndices.map(it => it.value),
          isFocusedOnSinglePath: false,
          paths: paths.filter((_, index) => filteredIndices.includes(index)),
        };
      } else if (pathPart.type === 'path') {
        if (isFocusedOnSinglePath) {
          return {
            ...acc,
            data: dataPathToStr(paths[0]),
          };
        } else {
          return {
            ...acc,
            data: paths.map(path => dataPathToStr(path)),
          };
        }
      } else if (pathPart.type === 'index') {
        const getIndexOfPath = (path: Array<string | number>) => {
          const lastPathPart = R.last(path);
          if (typeof lastPathPart !== 'number') {
            throw new Error('index() cannot be used on non-arrays');
          }
          return lastPathPart;
        };

        if (isFocusedOnSinglePath) {
          return { ...acc, data: getIndexOfPath(paths[0]) };
        } else {
          return { ...acc, data: paths.map(path => getIndexOfPath(path)) };
        }
      } else {
        return assertUnreachable(pathPart);
      }
    },
    {
      data: formOrExternalData,
      paths: [[]],
      isFocusedOnSinglePath: true,
    },
  );

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

  return result.data;
};

export default resolveDependency;
