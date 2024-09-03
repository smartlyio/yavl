import as from './as';
import { ModelContext } from '../types';

describe('as', () => {
  const field: ModelContext<any> = {
    type: 'internal',
    pathToField: [{ type: 'field', name: 'test' }],
  };

  it('should return itself', () => {
    expect(Object.is(as(field), field)).toBe(true);
  });
});
