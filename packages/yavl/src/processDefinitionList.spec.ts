import processDefinitionList from './processDefinitionList';
import { DefinitionList, ModelContext } from './types';

describe('processModelDefinitionList', () => {
  let result: DefinitionList<any>;

  const rootContext: ModelContext<any> = {
    type: 'internal',
    pathToField: [],
  };

  const testDefinition: any = {
    mock: 'testDefinition',
  };

  it('should flatten output definitions', () => {
    result = processDefinitionList([rootContext], [[testDefinition], [testDefinition, testDefinition]]);

    expect(result).toHaveLength(3);
  });
});
