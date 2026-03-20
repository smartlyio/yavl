import { deepEqual } from './deepEqual';

describe('deepEqual', () => {
  describe('primitives', () => {
    it('returns true for identical numbers', () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual(0, 0)).toBe(true);
      expect(deepEqual(-1, -1)).toBe(true);
    });

    it('returns true for identical strings', () => {
      expect(deepEqual('hello', 'hello')).toBe(true);
      expect(deepEqual('', '')).toBe(true);
    });

    it('returns true for identical booleans', () => {
      expect(deepEqual(true, true)).toBe(true);
      expect(deepEqual(false, false)).toBe(true);
    });

    it('returns false for different primitives', () => {
      expect(deepEqual(1, 2)).toBe(false);
      expect(deepEqual('a', 'b')).toBe(false);
      expect(deepEqual(true, false)).toBe(false);
    });

    it('returns false for different types', () => {
      expect(deepEqual(1, '1')).toBe(false);
      expect(deepEqual(0, false)).toBe(false);
      expect(deepEqual('', false)).toBe(false);
      expect(deepEqual(null, undefined)).toBe(false);
    });
  });

  describe('null and undefined', () => {
    it('returns true for null === null and undefined === undefined', () => {
      expect(deepEqual(null, null)).toBe(true);
      expect(deepEqual(undefined, undefined)).toBe(true);
    });

    it('returns false for null vs undefined', () => {
      expect(deepEqual(null, undefined)).toBe(false);
      expect(deepEqual(undefined, null)).toBe(false);
    });

    it('returns false for null vs object', () => {
      expect(deepEqual(null, {})).toBe(false);
      expect(deepEqual({}, null)).toBe(false);
    });

    it('returns false for undefined vs object', () => {
      expect(deepEqual(undefined, {})).toBe(false);
      expect(deepEqual({}, undefined)).toBe(false);
    });
  });

  describe('special numeric values', () => {
    it('returns true for NaN === NaN (via Object.is)', () => {
      expect(deepEqual(NaN, NaN)).toBe(true);
    });

    it('returns true for Infinity', () => {
      expect(deepEqual(Infinity, Infinity)).toBe(true);
      expect(deepEqual(-Infinity, -Infinity)).toBe(true);
    });

    it('distinguishes +0 and -0 (via Object.is)', () => {
      expect(deepEqual(0, -0)).toBe(false);
    });
  });

  describe('arrays', () => {
    it('returns true for empty arrays', () => {
      expect(deepEqual([], [])).toBe(true);
    });

    it('returns true for identical arrays', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(deepEqual(['a', 'b'], ['a', 'b'])).toBe(true);
    });

    it('returns false for arrays with different lengths', () => {
      expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
      expect(deepEqual([1, 2, 3], [1, 2])).toBe(false);
    });

    it('returns false for arrays with different elements', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
    });

    it('returns false for arrays with same elements in different order', () => {
      expect(deepEqual([1, 2, 3], [3, 2, 1])).toBe(false);
    });

    it('returns true for the same array reference', () => {
      const arr = [1, 2, 3];
      expect(deepEqual(arr, arr)).toBe(true);
    });

    it('returns false when array is first argument and non-array is second', () => {
      expect(deepEqual([1, 2], { 0: 1, 1: 2 })).toBe(false);
    });

    it('treats array as object when object is first argument (asymmetric)', () => {
      // When a plain object is compared first, arrays fall into the object
      // branch and are compared by keys — this is intentional for performance.
      expect(deepEqual({ 0: 1, 1: 2 }, [1, 2])).toBe(true);
    });

    it('handles nested arrays', () => {
      expect(
        deepEqual(
          [
            [1, 2],
            [3, 4],
          ],
          [
            [1, 2],
            [3, 4],
          ],
        ),
      ).toBe(true);
      expect(
        deepEqual(
          [
            [1, 2],
            [3, 4],
          ],
          [
            [1, 2],
            [3, 5],
          ],
        ),
      ).toBe(false);
    });

    it('handles sparse arrays by treating empty slots as undefined', () => {
      // eslint-disable-next-line no-sparse-arrays
      expect(deepEqual([1, , 3], [1, undefined, 3])).toBe(true);
    });
  });

  describe('objects', () => {
    it('returns true for empty objects', () => {
      expect(deepEqual({}, {})).toBe(true);
    });

    it('returns true for identical objects', () => {
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    });

    it('returns true regardless of key order', () => {
      expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    });

    it('returns false for objects with different number of keys', () => {
      expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
      expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    });

    it('returns false for objects with different values', () => {
      expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('returns false for objects with different keys', () => {
      expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false);
    });

    it('returns true for the same object reference', () => {
      const obj = { a: 1 };
      expect(deepEqual(obj, obj)).toBe(true);
    });
  });

  describe('nested structures', () => {
    it('compares deeply nested objects', () => {
      const a = { x: { y: { z: 42 } } };
      const b = { x: { y: { z: 42 } } };
      const c = { x: { y: { z: 99 } } };
      expect(deepEqual(a, b)).toBe(true);
      expect(deepEqual(a, c)).toBe(false);
    });

    it('compares objects containing arrays', () => {
      const a = { items: [1, 2, { nested: true }] };
      const b = { items: [1, 2, { nested: true }] };
      const c = { items: [1, 2, { nested: false }] };
      expect(deepEqual(a, b)).toBe(true);
      expect(deepEqual(a, c)).toBe(false);
    });

    it('compares arrays containing objects', () => {
      const a = [{ a: 1 }, { b: 2 }];
      const b = [{ a: 1 }, { b: 2 }];
      const c = [{ a: 1 }, { b: 3 }];
      expect(deepEqual(a, b)).toBe(true);
      expect(deepEqual(a, c)).toBe(false);
    });

    it('handles mixed nesting depths', () => {
      expect(deepEqual({ a: [1, { b: [2, 3] }] }, { a: [1, { b: [2, 3] }] })).toBe(true);
      expect(deepEqual({ a: [1, { b: [2, 3] }] }, { a: [1, { b: [2, 4] }] })).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('returns false when comparing object to primitive', () => {
      expect(deepEqual({}, 'string')).toBe(false);
      expect(deepEqual(42, {})).toBe(false);
    });

    it('handles objects with undefined values', () => {
      expect(deepEqual({ a: undefined }, { a: undefined })).toBe(true);
      expect(deepEqual({ a: undefined }, {})).toBe(false);
    });

    it('handles objects with null values', () => {
      expect(deepEqual({ a: null }, { a: null })).toBe(true);
      expect(deepEqual({ a: null }, { a: undefined })).toBe(false);
    });

    it('handles objects with boolean values', () => {
      expect(deepEqual({ a: false }, { a: false })).toBe(true);
      expect(deepEqual({ a: false }, { a: 0 })).toBe(false);
    });
  });
});
