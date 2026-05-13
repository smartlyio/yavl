import { createValidationContext, getModelData, model, updateModel } from '../src';
import getValidationErrors from '../src/validate/getValidationErrors';

type TestModel = {
  campaignName: string;
  budget: number;
  computed?: string;
  items: { name: string; value: number }[];
};

describe('updateModel with changedPaths', () => {
  const initialData: TestModel = {
    campaignName: 'test',
    budget: 100,
    items: [
      { name: 'item1', value: 1 },
      { name: 'item2', value: 2 },
    ],
  };

  describe('with computed values', () => {
    const testModel = model<TestModel>((root, builder) => [
      builder.withFields(root, ['campaignName', 'budget', 'computed', 'items'], ({ campaignName, computed }) => [
        builder.value(
          computed,
          builder.compute(campaignName, (name: string) => `computed:${name}`),
        ),
      ]),
    ]);

    it('should produce the same model data with and without changedPaths hint', () => {
      const contextWithHint = createValidationContext(testModel);
      const contextWithoutHint = createValidationContext(testModel);

      updateModel(contextWithHint, initialData);
      updateModel(contextWithoutHint, initialData);

      const updatedData: TestModel = {
        ...initialData,
        campaignName: 'updated',
      };

      updateModel(contextWithHint, updatedData, undefined, {
        changedPaths: [['campaignName']],
      });

      updateModel(contextWithoutHint, updatedData);

      expect(getModelData(contextWithHint)).toEqual(getModelData(contextWithoutHint));
    });

    it('should propagate computed value changes even with changedPaths hint', () => {
      const context = createValidationContext(testModel);
      updateModel(context, initialData);

      const updatedData: TestModel = {
        ...initialData,
        campaignName: 'new-name',
      };

      updateModel(context, updatedData, undefined, {
        changedPaths: [['campaignName']],
      });

      const data = getModelData(context);
      expect(data.computed).toBe('computed:new-name');
    });
  });

  describe('with validations', () => {
    const validateFn = jest.fn();

    const testModel = model<TestModel>((root, builder) => [
      builder.withFields(root, ['campaignName', 'budget', 'items'], ({ campaignName, budget }) => [
        builder.validate(campaignName, { budget }, validateFn),
      ]),
    ]);

    beforeEach(() => {
      validateFn.mockClear();
    });

    it('should run validations when changedPaths hint is provided', () => {
      const context = createValidationContext(testModel);
      updateModel(context, initialData);

      validateFn.mockClear();

      const updatedData: TestModel = {
        ...initialData,
        campaignName: 'updated',
      };

      updateModel(context, updatedData, undefined, {
        changedPaths: [['campaignName']],
      });

      expect(validateFn).toHaveBeenCalled();
    });

    it('should produce the same validation errors with and without hint', () => {
      const validationError = 'name too short';
      validateFn.mockReturnValue(validationError);

      const contextWithHint = createValidationContext(testModel);
      const contextWithoutHint = createValidationContext(testModel);

      updateModel(contextWithHint, initialData);
      updateModel(contextWithoutHint, initialData);

      const updatedData: TestModel = {
        ...initialData,
        campaignName: 'x',
      };

      updateModel(contextWithHint, updatedData, undefined, {
        changedPaths: [['campaignName']],
      });

      updateModel(contextWithoutHint, updatedData);

      expect(getValidationErrors(contextWithHint)).toEqual(getValidationErrors(contextWithoutHint));
    });
  });

  describe('with conditions', () => {
    const testModel = model<TestModel>((root, builder) => [
      builder.withFields(
        root,
        ['campaignName', 'budget', 'computed', 'items'],
        ({ campaignName, budget, computed }) => [
          builder.when(
            campaignName,
            (name: string) => name === 'active',
            () => [
              builder.value(
                computed,
                builder.compute(budget, (b: number) => `budget:${b}`),
              ),
            ],
          ),
        ],
      ),
    ]);

    it('should produce the same model data with and without hint when condition triggers', () => {
      const contextWithHint = createValidationContext(testModel);
      const contextWithoutHint = createValidationContext(testModel);

      updateModel(contextWithHint, { ...initialData, campaignName: 'inactive' });
      updateModel(contextWithoutHint, { ...initialData, campaignName: 'inactive' });

      const updatedData: TestModel = {
        ...initialData,
        campaignName: 'active',
      };

      updateModel(contextWithHint, updatedData, undefined, {
        changedPaths: [['campaignName']],
      });

      updateModel(contextWithoutHint, updatedData);

      expect(getModelData(contextWithHint)).toEqual(getModelData(contextWithoutHint));
    });
  });

  describe('with array item changes', () => {
    type ArrayModel = {
      list: { name: string; computed?: string }[];
    };

    const testModel = model<ArrayModel>((root, builder) => [
      builder.field(root, 'list', list => [
        builder.array(list, item => [
          builder.withFields(item, ['name', 'computed'], ({ name, computed }) => [
            builder.value(
              computed,
              builder.compute(name, (n: string) => `upper:${n.toUpperCase()}`),
            ),
          ]),
        ]),
      ]),
    ]);

    const arrayInitialData: ArrayModel = {
      list: [{ name: 'alice' }, { name: 'bob' }, { name: 'charlie' }],
    };

    it('should produce the same model data when changing an array item field', () => {
      const contextWithHint = createValidationContext(testModel);
      const contextWithoutHint = createValidationContext(testModel);

      updateModel(contextWithHint, arrayInitialData);
      updateModel(contextWithoutHint, arrayInitialData);

      // use model data (which includes computed values) as the base for the next update,
      // matching how campaign-manager feeds Yavl: always passing the latest model data back
      const modelDataWithHint = getModelData(contextWithHint);
      const modelDataWithoutHint = getModelData(contextWithoutHint);

      const updatedForHint: ArrayModel = {
        list: [{ ...modelDataWithHint.list[0], name: 'ALICE' }, modelDataWithHint.list[1], modelDataWithHint.list[2]],
      };

      const updatedForNoHint: ArrayModel = {
        list: [
          { ...modelDataWithoutHint.list[0], name: 'ALICE' },
          modelDataWithoutHint.list[1],
          modelDataWithoutHint.list[2],
        ],
      };

      updateModel(contextWithHint, updatedForHint, undefined, {
        changedPaths: [['list', 0, 'name']],
      });

      updateModel(contextWithoutHint, updatedForNoHint);

      expect(getModelData(contextWithHint)).toEqual(getModelData(contextWithoutHint));
    });

    it('should update the computed value for the changed array item', () => {
      const context = createValidationContext(testModel);
      updateModel(context, arrayInitialData);

      const modelData = getModelData(context);

      const updatedData: ArrayModel = {
        list: [{ ...modelData.list[0], name: 'updated' }, modelData.list[1], modelData.list[2]],
      };

      updateModel(context, updatedData, undefined, {
        changedPaths: [['list', 0, 'name']],
      });

      const data = getModelData(context);
      expect(data.list[0].computed).toBe('upper:UPDATED');
      expect(data.list[1].computed).toBe('upper:BOB');
      expect(data.list[2].computed).toBe('upper:CHARLIE');
    });
  });

  describe('with multiple changedPaths', () => {
    const testModel = model<TestModel>((root, builder) => [
      builder.withFields(
        root,
        ['campaignName', 'budget', 'computed', 'items'],
        ({ campaignName, budget, computed }) => [
          builder.value(
            computed,
            builder.compute({ campaignName, budget }, ({ campaignName: n, budget: b }) => `${n}:${b}`),
          ),
        ],
      ),
    ]);

    it('should handle multiple fields changing at once', () => {
      const contextWithHint = createValidationContext(testModel);
      const contextWithoutHint = createValidationContext(testModel);

      updateModel(contextWithHint, initialData);
      updateModel(contextWithoutHint, initialData);

      const updatedData: TestModel = {
        ...initialData,
        campaignName: 'new-name',
        budget: 999,
      };

      updateModel(contextWithHint, updatedData, undefined, {
        changedPaths: [['campaignName'], ['budget']],
      });

      updateModel(contextWithoutHint, updatedData);

      expect(getModelData(contextWithHint)).toEqual(getModelData(contextWithoutHint));
      expect(getModelData(contextWithHint).computed).toBe('new-name:999');
    });
  });

  describe('with cascading computed values across multiple passes', () => {
    type CascadeModel = {
      a: string;
      b?: string;
      c?: string;
    };

    const testModel = model<CascadeModel>((root, builder) => [
      builder.withFields(root, ['a', 'b', 'c'], ({ a, b, c }) => [builder.value(b, a), builder.value(c, b)]),
    ]);

    it('should produce the same result with hint when computed values cascade through multiple passes', () => {
      const contextWithHint = createValidationContext(testModel);
      const contextWithoutHint = createValidationContext(testModel);

      const cascadeInitial: CascadeModel = { a: 'start' };

      updateModel(contextWithHint, cascadeInitial);
      updateModel(contextWithoutHint, cascadeInitial);

      const cascadeUpdated: CascadeModel = { a: 'changed' };

      updateModel(contextWithHint, cascadeUpdated, undefined, {
        changedPaths: [['a']],
      });

      updateModel(contextWithoutHint, cascadeUpdated);

      const withHint = getModelData(contextWithHint);
      const withoutHint = getModelData(contextWithoutHint);

      expect(withHint).toEqual(withoutHint);
      expect(withHint.b).toBe('changed');
      expect(withHint.c).toBe('changed');
    });
  });

  describe('backward compatibility', () => {
    const testModel = model<TestModel>((root, builder) => [
      builder.withFields(root, ['campaignName', 'budget', 'computed', 'items'], ({ campaignName, computed }) => [
        builder.value(
          computed,
          builder.compute(campaignName, (name: string) => `computed:${name}`),
        ),
      ]),
    ]);

    it('should work when called with isEqualFn as a function (legacy signature)', () => {
      const context = createValidationContext(testModel);
      updateModel(context, initialData, undefined, Object.is);

      const data = getModelData(context);
      expect(data.computed).toBe('computed:test');
    });

    it('should work when called without 4th argument', () => {
      const context = createValidationContext(testModel);
      updateModel(context, initialData);

      const data = getModelData(context);
      expect(data.computed).toBe('computed:test');
    });

    it('should work when called with options object', () => {
      const context = createValidationContext(testModel);
      updateModel(context, initialData, undefined, { isEqualFn: Object.is });

      const data = getModelData(context);
      expect(data.computed).toBe('computed:test');
    });
  });
});
