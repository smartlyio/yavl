import { ComputedContext } from '../types';
import isComputedContext from './isComputedContext';

describe('isComputedContext', () => {
  it('should return true for computed context', () => {
    const computedContext: ComputedContext<any> = {
      type: 'computed',
      dependencies: {},
      computeFn: () => {},
    };

    expect(isComputedContext(computedContext)).toBe(true);
  });

  it('should return false for internal context', () => {
    expect(
      isComputedContext({
        type: 'internal',
        pathToField: [],
      }),
    ).toBe(false);
  });

  it('should return false for external context', () => {
    expect(
      isComputedContext({
        type: 'external',
        pathToField: [],
      }),
    ).toBe(false);
  });

  it('should return false for non-context object', () => {
    expect(
      isComputedContext({
        type: 'external',
      }),
    ).toBe(false);
  });
});
