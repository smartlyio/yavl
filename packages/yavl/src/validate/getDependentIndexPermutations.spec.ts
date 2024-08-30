import getDependentIndexPermutations from './getDependentIndexPermutations';

describe('getDependentIndexPermutations', () => {
  const mockData: any = {
    listA: [
      {
        innerList: [1, 2]
      }
    ],
    listB: [
      {
        innerList: [1, 2]
      },
      {
        innerList: [3, 4]
      }
    ],
    listC: [
      {
        innerList: [1, 2]
      }
    ],
    listD: []
  };

  const currentIndices = {
    listA: 0,
    'listA[0].innerList': 0,
    listC: 0
  };

  describe('with no arrays', () => {
    it('should return the current indices as only permutation', () => {
      const result = getDependentIndexPermutations(
        [
          { type: 'field', name: 'nested' },
          { type: 'field', name: 'field' }
        ],
        mockData,
        currentIndices
      );
      expect(result).toEqual([currentIndices]);
    });
  });

  describe('with arrays', () => {
    describe('with no data for the array', () => {
      it('should return no indices if the array is empty', () => {
        const result = getDependentIndexPermutations(
          [
            { type: 'field', name: 'listD' },
            { type: 'array', focus: 'current' },
            { type: 'field', name: 'innerList' },
            { type: 'array', focus: 'current' }
          ],
          mockData,
          currentIndices
        );
        expect(mockData.listD).toHaveLength(0);
        expect(result).toEqual([]);
      });

      it('should return no indices if the array is missing from the data', () => {
        const result = getDependentIndexPermutations(
          [
            { type: 'field', name: 'listE' },
            { type: 'array', focus: 'current' },
            { type: 'field', name: 'innerList' },
            { type: 'array', focus: 'current' }
          ],
          mockData,
          currentIndices
        );
        expect(mockData.listE).toBeUndefined();
        expect(result).toEqual([]);
      });
    });

    describe('with all indices known for path', () => {
      it('should return the current indices as only permutation', () => {
        const result = getDependentIndexPermutations(
          [
            { type: 'field', name: 'listA' },
            { type: 'array', focus: 'current' },
            { type: 'field', name: 'innerList' },
            { type: 'array', focus: 'current' }
          ],
          mockData,
          currentIndices
        );
        expect(result).toEqual([currentIndices]);
      });
    });

    describe('with none of the indices known for path', () => {
      it('should return all permutations', () => {
        const result = getDependentIndexPermutations(
          [
            { type: 'field', name: 'listB' },
            { type: 'array', focus: 'current' },
            { type: 'field', name: 'innerList' },
            { type: 'array', focus: 'current' }
          ],
          mockData,
          currentIndices
        );
        expect(result).toEqual([
          { ...currentIndices, listB: 0, 'listB[0].innerList': 0 },
          { ...currentIndices, listB: 0, 'listB[0].innerList': 1 },
          { ...currentIndices, listB: 1, 'listB[1].innerList': 0 },
          { ...currentIndices, listB: 1, 'listB[1].innerList': 1 }
        ]);
      });
    });

    describe('with some of the indices known for path', () => {
      it('should return all permutations for the unknown paths', () => {
        const result = getDependentIndexPermutations(
          [
            { type: 'field', name: 'listC' },
            { type: 'array', focus: 'current' },
            { type: 'field', name: 'innerList' },
            { type: 'array', focus: 'current' }
          ],
          mockData,
          currentIndices
        );
        expect(result).toEqual([
          { ...currentIndices, 'listC[0].innerList': 0 },
          { ...currentIndices, 'listC[0].innerList': 1 }
        ]);
      });
    });

    describe('with explicit indices for path', () => {
      it('should return only single permutation', () => {
        const result = getDependentIndexPermutations(
          [
            { type: 'field', name: 'listB' },
            {
              type: 'array',
              focus: 'index',
              index: 1,
              multiToSingleFocus: false
            },
            { type: 'field', name: 'innerList' },
            {
              type: 'array',
              focus: 'index',
              index: 0,
              multiToSingleFocus: false
            }
          ],
          mockData,
          {}
        );
        expect(result).toEqual([{ listB: 1, 'listB[1].innerList': 0 }]);
      });
    });

    describe('with array all', () => {
      it('should return only single permutation', () => {
        const result = getDependentIndexPermutations(
          [
            { type: 'field', name: 'listB' },
            { type: 'array', focus: 'all' },
            { type: 'field', name: 'innerList' },
            { type: 'array', focus: 'all' }
          ],
          mockData,
          // currentIndices for listB should not affect the output because we have array.all focuses
          { listB: 0 }
        );
        expect(result).toEqual([
          {
            listB: 0,
            'listB[0].innerList': 0
          },
          {
            listB: 0,
            'listB[0].innerList': 1
          },
          {
            listB: 1,
            'listB[1].innerList': 0
          },
          {
            listB: 1,
            'listB[1].innerList': 1
          }
        ]);
      });
    });
  });
});
