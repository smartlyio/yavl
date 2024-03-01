jest.mock('./annotate');
jest.mock('./validate');
jest.mock('./validator');
jest.mock('./when');

import makeRequired, { MakeRequiredFn } from './required';
import annotate from './annotate';
import validate from './validate';
import validator from './validator';
import when from './when';

describe('required', () => {
  const testFn = jest.fn();
  const modelDefinitionFn = jest.fn();
  const validatorFn = jest.fn();

  const annoteDefinition: any = {
    mock: 'annoteDefinition'
  };

  const validateDefinition: any = {
    mock: 'validateDefinition'
  };

  const whenDefinition: any = {
    mock: 'whenDefinition'
  };

  const parentContext: any = {
    mock: 'parentContext'
  };

  const whenContext: any = {
    mock: 'whenContext'
  };

  let required: ReturnType<MakeRequiredFn<any>>;

  beforeEach(() => {
    required = makeRequired(testFn);
  });

  describe('makeRequired', () => {
    it('should return a required function', () => {
      expect(typeof required).toBe('function');
    });
  });

  describe('when calling returned required function', () => {
    let result: ReturnType<typeof required>;

    beforeEach(() => {
      jest.mocked(annotate).mockReturnValueOnce(annoteDefinition);
      jest.mocked(validator).mockReturnValueOnce(validatorFn);
      jest.mocked(validate).mockReturnValueOnce(validateDefinition);
      jest.mocked(when).mockImplementation((...args: any[]) => {
        args[2](whenContext);
        return whenDefinition;
      });
    });

    describe('when modelDefinitionFn is provided', () => {
      beforeEach(() => {
        result = required(parentContext, 'Test error', modelDefinitionFn);
      });

      it('should call validator with the given testFn and error', () => {
        expect(validator).toHaveBeenCalledTimes(1);
        expect(validator).toHaveBeenCalledWith(testFn, 'Test error');
      });

      it('should call validate with the expected validator', () => {
        expect(validate).toHaveBeenCalledTimes(1);
        expect(validate).toHaveBeenCalledWith(
          parentContext,
          parentContext,
          validatorFn
        );
      });

      it('should call when with the given testFn and modelDefinitionFn', () => {
        expect(when).toHaveBeenCalledTimes(1);
        expect(when).toHaveBeenCalledWith(
          parentContext,
          testFn,
          modelDefinitionFn
        );
      });

      it('should call provided modelDefinitionFn', () => {
        expect(modelDefinitionFn).toHaveBeenCalledTimes(1);
      });

      it('should return annotation, validation and when definitions', () => {
        expect(result).toEqual([
          annoteDefinition,
          validateDefinition,
          whenDefinition
        ]);
      });
    });

    describe('when modelDefinitionFn is not provided', () => {
      beforeEach(() => {
        result = required(parentContext, 'Test error');
      });

      it('should call validator with the given testFn and error', () => {
        expect(validator).toHaveBeenCalledTimes(1);
        expect(validator).toHaveBeenCalledWith(testFn, 'Test error');
      });

      it('should call validate with the expected validator', () => {
        expect(validate).toHaveBeenCalledTimes(1);
        expect(validate).toHaveBeenCalledWith(
          parentContext,
          parentContext,
          validatorFn
        );
      });

      it('should not call when', () => {
        expect(when).toHaveBeenCalledTimes(0);
      });

      it('should return an annotation and validation definitions', () => {
        expect(result).toEqual([annoteDefinition, validateDefinition]);
      });
    });
  });
});
