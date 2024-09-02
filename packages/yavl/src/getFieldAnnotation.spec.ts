jest.mock('./getFieldAnnotations');

import getFieldAnnotation from './getFieldAnnotation';
import getFieldAnnotations from './getFieldAnnotations';
import { createAnnotation } from './annotations';

describe('getFieldAnnotation', () => {
  const mockModel: any = { mock: 'mockModel' };
  const meta = createAnnotation<string>('meta');

  describe('when annotation is found', () => {
    let result: string;

    beforeEach(() => {
      jest.mocked(getFieldAnnotations).mockReturnValue({
        [meta]: 'found',
      });

      result = getFieldAnnotation(mockModel, 'test[0].field', meta);
    });

    it('should call getFieldAnnotations to get all annotations for field', () => {
      expect(getFieldAnnotations).toHaveBeenCalledTimes(1);
      expect(getFieldAnnotations).toHaveBeenCalledWith(mockModel, 'test[0].field');
    });

    it('should return the specified annotation', () => {
      expect(result).toEqual('found');
    });
  });

  describe('when annotation is not found', () => {
    beforeEach(() => {
      jest.mocked(getFieldAnnotations).mockReturnValue({});
    });

    describe('and default value is given', () => {
      it('should return the default value', () => {
        const result = getFieldAnnotation(mockModel, 'test[0].field', meta, 'default value');
        expect(result).toEqual('default value');
      });
    });

    describe('and default value is not given', () => {
      it('should throw an error', () => {
        expect(() => getFieldAnnotation(mockModel, 'test[0].field', meta)).toThrowErrorMatchingInlineSnapshot(
          `"Annotation "meta" not found for test[0].field"`,
        );
      });
    });
  });
});
