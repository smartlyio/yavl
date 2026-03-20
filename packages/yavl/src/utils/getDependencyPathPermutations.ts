type StringOrNumber = string | number;

const splitPathByArray = (path: readonly StringOrNumber[]): [string[], StringOrNumber[]] => {
  const splitIndex = path.findIndex(p => typeof p === 'number');
  const head = splitIndex === -1 ? path.slice() : path.slice(0, splitIndex);
  const tail = splitIndex === -1 ? [] : path.slice(splitIndex);
  return [head as string[], tail];
};

const calculatePermutationsRecursively = (
  basePath: string,
  path: readonly StringOrNumber[],
  includeCurrentPermutations: boolean,
): string[] => {
  // return basePath when there is no more path to recurse
  if (path.length === 0) {
    return [basePath];
  }

  // let's start by splitting the path by arrays
  const [head, tail] = splitPathByArray(path);

  const headPathStr = `${basePath}.${head.join('.')}`;

  if (tail.length === 0) {
    return [headPathStr];
  }

  const index = tail[0];
  const tailWithoutArray = tail.slice(1);

  const indexAndAllPermutations = calculatePermutationsRecursively(
    `${headPathStr}[${index}]`,
    tailWithoutArray,
    false,
  ).concat(calculatePermutationsRecursively(`${headPathStr}[all]`, tailWithoutArray, false));

  if (!includeCurrentPermutations) {
    return indexAndAllPermutations;
  }

  return indexAndAllPermutations.concat(
    calculatePermutationsRecursively(`${headPathStr}[current]`, tailWithoutArray, true),
  );
};

/**
 * Calculates different permutations for dependencies based on a path to data
 * For instance if you have something like:
 *
 * adGroupTemplates[2].targetingSpec.geos[0].country
 *
 * The permutations for that would be:
 *
 * adGroupTemplates[2].targetingSpec.geos[0].country
 * adGroupTemplates[2].targetingSpec.geos[current].country
 * adGroupTemplates[2].targetingSpec.geos[all].country
 * adGroupTemplates[current].targetingSpec.geos[0].country
 * adGroupTemplates[current].targetingSpec.geos[current].country
 * adGroupTemplates[current].targetingSpec.geos[all].country
 * adGroupTemplates[all].targetingSpec.geos[0].country
 * adGroupTemplates[all].targetingSpec.geos[all].country
 *
 * It is not possible to focus [current] items after [all],
 * which is why we don't include those permutations.
 *
 * For external dependencies, the permutations are always using [all],
 * as it is not possible forto have current focus on external data.
 */
const getDependencyPathPermutations = (type: 'internal' | 'external', path: readonly StringOrNumber[]): string[] => {
  const paths = calculatePermutationsRecursively('', path, type === 'internal');

  // remove the leading period and prefix with the dep type
  return paths.map(path => `${type}:${path.substr(1)}`);
};

export default getDependencyPathPermutations;
