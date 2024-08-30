import validator from './validator';

describe('validator', () => {
  const testFn = jest.fn();

  const makeValidator = (error: any = 'error') => validator(testFn, error);

  it('should make a validator function', () => {
    const validator = makeValidator();
    expect(typeof validator).toBe('function');
  });

  describe('when validator is called', () => {
    it('should call testFn with the passed arguments', () => {
      const validator = makeValidator();
      validator('a', 'b', 'c');
      expect(testFn).toHaveBeenCalledTimes(1);
      expect(testFn).toHaveBeenCalledWith('a', 'b', 'c');
    });

    describe('when testFn returns true', () => {
      it('should return undefined', () => {
        const validator = makeValidator();
        testFn.mockReturnValueOnce(true);
        const result = validator('a', 'b', 'c');
        expect(result).toBeUndefined();
      });
    });

    describe('when testFn returns false', () => {
      describe('when error is not a function', () => {
        it('should return the passed error', () => {
          const validator = makeValidator('error');
          testFn.mockReturnValueOnce(false);
          const result = validator('a', 'b', 'c');
          expect(result).toBe('error');
        });
      });

      describe('when error is a function', () => {
        const errorFn = jest.fn();
        const validator = makeValidator(errorFn);

        beforeEach(() => {
          testFn.mockReturnValueOnce(false);
          errorFn.mockReturnValue('error from function');
        });

        it('should call the error function with the passed arguments', () => {
          validator('a', 'b', 'c');
          expect(errorFn).toHaveBeenCalledTimes(1);
          expect(errorFn).toHaveBeenCalledWith('a', 'b', 'c');
        });

        it('should return whatever error function returns', () => {
          const result = validator('a', 'b', 'c');
          expect(result).toBe('error from function');
        });
      });
    });
  });
});
