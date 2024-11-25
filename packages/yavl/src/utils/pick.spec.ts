import { pick } from './pick';

// Copied from ramda 0.30.1
describe('pick', function () {
  const obj = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, 1: 7 };

  it('copies the named properties of an object to the new object', function () {
    expect(pick(['a', 'c', 'f'], obj)).toEqual({ a: 1, c: 3, f: 6 });
  });

  it('handles numbers as properties', function () {
    expect(pick([1], obj)).toEqual({ 1: 7 });
  });

  it('ignores properties not included', function () {
    expect(pick(['a', 'c', 'g'], obj)).toEqual({ a: 1, c: 3 });
  });

  it('retrieves prototype properties', function () {
    const F = function (this: Record<'x', unknown>, param: unknown) {
      this.x = param;
    };
    F.prototype.y = 40;
    F.prototype.z = 50;
    // @ts-ignore
    const obj = new F(30);
    obj.v = 10;
    obj.w = 20;
    expect(pick(['w', 'x', 'y'], obj)).toEqual({ w: 20, x: 30, y: 40 });
  });
});
