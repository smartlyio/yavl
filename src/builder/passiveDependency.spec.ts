jest.mock('./dependency');

import dependency from './dependency';
import { FieldFocus, ModelContext } from '../types';
import passiveDependency from './passiveDependency';

describe('passiveDependency', () => {
  let result: ModelContext<any>;

  const parent: FieldFocus = {
    type: 'field',
    name: 'parent'
  };

  const parentContext: ModelContext<any> = {
    type: 'internal',
    pathToField: [parent]
  };

  const childContext: ModelContext<any> = {
    type: 'internal',
    pathToField: [parent, { type: 'field', name: 'child' }]
  };

  beforeEach(() => {
    jest.mocked(dependency).mockReturnValue(childContext as any);

    result = passiveDependency(parentContext, 'child');
  });

  it('should call dependency with exact same arguments', () => {
    expect(dependency).toHaveBeenCalledTimes(1);
    expect(dependency).toHaveBeenCalledWith(parentContext, 'child');
  });

  it('should return the context returned by dependency with added isPassive flagg', () => {
    expect(result).toEqual({ ...childContext, isPassive: true });
  });
});
