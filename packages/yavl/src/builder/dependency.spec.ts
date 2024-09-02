import dependency from './dependency';
import array from './array';
import { FieldFocus, AnyModelContext } from '../types';

describe('dependency', () => {
  describe('with internal dependencies', () => {
    const parent: FieldFocus = {
      type: 'field',
      name: 'parent',
    };

    const parentField: AnyModelContext<any> = {
      type: 'internal',
      pathToField: [parent],
    };

    describe('with field dependencies', () => {
      it('should return correct path for single field', () => {
        expect(dependency(parentField, 'child')).toEqual({
          type: 'internal',
          pathToField: [parent, { type: 'field', name: 'child' }],
        });
      });
    });

    describe('with array dependencies', () => {
      it('should return correct path for current focus', () => {
        expect(dependency(parentField, array.current)).toEqual({
          type: 'internal',
          pathToField: [parent, { type: 'array', focus: 'current' }],
        });
      });

      it('should return correct path for all focus', () => {
        expect(dependency(parentField, array.all)).toEqual({
          type: 'internal',
          pathToField: [parent, { type: 'array', focus: 'all' }],
          multiFocus: true,
        });
      });
    });

    describe('with nested and mixed dependencies', () => {
      it('should return correct path', () => {
        expect(
          dependency(
            parentField,
            'values',
            // @ts-expect-error - TODO: type externalData better for the test
            array.current,
            'nested',
            array.all,
            'id',
          ),
        ).toEqual({
          type: 'internal',
          pathToField: [
            parent,
            { type: 'field', name: 'values' },
            { type: 'array', focus: 'current' },
            { type: 'field', name: 'nested' },
            { type: 'array', focus: 'all' },
            { type: 'field', name: 'id' },
          ],
          multiFocus: true,
        });
      });
    });
  });

  describe('with external dependencies', () => {
    const externalData: AnyModelContext<any> = {
      type: 'external',
      pathToField: [],
    };

    it('should return correct path', () => {
      const result = dependency(
        externalData,
        'values',
        // @ts-expect-error - TODO: type externalData better for the test
        array.current,
        'nested',
        array.all,
        'id',
      );

      expect(result).toEqual({
        type: 'external',
        pathToField: [
          { type: 'field', name: 'values' },
          { type: 'array', focus: 'current' },
          { type: 'field', name: 'nested' },
          { type: 'array', focus: 'all' },
          { type: 'field', name: 'id' },
        ],
        multiFocus: true,
      });
    });
  });
});
