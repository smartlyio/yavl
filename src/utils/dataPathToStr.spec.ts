import dataPathToStr from './dataPathToStr';

describe('dataPathToStr', () => {
  it('single field', () => {
    expect(dataPathToStr(['test'])).toBe('test');
  });

  it('single index', () => {
    expect(dataPathToStr([0])).toBe('[0]');
  });

  it('multiple fields', () => {
    expect(dataPathToStr(['test', 'nested'])).toBe('test.nested');
  });

  it('multiple indices', () => {
    expect(dataPathToStr([0, 1])).toBe('[0][1]');
  });

  it('fields and indices mixed', () => {
    expect(dataPathToStr(['test', 0, 1, 'nested', 'field'])).toBe(
      'test[0][1].nested.field'
    );
  });
});
