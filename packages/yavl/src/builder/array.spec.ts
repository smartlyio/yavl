import array from './array';
import { ModelContext, SupportedDefinition } from '../types';

describe('array', () => {
  const modelDefinitionFn = jest.fn();

  const parentContext: ModelContext<any> = {
    type: 'internal',
    pathToField: [{ type: 'field', name: 'parent' }],
  };

  const modelDefinitions: any = { mock: 'model definitions' };

  let result: SupportedDefinition<any>;

  beforeEach(() => {
    jest.mocked(modelDefinitionFn).mockReturnValue(modelDefinitions);

    result = array(parentContext, modelDefinitionFn);
  });

  it('should call modelDefinitionFn with the correct child field', () => {
    const expectedContext: ModelContext<any> = {
      type: 'internal',
      pathToField: [
        { type: 'field', name: 'parent' },
        { type: 'array', focus: 'current' },
      ],
    };

    expect(modelDefinitionFn).toHaveBeenCalledTimes(1);
    expect(modelDefinitionFn).toHaveBeenCalledWith(expectedContext);
  });

  it('should return correct array definition', () => {
    expect(result).toMatchInlineSnapshot(`
      {
        "children": [
          {
            "mock": "model definitions",
          },
        ],
        "context": {
          "pathToField": [
            {
              "name": "parent",
              "type": "field",
            },
            {
              "focus": "current",
              "type": "array",
            },
          ],
          "type": "internal",
        },
        "type": "array",
      }
    `);
  });
});
