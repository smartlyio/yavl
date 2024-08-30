jest.mock('./validator');

import validate from './validate';
import validator from './validator';
import { ModelContext, SupportedDefinition } from '../types';

describe('validate', () => {
  const context: ModelContext<any> = {
    type: 'internal',
    pathToField: [{ type: 'field', name: 'test' }]
  };

  const dependencies: any = {
    depA: { mock: 'dependency A' },
    depB: { mock: 'dependency B' }
  };

  const error: any = {
    mock: 'error'
  };

  const validatorFn = jest.fn();
  const testFn = jest.fn();

  let result: SupportedDefinition<any>;

  beforeEach(() => {
    jest.mocked(validator).mockReturnValue(validatorFn);
  });

  describe('with context and validator', () => {
    beforeEach(() => {
      result = validate(context, validatorFn);
    });

    it('should not call validator util to build validator', () => {
      expect(validator).toHaveBeenCalledTimes(0);
    });

    it('should return context for context and dependencies', () => {
      expect(result).toMatchInlineSnapshot(`
        {
          "context": {
            "pathToField": [
              {
                "name": "test",
                "type": "field",
              },
            ],
            "type": "internal",
          },
          "dependencies": undefined,
          "type": "validate",
          "validators": [
            [MockFunction],
          ],
        }
      `);
    });
  });

  describe('with dependencies and validator', () => {
    beforeEach(() => {
      result = validate(dependencies, validatorFn);
    });

    it('should not call validator util to build validator', () => {
      expect(validator).toHaveBeenCalledTimes(0);
    });

    it('should return dependencies but no context', () => {
      expect(result).toMatchInlineSnapshot(`
        {
          "context": {
            "depA": {
              "mock": "dependency A",
            },
            "depB": {
              "mock": "dependency B",
            },
          },
          "dependencies": undefined,
          "type": "validate",
          "validators": [
            [MockFunction],
          ],
        }
      `);
    });
  });

  describe('with context, dependencies and validator', () => {
    beforeEach(() => {
      result = validate(context, dependencies, validatorFn);
    });

    it('should not call validator util to build validator', () => {
      expect(validator).toHaveBeenCalledTimes(0);
    });

    it('should return context and dependencies', () => {
      expect(result).toMatchInlineSnapshot(`
        {
          "context": {
            "pathToField": [
              {
                "name": "test",
                "type": "field",
              },
            ],
            "type": "internal",
          },
          "dependencies": {
            "depA": {
              "mock": "dependency A",
            },
            "depB": {
              "mock": "dependency B",
            },
          },
          "type": "validate",
          "validators": [
            [MockFunction],
          ],
        }
      `);
    });
  });

  describe('with context, testFn and error', () => {
    beforeEach(() => {
      result = validate(context, testFn, error);
    });

    it('should call validator util to build validator', () => {
      expect(validator).toHaveBeenCalledTimes(1);
      expect(validator).toHaveBeenCalledWith(testFn, error);
    });

    it('should return context for context and dependencies', () => {
      expect(result).toMatchInlineSnapshot(`
        {
          "context": {
            "pathToField": [
              {
                "name": "test",
                "type": "field",
              },
            ],
            "type": "internal",
          },
          "dependencies": undefined,
          "type": "validate",
          "validators": [
            [MockFunction],
          ],
        }
      `);
    });
  });

  describe('with dependencies, testFn and error', () => {
    beforeEach(() => {
      result = validate(dependencies, testFn, error);
    });

    it('should call validator util to build validator', () => {
      expect(validator).toHaveBeenCalledTimes(1);
      expect(validator).toHaveBeenCalledWith(testFn, error);
    });

    it('should return dependencies but no context', () => {
      expect(result).toMatchInlineSnapshot(`
        {
          "context": {
            "depA": {
              "mock": "dependency A",
            },
            "depB": {
              "mock": "dependency B",
            },
          },
          "dependencies": undefined,
          "type": "validate",
          "validators": [
            [MockFunction],
          ],
        }
      `);
    });
  });

  describe('with context, dependencies testFn and error', () => {
    beforeEach(() => {
      result = validate(context, dependencies, testFn, error);
    });

    it('should call validator util to build validator', () => {
      expect(validator).toHaveBeenCalledTimes(1);
      expect(validator).toHaveBeenCalledWith(testFn, error);
    });

    it('should return context and dependencies', () => {
      expect(result).toMatchInlineSnapshot(`
        {
          "context": {
            "pathToField": [
              {
                "name": "test",
                "type": "field",
              },
            ],
            "type": "internal",
          },
          "dependencies": {
            "depA": {
              "mock": "dependency A",
            },
            "depB": {
              "mock": "dependency B",
            },
          },
          "type": "validate",
          "validators": [
            [MockFunction],
          ],
        }
      `);
    });
  });
});
