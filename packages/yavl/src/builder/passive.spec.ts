import model from '../model';
import { passive } from './passive';

type TestModel = {
  value: string;
  list: string[];
};

type ExternalData = {
  ext: string;
};

describe('passive', () => {
  it('should mark simple contexts as passive', () => {
    model<TestModel, ExternalData>((root, builder) => {
      const value = builder.dep(root, 'value');
      const list = builder.dep(root, 'list', builder.array.all);
      const ext = builder.dep(builder.externalData, 'ext');
      expect(passive(value)).toEqual({
        isPassive: true,
        pathToField: [
          {
            name: 'value',
            type: 'field',
          },
        ],
        type: 'internal',
      });
      expect(passive(list)).toEqual({
        isPassive: true,
        multiFocus: true,
        pathToField: [
          {
            name: 'list',
            type: 'field',
          },
          {
            focus: 'all',
            type: 'array',
          },
        ],
        type: 'internal',
      });
      expect(passive(ext)).toEqual({
        isPassive: true,
        pathToField: [
          {
            name: 'ext',
            type: 'field',
          },
        ],
        type: 'external',
      });
      return [];
    });
  });

  it('should mark dependencies of computed contexts as passive', () => {
    model<TestModel, ExternalData>((root, builder) => {
      const value = builder.dep(root, 'value');
      const list = builder.dep(root, 'list', builder.array.all);
      const ext = builder.dep(builder.externalData, 'ext');
      const computed = builder.compute({ value, list, ext }, () => {
        return 1;
      });
      expect(passive(computed)).toEqual({
        computeFn: expect.any(Function),
        dependencies: {
          ext: {
            isPassive: true,
            pathToField: [
              {
                name: 'ext',
                type: 'field',
              },
            ],
            type: 'external',
          },
          list: {
            isPassive: true,
            multiFocus: true,
            pathToField: [
              {
                name: 'list',
                type: 'field',
              },
              {
                focus: 'all',
                type: 'array',
              },
            ],
            type: 'internal',
          },
          value: {
            isPassive: true,
            pathToField: [
              {
                name: 'value',
                type: 'field',
              },
            ],
            type: 'internal',
          },
        },
        type: 'computed',
      });
      return [];
    });
  });

  it('should mark dependencies as passive in a list', () => {
    model<TestModel, ExternalData>((root, builder) => {
      const value = builder.dep(root, 'value');
      const ext = builder.dep(builder.externalData, 'ext');
      expect(passive([value, ext])).toEqual([
        {
          isPassive: true,
          pathToField: [
            {
              name: 'value',
              type: 'field',
            },
          ],
          type: 'internal',
        },
        {
          isPassive: true,
          pathToField: [
            {
              name: 'ext',
              type: 'field',
            },
          ],
          type: 'external',
        },
      ]);
      return [];
    });
  });

  it('should mark dependencies as passive in an object', () => {
    model<TestModel, ExternalData>((root, builder) => {
      const value = builder.dep(root, 'value');
      const ext = builder.dep(builder.externalData, 'ext');
      expect(passive({ value, ext })).toEqual({
        value: {
          isPassive: true,
          pathToField: [
            {
              name: 'value',
              type: 'field',
            },
          ],
          type: 'internal',
        },
        ext: {
          isPassive: true,
          pathToField: [
            {
              name: 'ext',
              type: 'field',
            },
          ],
          type: 'external',
        },
      });
      return [];
    });
  });

  it('should mark dependencies as passive in nested computed contexts', () => {
    model<TestModel, ExternalData>((root, builder) => {
      const value = builder.dep(root, 'value');
      const ext = builder.dep(builder.externalData, 'ext');
      const computedA = builder.compute({ value }, () => 1);
      const computedB = builder.compute({ computedA, ext }, () => 1);
      expect(passive(computedB)).toEqual({
        computeFn: expect.any(Function),
        dependencies: {
          computedA: {
            computeFn: expect.any(Function),
            dependencies: {
              value: {
                isPassive: true,
                pathToField: [
                  {
                    name: 'value',
                    type: 'field',
                  },
                ],
                type: 'internal',
              },
            },
            type: 'computed',
          },
          ext: {
            isPassive: true,
            pathToField: [
              {
                name: 'ext',
                type: 'field',
              },
            ],
            type: 'external',
          },
        },
        type: 'computed',
      });
      return [];
    });
  });
});
