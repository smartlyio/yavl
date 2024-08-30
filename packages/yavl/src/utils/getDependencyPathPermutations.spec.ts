import getDependencyPathPermutations from './getDependencyPathPermutations';

const assertPaths = (pathsA: string[], pathsB: string[]) => {
  expect(pathsA.sort()).toEqual(pathsB.sort());
};

describe('getDependencyPathPermutations', () => {
  describe('with internal dependency', () => {
    it('should prefix the path with internal:', () => {
      assertPaths(getDependencyPathPermutations('internal', ['test']), [
        'internal:test'
      ]);
    });

    describe('with no array access', () => {
      it('should return single permutation with empty path', () => {
        assertPaths(getDependencyPathPermutations('internal', []), [
          'internal:'
        ]);
      });

      it('should return single permutation with multiple fields', () => {
        assertPaths(
          getDependencyPathPermutations('internal', ['nested', 'field']),
          ['internal:nested.field']
        );
      });
    });

    describe('with array access', () => {
      it('should return correct index/all/current permutations with simple array access', () => {
        assertPaths(getDependencyPathPermutations('internal', ['array', 0]), [
          'internal:array[0]',
          'internal:array[all]',
          'internal:array[current]'
        ]);
      });

      it('should return correct all/current permutations with array at beginning of path', () => {
        assertPaths(getDependencyPathPermutations('internal', [0, 'field']), [
          'internal:[0].field',
          'internal:[all].field',
          'internal:[current].field'
        ]);
      });

      it('should return correct all/current permutations with only array in path', () => {
        assertPaths(getDependencyPathPermutations('internal', [0]), [
          'internal:[0]',
          'internal:[all]',
          'internal:[current]'
        ]);
      });

      it('should return correct all/current permutations with multiple array accesses', () => {
        assertPaths(
          getDependencyPathPermutations('internal', [
            'array',
            0,
            'nested',
            0,
            'more',
            0
          ]),
          [
            'internal:array[0].nested[0].more[0]',
            'internal:array[0].nested[0].more[all]',
            'internal:array[0].nested[all].more[0]',
            'internal:array[0].nested[all].more[all]',
            'internal:array[all].nested[0].more[0]',
            'internal:array[all].nested[0].more[all]',
            'internal:array[all].nested[all].more[0]',
            'internal:array[all].nested[all].more[all]',
            'internal:array[current].nested[0].more[0]',
            'internal:array[current].nested[0].more[all]',
            'internal:array[current].nested[all].more[0]',
            'internal:array[current].nested[all].more[all]',
            'internal:array[current].nested[current].more[0]',
            'internal:array[current].nested[current].more[all]',
            'internal:array[current].nested[current].more[current]'
          ]
        );
      });
    });
  });

  describe('with external dependency', () => {
    describe('with no array access', () => {
      it('should return single permutation with empty path', () => {
        assertPaths(getDependencyPathPermutations('external', []), [
          'external:'
        ]);
      });

      it('should return single permutation with multiple fields', () => {
        assertPaths(
          getDependencyPathPermutations('external', ['nested', 'field']),
          ['external:nested.field']
        );
      });
    });

    describe('with array access', () => {
      it('should return only index and all permutation with simple array access', () => {
        assertPaths(getDependencyPathPermutations('external', ['array', 0]), [
          'external:array[0]',
          'external:array[all]'
        ]);
      });

      it('should return only all permutation with multiple array accesses', () => {
        assertPaths(
          getDependencyPathPermutations('external', [
            'array',
            0,
            'nested',
            0,
            'more',
            0
          ]),
          [
            'external:array[0].nested[0].more[0]',
            'external:array[0].nested[0].more[all]',
            'external:array[0].nested[all].more[0]',
            'external:array[0].nested[all].more[all]',
            'external:array[all].nested[0].more[0]',
            'external:array[all].nested[0].more[all]',
            'external:array[all].nested[all].more[0]',
            'external:array[all].nested[all].more[all]'
          ]
        );
      });
    });
  });
});
