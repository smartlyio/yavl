jest.mock('./createErrorCacheEntry');

import createValidationContext from './createValidationContext';
import createErrorCacheEntry from './createErrorCacheEntry';

describe('createValidationContext', () => {
  const mockModel: any = { mock: 'model' };
  const mockCache: any = { mock: 'cache' };
  const mockExternalData: any = { mock: 'externalData' };

  beforeEach(() => {
    jest.mocked(createErrorCacheEntry).mockReturnValue(mockCache);
  });

  describe('wihout external data', () => {
    it('should create expected context', () => {
      const context = createValidationContext(mockModel);
      expect(context).toEqual({
        model: mockModel,
        previousData: undefined,
        previousExternalData: undefined,
        cache: mockCache,
        resolvedAnnotations: { current: {} },
        resolvedValidations: { current: {} },
        subscriptions: {
          fieldAnnotation: new Map(),
          annotations: new Set()
        },
        pendingChangedAnnotations: new Map(),
        transactionCounter: 0
      });
    });
  });

  describe('with external data', () => {
    it('should create expected context', () => {
      const context = createValidationContext(mockModel, mockExternalData);
      expect(context).toEqual({
        model: mockModel,
        previousData: undefined,
        previousExternalData: mockExternalData,
        cache: mockCache,
        resolvedAnnotations: { current: {} },
        resolvedValidations: { current: {} },
        subscriptions: {
          fieldAnnotation: new Map(),
          annotations: new Set()
        },
        pendingChangedAnnotations: new Map(),
        transactionCounter: 0
      });
    });
  });
});
