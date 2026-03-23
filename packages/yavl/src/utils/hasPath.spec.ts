import hasPath from './hasPath';

describe('hasPath', () => {
  it('returns true for an empty path', () => {
    expect(hasPath([], { a: 1 })).toBe(true);
    expect(hasPath([], null)).toBe(true);
  });

  it('returns true when the path exists', () => {
    expect(hasPath(['a'], { a: 1 })).toBe(true);
    expect(hasPath(['a', 'b'], { a: { b: 2 } })).toBe(true);
  });

  it('returns true when the value at the path is undefined or null', () => {
    expect(hasPath(['a'], { a: undefined })).toBe(true);
    expect(hasPath(['a'], { a: null })).toBe(true);
  });

  it('returns false when the path does not exist', () => {
    expect(hasPath(['b'], { a: 1 })).toBe(false);
    expect(hasPath(['a', 'c'], { a: { b: 2 } })).toBe(false);
  });

  it('returns false when traversing through a primitive', () => {
    expect(hasPath(['a', 'b'], { a: 42 })).toBe(false);
    expect(hasPath(['a', 'b'], { a: 'string' })).toBe(false);
  });

  it('returns false when traversing through null or undefined', () => {
    expect(hasPath(['a', 'b'], { a: null })).toBe(false);
    expect(hasPath(['a', 'b'], { a: undefined })).toBe(false);
  });

  it('works with numeric keys for array access', () => {
    expect(hasPath([0], ['a', 'b'])).toBe(true);
    expect(hasPath([2], ['a', 'b'])).toBe(false);
    expect(hasPath(['a', 0, 'b'], { a: [{ b: 1 }] })).toBe(true);
    expect(hasPath(['a', 1, 'b'], { a: [{ b: 1 }] })).toBe(false);
  });

  it('returns false for null or undefined root objects with non-empty paths', () => {
    expect(hasPath(['a'], null)).toBe(false);
    expect(hasPath(['a'], undefined)).toBe(false);
  });

  it('handles deeply nested paths', () => {
    const obj = { a: { b: { c: { d: 42 } } } };
    expect(hasPath(['a', 'b', 'c', 'd'], obj)).toBe(true);
    expect(hasPath(['a', 'b', 'c', 'e'], obj)).toBe(false);
  });
});
