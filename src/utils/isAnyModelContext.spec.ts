import { ComputedContext } from '../types';
import isAnyModelContext from './isAnyModelContext';

describe('isAnyModelContext', () => {
  it('should return true for internal context', () => {
    expect(
      isAnyModelContext({
        type: 'internal',
        pathToField: []
      })
    ).toBe(true);
  });

  it('should return true for external context', () => {
    expect(
      isAnyModelContext({
        type: 'external',
        pathToField: []
      })
    ).toBe(true);
  });

  it('should return false for computed context', () => {
    const computedContext: ComputedContext<any> = {
      type: 'computed',
      dependencies: {},
      computeFn: () => {}
    };

    expect(isAnyModelContext(computedContext)).toBe(false);
  });

  it('should return false for non-context object', () => {
    expect(
      isAnyModelContext({
        type: 'external'
      })
    ).toBe(false);
  });
});
