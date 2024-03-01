import withFields from './withFields';
import { ModelContext, SupportedDefinition } from '../types';

describe('withFields', () => {
  const modelDefinitionFn = jest.fn();
  const modelDefinitions: any = { mock: 'modelDefinitions' };

  const parentContext: ModelContext<any> = {
    type: 'internal',
    pathToField: [{ type: 'field', name: 'parent' }]
  };

  let result: SupportedDefinition<any>;

  beforeEach(() => {
    modelDefinitionFn.mockReturnValue(modelDefinitions);

    result = withFields(parentContext, ['childA', 'childB'], modelDefinitionFn);
  });

  it('should call modelDefinitionFn with correct child fieldss', () => {
    const expectedContextA = {
      type: 'internal',
      pathToField: [
        { type: 'field', name: 'parent' },
        { type: 'field', name: 'childA' }
      ]
    };

    const expectedContextB = {
      type: 'internal',
      pathToField: [
        { type: 'field', name: 'parent' },
        { type: 'field', name: 'childB' }
      ]
    };

    expect(modelDefinitionFn).toHaveBeenCalledTimes(1);
    expect(modelDefinitionFn).toHaveBeenCalledWith({
      childA: expectedContextA,
      childB: expectedContextB
    });
  });

  it('should return correct field definition', () => {
    expect(result).toMatchInlineSnapshot(`
      {
        "mock": "modelDefinitions",
      }
    `);
  });
});
