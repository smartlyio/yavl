import resolveModelPath from './resolveModelPath';

describe('resolveModelPath', () => {
  const currentIndices = {
    '': 10,
    firstArray: 0,
    'firstArray[0].secondArray': 5,
    'firstArray[0].secondArray[5]': 2
  };

  it('should return empty array for empty path', () => {
    expect(resolveModelPath([], currentIndices)).toEqual([]);
  });

  it('should resolve path with fields', () => {
    expect(
      resolveModelPath(
        [
          { type: 'field', name: 'path' },
          { type: 'field', name: 'to' },
          { type: 'field', name: 'field' }
        ],
        currentIndices
      )
    ).toEqual(['path', 'to', 'field']);
  });

  it('should resolve path with current array accesses', () => {
    expect(
      resolveModelPath(
        [
          { type: 'field', name: 'firstArray' },
          { type: 'array', focus: 'current' },
          { type: 'field', name: 'secondArray' },
          { type: 'array', focus: 'current' }
        ],
        currentIndices
      )
    ).toEqual(['firstArray', 0, 'secondArray', 5]);
  });

  it('should resolve path with array access at beginning', () => {
    expect(
      resolveModelPath(
        [
          { type: 'array', focus: 'current' },
          { type: 'field', name: 'test' }
        ],
        currentIndices
      )
    ).toEqual([10, 'test']);
  });

  it('should resolve path with nested arrays', () => {
    expect(
      resolveModelPath(
        [
          { type: 'field', name: 'firstArray' },
          { type: 'array', focus: 'current' },
          { type: 'field', name: 'secondArray' },
          { type: 'array', focus: 'current' },
          { type: 'array', focus: 'current' }
        ],
        currentIndices
      )
    ).toEqual(['firstArray', 0, 'secondArray', 5, 2]);
  });

  it('should throw if current index information is missing', () => {
    expect(() =>
      resolveModelPath(
        [
          { type: 'field', name: 'nonExistentArray' },
          { type: 'array', focus: 'current' }
        ],
        currentIndices
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"Trying to access current index of nonExistentArray, but current index missing for the path"`
    );
  });

  it('should throw if trying to access array with all focus', () => {
    expect(() =>
      resolveModelPath(
        [
          { type: 'field', name: 'firstArray' },
          { type: 'array', focus: 'all' }
        ],
        currentIndices
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"All array focus is not supported in resolveModelPath"`
    );
  });
});
