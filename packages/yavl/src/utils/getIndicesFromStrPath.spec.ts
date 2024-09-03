import getIndicesFromStrPath from './getIndicesFromStrPath';

describe('getIndicesFromStrPath', () => {
  it('should return correct indices for path', () => {
    const result = getIndicesFromStrPath('nested[1].path.to[0][2].array');
    expect(result).toEqual({
      nested: 1,
      'nested[1].path.to': 0,
      'nested[1].path.to[0]': 2,
    });
  });

  it('should return correct indices for path when path starts with array', () => {
    const result = getIndicesFromStrPath('[1].path.to[0][2].array');
    expect(result).toEqual({
      '': 1,
      '[1].path.to': 0,
      '[1].path.to[0]': 2,
    });
  });

  it('should throw an error for invalid format', () => {
    expect(() => getIndicesFromStrPath('invalid[123.array')).toThrowErrorMatchingInlineSnapshot(
      `"Invalid path, array not in correct format"`,
    );
  });
});
