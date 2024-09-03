jest.mock('./resolveModelPathStr');
jest.mock('../utils/resolveCurrentIndex');

import findErrorCacheEntry from './findErrorCacheEntry';
import resolveModelPathStr from './resolveModelPathStr';
import resolveCurrentIndex from '../utils/resolveCurrentIndex';
import * as createErrorCacheEntry from './createErrorCacheEntry';
import { PathToField } from '../types';
import { ModelValidationCache } from './types';

const createErrorCacheEntrySpy = jest.spyOn(createErrorCacheEntry, 'default');

const createMockCacheEntry = (isPathActive: boolean): ModelValidationCache<any> => {
  return {
    isPathActive,
    annotations: new Map(),
    errors: new Map(),
    children: new Map(),
  };
};

describe('findErrorCacheEntry', () => {
  const pathToArrayField: PathToField = [
    { type: 'field', name: 'list' },
    { type: 'array', focus: 'current' },
  ];

  const arrayDefinition: any = {
    type: 'array',
    context: {
      pathToField: pathToArrayField,
    },
  };

  const existingDefinition: any = {
    type: 'when',
    mock: 'existingDefinition',
  };

  const inactiveDefinition: any = {
    type: 'when',
    mock: 'inactiveDefinition',
  };

  const missingDefinition: any = {
    type: 'when',
    mock: 'missingDefinition',
  };

  const mockCurrentIndices: any = {
    mock: 'mockCurrentIndices',
  };

  let existingEntryOuter: ModelValidationCache<any>;
  let existingEntryInner: ModelValidationCache<any>;
  let inactiveEntryInner: ModelValidationCache<any>;

  let arrayElemEntry: ModelValidationCache<any>;
  let arrayEntry: ModelValidationCache<any>;

  let mockCache: ModelValidationCache<any>;
  let result: any;

  beforeEach(() => {
    // create mock cache
    existingEntryOuter = createMockCacheEntry(true);
    existingEntryInner = createMockCacheEntry(true);
    inactiveEntryInner = createMockCacheEntry(false);

    arrayElemEntry = createMockCacheEntry(true);
    arrayEntry = createMockCacheEntry(true);
    arrayEntry.children.set(0, arrayElemEntry);

    existingEntryOuter.children.set(existingDefinition, existingEntryInner);
    existingEntryOuter.children.set(inactiveDefinition, inactiveEntryInner);

    mockCache = createMockCacheEntry(true);
    mockCache.children.set(existingDefinition, existingEntryOuter);
    mockCache.children.set(arrayDefinition, arrayEntry);
  });

  describe('path already exists in cache', () => {
    const definitions = [existingDefinition, existingDefinition];

    beforeEach(() => {
      result = findErrorCacheEntry(mockCache, definitions, mockCurrentIndices);
    });

    it('should return correct entry', () => {
      expect(result).toBe(existingEntryInner);
    });

    it('should not create any new entries', () => {
      expect(createErrorCacheEntrySpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('path does not exist in cache', () => {
    describe('with one entry missing', () => {
      const definitions = [existingDefinition, missingDefinition];

      beforeEach(() => {
        result = findErrorCacheEntry(mockCache, definitions, mockCurrentIndices);
      });

      it('should create one new entry', () => {
        expect(createErrorCacheEntrySpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('with multiple entries missing', () => {
      const definitions = [missingDefinition, missingDefinition];

      beforeEach(() => {
        result = findErrorCacheEntry(mockCache, definitions, mockCurrentIndices);
      });

      it('should create all new entries', () => {
        expect(createErrorCacheEntrySpy).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('with array in path', () => {
    beforeEach(() => {
      jest.mocked(resolveModelPathStr).mockReturnValue('list');
      jest.mocked(resolveCurrentIndex).mockReturnValue(0);
    });

    describe('with array as last item in the path', () => {
      const definitions = [arrayDefinition];

      describe('with resolveLastEntryIfArray = true', () => {
        beforeEach(() => {
          result = findErrorCacheEntry(mockCache, definitions, mockCurrentIndices, true);
        });

        it('should resolve the path to array', () => {
          expect(resolveModelPathStr).toHaveBeenCalledTimes(1);
          expect(resolveModelPathStr).toHaveBeenCalledWith(pathToArrayField.slice(0, -1), mockCurrentIndices);
        });

        it('should resolve the current index for the resolved array path', () => {
          expect(resolveCurrentIndex).toHaveBeenCalledTimes(1);
          expect(resolveCurrentIndex).toHaveBeenCalledWith('list', mockCurrentIndices);
        });

        it('should return the cache for array item', () => {
          expect(result).toBe(arrayElemEntry);
        });
      });

      describe('with resolveLastEntryIfArray = false', () => {
        beforeEach(() => {
          result = findErrorCacheEntry(mockCache, definitions, mockCurrentIndices, false);
        });

        it('should not resolve the active item for array', () => {
          expect(resolveModelPathStr).toHaveBeenCalledTimes(0);
        });

        it('should not resolve the current index for the resolved array path', () => {
          expect(resolveCurrentIndex).toHaveBeenCalledTimes(0);
        });

        it('should return the cache for array itself', () => {
          expect(result).toBe(arrayEntry);
        });
      });
    });

    describe('with array in middle of the path', () => {
      const definitions = [arrayDefinition, 0, missingDefinition];

      describe('with resolveLastEntryIfArray = false', () => {
        beforeEach(() => {
          result = findErrorCacheEntry(mockCache, definitions, mockCurrentIndices, false);
        });

        it('should resolve the path to array', () => {
          expect(resolveModelPathStr).toHaveBeenCalledTimes(1);
          expect(resolveModelPathStr).toHaveBeenCalledWith(pathToArrayField.slice(0, -1), mockCurrentIndices);
        });

        it('should resolve the current index for the resolved array path', () => {
          expect(resolveCurrentIndex).toHaveBeenCalledTimes(1);
          expect(resolveCurrentIndex).toHaveBeenCalledWith('list', mockCurrentIndices);
        });
      });
    });
  });

  describe('with inactive paths', () => {
    const definitions = [existingDefinition, inactiveDefinition, missingDefinition];

    describe('with followInactivePath = true', () => {
      beforeEach(() => {
        result = findErrorCacheEntry(mockCache, definitions, mockCurrentIndices, false, true);
      });

      it('should create a new entry after the inactive one', () => {
        expect(createErrorCacheEntrySpy).toHaveBeenCalledTimes(1);
      });

      it('should return the newly created entry', () => {
        expect(result).toBe(createErrorCacheEntrySpy.mock.results[0].value);
      });
    });

    describe('with followInactivePath = false', () => {
      beforeEach(() => {
        result = findErrorCacheEntry(mockCache, definitions, mockCurrentIndices, false, false);
      });

      it('should not create a new entry after the inactive one', () => {
        expect(createErrorCacheEntrySpy).toHaveBeenCalledTimes(0);
      });

      it('should return the last inactive path', () => {
        expect(result).toBe(inactiveEntryInner);
      });
    });
  });
});
