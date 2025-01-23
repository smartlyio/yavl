import { isEmpty } from './isEmpty';

// Copied from ramda 0.30.1
describe('isEmpty', function () {
  it('returns false for null', function () {
    expect(isEmpty(null)).toBe(false);
  });

  it('returns false for undefined', function () {
    expect(isEmpty(undefined)).toBe(false);
  });

  it('returns true for empty string', function () {
    expect(isEmpty('')).toBe(true);
    expect(isEmpty(' ')).toBe(false);
  });

  it('returns true for empty array', function () {
    expect(isEmpty([])).toBe(true);
    expect(isEmpty([[]])).toBe(false);
  });

  it('returns true for empty typed array', function () {
    // @ts-ignore
    expect(isEmpty(Uint8Array.from(''))).toBe(true);
    // @ts-ignore
    expect(isEmpty(Float32Array.from(''))).toBe(true);
    expect(isEmpty(new Float32Array([]))).toBe(true);
    // @ts-ignore
    expect(isEmpty(Uint8Array.from('1'))).toBe(false);
    // @ts-ignore
    expect(isEmpty(Float32Array.from('1'))).toBe(false);
    expect(isEmpty(new Float32Array([1]))).toBe(false);
  });

  it('returns true for empty object', function () {
    expect(isEmpty({})).toBe(true);
    expect(isEmpty({ x: 0 })).toBe(false);
  });

  it('returns true for empty arguments object', function () {
    expect(
      isEmpty(
        (function () {
          // eslint-disable-next-line prefer-rest-params
          return arguments;
        })(),
      ),
    ).toBe(true);
    expect(
      isEmpty(
        (function (_) {
          // eslint-disable-next-line prefer-rest-params
          return arguments;
        })(0),
      ),
    ).toBe(false);
  });

  it('returns false for every other value', function () {
    expect(isEmpty(0)).toBe(false);
    expect(isEmpty(NaN)).toBe(false);
    expect(isEmpty([''])).toBe(false);
  });

  it('returns true for empty Set', function () {
    expect(isEmpty(new Set())).toBe(true);
    expect(isEmpty(new Set([1]))).toBe(false);
  });

  it('returns true for empty Map', function () {
    expect(isEmpty(new Map())).toBe(true);
    expect(isEmpty(new Map([['a', 1]]))).toBe(false);
  });
});
