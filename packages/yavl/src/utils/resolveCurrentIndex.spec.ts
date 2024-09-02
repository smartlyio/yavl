import resolveCurrentIndex from './resolveCurrentIndex';

describe('resolveCurrentIndex', () => {
  describe('when index is found', () => {
    it('should return the index for the field', () => {
      const result = resolveCurrentIndex('path.to[0].field', {
        'path.to[0].field': 2,
      });
      expect(result).toBe(2);
    });
  });

  describe('when index is not found', () => {
    it('should throw an error', () => {
      expect(() => resolveCurrentIndex('path.to[0].field', {})).toThrowErrorMatchingInlineSnapshot(
        `"Current index for path path.to[0].field not found"`,
      );
    });
  });
});
