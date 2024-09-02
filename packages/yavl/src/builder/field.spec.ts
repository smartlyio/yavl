import field from './field';
import { ModelContext, SupportedDefinition } from '../types';

describe('field', () => {
  const modelDefinitionFn = jest.fn();

  const modelDefinitions: any = { mock: 'modelDefinitions' };

  const parentContext: ModelContext<any> = {
    type: 'internal',
    pathToField: [{ type: 'field', name: 'parent' }],
  };

  let result: SupportedDefinition<any>;

  describe('when modelDefinitionFn is provided', () => {
    beforeEach(() => {
      jest.mocked(modelDefinitionFn).mockReturnValue(modelDefinitions);

      result = field(parentContext, 'child', modelDefinitionFn);
    });

    it('should call modelDefinitionFn with the correct child field', () => {
      const expectedContext = {
        type: 'internal',
        pathToField: [
          { type: 'field', name: 'parent' },
          { type: 'field', name: 'child' },
        ],
      };

      expect(modelDefinitionFn).toHaveBeenCalledTimes(1);
      expect(modelDefinitionFn).toHaveBeenCalledWith(expectedContext);
    });

    it('should return correct field definition', () => {
      expect(result).toMatchInlineSnapshot(`
        {
          "mock": "modelDefinitions",
        }
      `);
    });
  });

  describe('when modelDefinitionFn is not provided', () => {
    beforeEach(() => {
      result = field(parentContext, 'child');
    });

    it('should return empty field definition', () => {
      expect(result).toMatchInlineSnapshot(`[]`);
    });
  });
});
