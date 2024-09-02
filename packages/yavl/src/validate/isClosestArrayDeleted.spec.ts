import { isClosestArrayDeleted } from './isClosestArrayDeleted';

describe('isClosestArrayDeleted', () => {
  const data = {
    value: 'test',
    list: [{ value: 'inside array', nested: [{}, {}] }, { value: 'another' }],
  };

  it.each`
    field                        | expectedResult
    ${'value'}                   | ${false}
    ${'nonexisting'}             | ${false}
    ${'list[1]'}                 | ${false}
    ${'list[1].value'}           | ${false}
    ${'list[1].nonexisting'}     | ${false}
    ${'list[2]'}                 | ${true}
    ${'list[2].value'}           | ${true}
    ${'list[2].nonexisting'}     | ${true}
    ${'list[0].nested[1].field'} | ${false}
    ${'list[0].nested[2].field'} | ${true}
    ${'list[1].nested[1].field'} | ${true}
    ${'list[1].nested[2].field'} | ${true}
  `('should return $expectedResult for "$field"', ({ field, expectedResult }) => {
    expect(isClosestArrayDeleted(data, field)).toBe(expectedResult);
  });
});
