import findClosestArrayFromDefinitions from './findClosestArrayFromDefinitions';

describe('findClosestArrayFromDefinitions', () => {
  const definitionWithContext: any = {
    type: 'array',
    context: {
      pathToField: { mock: 'definitionWithContext::pathToField' }
    }
  };

  const definitionWithoutContext: any = {
    type: 'when'
  };

  describe('with definition with context in the list', () => {
    const definitions = [
      definitionWithoutContext,
      definitionWithContext,
      definitionWithoutContext
    ];

    it('should return the last definition with context in list', () => {
      const result = findClosestArrayFromDefinitions(definitions);
      expect(result).toEqual(definitions[1].context.pathToField);
    });
  });

  describe('with no definition with context in the list', () => {
    const definitions = [definitionWithoutContext, definitionWithoutContext];

    it('should return empty path', () => {
      const result = findClosestArrayFromDefinitions(definitions);
      expect(result).toEqual([]);
    });
  });

  describe('with empty definition list', () => {
    it('should return empty path', () => {
      const result = findClosestArrayFromDefinitions([]);
      expect(result).toEqual([]);
    });
  });
});
