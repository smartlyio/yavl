import { createAnnotation } from '../annotations';
import modelPathToStr from './modelPathToStr';

describe('modelPathToStr', () => {
  it('single field', () => {
    expect(modelPathToStr('internal', [{ type: 'field', name: 'test' }])).toBe('internal:test');
  });

  it('single index array focus', () => {
    expect(modelPathToStr('internal', [{ type: 'array', focus: 'index', index: 1, multiToSingleFocus: false }])).toBe(
      'internal:[1]',
    );
  });

  it('single current array focus', () => {
    expect(modelPathToStr('internal', [{ type: 'array', focus: 'current' }])).toBe('internal:[current]');
  });

  it('single all array focus', () => {
    expect(modelPathToStr('internal', [{ type: 'array', focus: 'all' }])).toBe('internal:[all]');
  });

  it('multiple fields and array focuses mixed', () => {
    expect(
      modelPathToStr('internal', [
        { type: 'field', name: 'test' },
        { type: 'array', focus: 'current' },
        { type: 'array', focus: 'all' },
        { type: 'field', name: 'nested' },
        { type: 'array', focus: 'all' },
      ]),
    ).toBe('internal:test[current][all].nested[all]');
  });

  it('at focus after array all', () => {
    expect(
      modelPathToStr('internal', [
        { type: 'field', name: 'test' },
        { type: 'array', focus: 'current' },
        { type: 'array', focus: 'all' },
        { type: 'field', name: 'nested' },
        { type: 'array', focus: 'index', index: 1, multiToSingleFocus: true },
      ]),
    ).toBe('internal:test[current][all].nested');
  });

  it('external paths', () => {
    expect(modelPathToStr('external', [{ type: 'field', name: 'test' }])).toBe('external:test');
  });

  it('annotations', () => {
    const annotation = createAnnotation<boolean>('foobar');

    expect(
      modelPathToStr('internal', [
        { type: 'field', name: 'test' },
        { type: 'annotation', annotation, defaultValue: { hasValue: false } },
      ]),
    ).toBe('internal:test/foobar');
  });
});
