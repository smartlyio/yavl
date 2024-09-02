jest.mock('./when');

import makeOptional, { MakeOptionalFn } from './optional';
import when from './when';

describe('optional', () => {
  const testFn = jest.fn();
  const modelDefinitionFn = jest.fn();

  const whenDefinition: any = {
    mock: 'whenDefinition',
  };

  const parentContext: any = {
    mock: 'parentContext',
  };

  const whenContext: any = {
    mock: 'whenContext',
  };

  let optional: ReturnType<MakeOptionalFn<any>>;

  beforeEach(() => {
    optional = makeOptional(testFn);
  });

  describe('makeOptional', () => {
    it('should return a optional function', () => {
      expect(typeof optional).toBe('function');
    });
  });

  describe('when calling returned optional function', () => {
    let result: ReturnType<typeof optional>;

    beforeEach(() => {
      jest.mocked(when).mockImplementation((...args: any[]) => {
        args[2](whenContext);
        return whenDefinition;
      });

      result = optional(parentContext, modelDefinitionFn);
    });

    it('should call when with the given testFn and modelDefinitionFn', () => {
      expect(when).toHaveBeenCalledTimes(1);
      expect(when).toHaveBeenCalledWith(parentContext, testFn, modelDefinitionFn);
    });

    it('should call provided modelDefinitionFn', () => {
      expect(modelDefinitionFn).toHaveBeenCalledTimes(1);
    });

    it('should return when definition', () => {
      expect(result).toEqual(whenDefinition);
    });
  });
});
