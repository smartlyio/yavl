import { strPathToArray } from './strPathToArray';

describe('strPathToArray', () => {
  it('should support dot syntax', () => {
    const stringPath = 'a.b.c';
    const result = strPathToArray(stringPath);

    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('should support array syntax', () => {
    const stringPath = '[0][1]';
    const result = strPathToArray(stringPath);

    expect(result).toEqual([0, 1]);
  });

  it('should support array and dot syntax together', () => {
    const stringPath = 'a[0].b.c[1]';
    const result = strPathToArray(stringPath);

    expect(result).toEqual(['a', 0, 'b', 'c', 1]);
  });
});
