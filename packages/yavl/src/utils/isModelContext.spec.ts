import isModelContext from './isModelContext';

describe('isModelContext', () => {
  it('should return true for internal, extensible context', () => {
    expect(
      isModelContext({
        type: 'internal',
        pathToField: [],
      }),
    ).toBe(true);

    expect(
      isModelContext({
        type: 'internal',
        pathToField: [],
        nonExtensible: false,
      }),
    ).toBe(true);
  });

  it('should return false for internal, non-extensible context', () => {
    expect(
      isModelContext({
        type: 'internal',
        pathToField: [],
        nonExtensible: true,
      }),
    ).toBe(false);
  });

  it('should return false for external', () => {
    expect(
      isModelContext({
        type: 'external',
        pathToField: [],
      }),
    ).toBe(false);
  });
});
