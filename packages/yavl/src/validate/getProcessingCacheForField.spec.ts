import getProcessingCacheForField from './getProcessingCacheForField';

describe('getProcessingCacheForField', () => {
  let fieldProcessingCache: any;

  const existingCacheEntry = { mock: 'existingCacheEntry' };

  beforeEach(() => {
    fieldProcessingCache = {};
  });

  it('should return existing cache entry if path', () => {
    fieldProcessingCache['path.to.field'] = existingCacheEntry;
    const result = getProcessingCacheForField(fieldProcessingCache, 'path.to.field');
    expect(result).toBe(existingCacheEntry);
  });

  it('should return new cache entry if path does not exist', () => {
    const sizeBefore = Object.keys(fieldProcessingCache).length;
    const result = getProcessingCacheForField(fieldProcessingCache, 'path.to.field');
    const sizeAfter = Object.keys(fieldProcessingCache).length;
    expect(sizeAfter).toBeGreaterThan(sizeBefore);
    expect(result).toMatchInlineSnapshot(`
      {
        "conditionTestFnResults": Map {},
        "processedAnnotationDefinitions": Map {},
        "processedComputations": Map {},
        "processedConditionDefinitions": Map {},
        "ranValidations": Map {},
      }
    `);
  });
});
