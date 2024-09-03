import makeWhen from './makeWhen';
import { ModelContext } from '../types';

describe('when', () => {
  const testFn = jest.fn((_value: any) => true);
  const modelDefinitionFn = jest.fn();
  const elseModelDefinitionFn = jest.fn();

  const modelDefinitions: any = { mock: 'model definitions' };

  const parentContext: ModelContext<any> = {
    type: 'internal',
    pathToField: [{ type: 'field', name: 'parent' }],
  };

  let result: any;

  describe('with model context as data', () => {
    describe('with no else function', () => {
      beforeEach(() => {
        jest.mocked(modelDefinitionFn).mockReturnValue(modelDefinitions);

        result = makeWhen(parentContext, testFn)(modelDefinitionFn);
      });

      it('should call modelDefinitionFn with the correct context', () => {
        expect(modelDefinitionFn).toHaveBeenCalledTimes(1);
        expect(modelDefinitionFn).toHaveBeenCalledWith(parentContext);
      });

      it('should return correct field definition', () => {
        expect(result).toHaveLength(1);
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "children": [
                {
                  "mock": "model definitions",
                },
              ],
              "dependencies": {
                "pathToField": [
                  {
                    "name": "parent",
                    "type": "field",
                  },
                ],
                "type": "internal",
              },
              "testFn": [MockFunction],
              "type": "when",
            },
          ]
        `);
      });
    });

    describe('with else function', () => {
      beforeEach(() => {
        jest.mocked(modelDefinitionFn).mockReturnValue(modelDefinitions);

        result = makeWhen(parentContext, testFn)(modelDefinitionFn, elseModelDefinitionFn);
      });

      it('should call modelDefinitionFn with the correct context', () => {
        expect(modelDefinitionFn).toHaveBeenCalledTimes(1);
        expect(modelDefinitionFn).toHaveBeenCalledWith(parentContext);
      });

      it('should call elseModelDefinitionFn with the correct context', () => {
        expect(elseModelDefinitionFn).toHaveBeenCalledTimes(1);
        expect(elseModelDefinitionFn).toHaveBeenCalledWith(parentContext);
      });

      it('should return correct field definition', () => {
        expect(result).toHaveLength(2);
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "children": [
                {
                  "mock": "model definitions",
                },
              ],
              "dependencies": {
                "pathToField": [
                  {
                    "name": "parent",
                    "type": "field",
                  },
                ],
                "type": "internal",
              },
              "testFn": [MockFunction],
              "type": "when",
            },
            {
              "children": [
                undefined,
              ],
              "dependencies": {
                "pathToField": [
                  {
                    "name": "parent",
                    "type": "field",
                  },
                ],
                "type": "internal",
              },
              "testFn": [Function],
              "type": "when",
            },
          ]
        `);
      });
    });
  });

  describe('with arbitrary data as dependency', () => {
    describe('with no else function', () => {
      beforeEach(() => {
        jest.mocked(modelDefinitionFn).mockReturnValue(modelDefinitions);

        result = makeWhen({ mock: 'arbitrary data' }, testFn)(modelDefinitionFn);
      });

      it('should return correct field definition', () => {
        expect(result).toHaveLength(1);
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "children": [
                {
                  "mock": "model definitions",
                },
              ],
              "dependencies": {
                "mock": "arbitrary data",
              },
              "testFn": [MockFunction],
              "type": "when",
            },
          ]
        `);
      });
    });

    describe('with else function', () => {
      beforeEach(() => {
        jest.mocked(modelDefinitionFn).mockReturnValue(modelDefinitions);

        result = makeWhen({ mock: 'arbitrary data' }, testFn)(modelDefinitionFn, elseModelDefinitionFn);
      });

      it('should return correct field definition', () => {
        expect(result).toHaveLength(2);
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "children": [
                {
                  "mock": "model definitions",
                },
              ],
              "dependencies": {
                "mock": "arbitrary data",
              },
              "testFn": [MockFunction],
              "type": "when",
            },
            {
              "children": [
                undefined,
              ],
              "dependencies": {
                "mock": "arbitrary data",
              },
              "testFn": [Function],
              "type": "when",
            },
          ]
        `);
      });
    });
  });
});
