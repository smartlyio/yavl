jest.mock('./checkParentConditions');
jest.mock('./findErrorCacheEntry');
jest.mock('./updateChangedAnnotation');

import checkParentConditions from './checkParentConditions';
import createErrorCacheEntry from './createErrorCacheEntry';
import findErrorCacheEntry from './findErrorCacheEntry';
import getProcessingCacheForField from './getProcessingCacheForField';
import { updateChangedAnnotation } from './updateChangedAnnotation';
import { ModelValidationCache, ProcessingContext } from './types';
import { getMockProcessingContext } from '../../tests/helpers/getMockProcessingContext';
import { AnnotateDefinition, RecursiveDefinition } from '../types';
import { createAnnotation } from '../annotations';
import processAnnotation from './processAnnotation';

describe('processAnnotation', () => {
  let mockProcessingContext: ProcessingContext<any, any, any>;
  let testCacheEntry: ModelValidationCache<any>;

  const testAnnotation = createAnnotation('test');

  const mockAnnotateDefinition: AnnotateDefinition = {
    type: 'annotation',
    context: {
      type: 'internal',
      pathToField: [
        { type: 'field', name: 'mock' },
        { type: 'field', name: 'field' },
      ],
    },
    annotation: testAnnotation,
    value: 'test value',
  };

  const mockParentDefinitions: RecursiveDefinition<any>[] = [];
  const data = { mock: 'data' };
  const externalData = { mock: 'externalData' };
  const currentIndices = {};

  beforeEach(() => {
    mockProcessingContext = getMockProcessingContext({
      data,
      externalData,
    });
    testCacheEntry = createErrorCacheEntry<any>();

    jest.mocked(findErrorCacheEntry).mockReturnValue(testCacheEntry);
  });

  describe('when path is active', () => {
    beforeEach(() => {
      jest.mocked(checkParentConditions).mockReturnValue(true);
    });

    describe('and annotation for field has not yet been processed', () => {
      beforeEach(() => {
        processAnnotation(mockProcessingContext, mockAnnotateDefinition, mockParentDefinitions, currentIndices);
      });

      it('should update the annotation value for the field', () => {
        expect(testCacheEntry.annotations).toEqual(
          new Map([['mock.field', new Map([[mockAnnotateDefinition, { [testAnnotation]: 'test value' }]])]]),
        );
      });

      it('should mark annotation as changed for the field', () => {
        expect(updateChangedAnnotation).toHaveBeenCalledTimes(1);
        expect(updateChangedAnnotation).toHaveBeenCalledWith(mockProcessingContext, 'mock.field', testAnnotation);
      });
    });

    describe('and annotation for field has already been processed', () => {
      beforeEach(() => {
        const cache = getProcessingCacheForField(
          mockProcessingContext.fieldProcessingCache,
          '', // closest array cache
        );

        cache.processedAnnotationDefinitions.set(mockAnnotateDefinition, 'processed');

        processAnnotation(mockProcessingContext, mockAnnotateDefinition, mockParentDefinitions, currentIndices);
      });

      it('should not update the annotation value for the field', () => {
        expect(testCacheEntry.annotations).toEqual(new Map());
      });

      it('should not mark annotation as changed for the field', () => {
        expect(updateChangedAnnotation).not.toHaveBeenCalled();
      });
    });
  });

  describe('when path is inactive', () => {
    beforeEach(() => {
      jest.mocked(checkParentConditions).mockReturnValue(false);

      processAnnotation(mockProcessingContext, mockAnnotateDefinition, mockParentDefinitions, currentIndices);
    });

    it('should not update the annotation value for the field', () => {
      expect(testCacheEntry.annotations).toEqual(new Map());
    });

    it('should not mark annotation as changed for the field', () => {
      expect(updateChangedAnnotation).not.toHaveBeenCalled();
    });
  });
});
