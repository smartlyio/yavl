import decorate from './decorate';
import { ModelContext } from '../types';
import validate, { ValidateFn } from './validate';
import when from './when';

describe('decorate', () => {
  const testContext: ModelContext<any> = {
    type: 'internal',
    pathToField: [],
  };

  let decoratedFn: ValidateFn;
  let result: any;

  const condition = () => true;
  const validator = () => undefined;

  beforeEach(() => {
    decoratedFn = decorate(validate, definitions => when({}, condition, () => definitions));
  });

  it('should return a new function', () => {
    expect(typeof decoratedFn).toBe('function');
  });

  describe('when decorated function is called', () => {
    beforeEach(() => {
      result = decoratedFn(testContext, validator);
    });

    it('should return decorated definitions', () => {
      expect(result).toEqual([
        {
          children: [
            {
              context: {
                pathToField: [],
                type: 'internal',
              },
              dependencies: undefined,
              type: 'validate',
              validators: [validator],
            },
          ],
          dependencies: {},
          testFn: condition,
          type: 'when',
        },
      ]);
    });
  });
});
