import createErrorCacheEntry from './createErrorCacheEntry';

describe('createErrorCacheEntry', () => {
  it('should return expected entry', () => {
    expect(createErrorCacheEntry()).toMatchInlineSnapshot(`
      {
        "annotations": Map {},
        "children": Map {},
        "errors": Map {},
        "isPathActive": true,
      }
    `);
  });
});
