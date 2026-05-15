import { createValidationContext, getModelData, model, updateModel } from '../src';
import getValidationErrors from '../src/validate/getValidationErrors';

type UserProfile = {
  username: string;
  age: number;
  displayName?: string;
  tags: { label: string; value: number }[];
};

describe('updateModel with changedPaths', () => {
  const initialData: UserProfile = {
    username: 'alice',
    age: 30,
    tags: [
      { label: 'admin', value: 1 },
      { label: 'editor', value: 2 },
    ],
  };

  describe('with computed values', () => {
    const testModel = model<UserProfile>((root, builder) => [
      builder.withFields(root, ['username', 'age', 'displayName', 'tags'], ({ username, displayName }) => [
        builder.value(
          displayName,
          builder.compute(username, (name: string) => `@${name}`),
        ),
      ]),
    ]);

    it('should produce the same model data with and without changedPaths hint', () => {
      const contextWithHint = createValidationContext(testModel);
      const contextWithoutHint = createValidationContext(testModel);

      updateModel(contextWithHint, initialData);
      updateModel(contextWithoutHint, initialData);

      const updatedData: UserProfile = {
        ...initialData,
        username: 'bob',
      };

      updateModel(contextWithHint, updatedData, undefined, undefined, [['username']]);

      updateModel(contextWithoutHint, updatedData);

      expect(getModelData(contextWithHint)).toEqual(getModelData(contextWithoutHint));
    });

    it('should propagate computed value changes even with changedPaths hint', () => {
      const context = createValidationContext(testModel);
      updateModel(context, initialData);

      const updatedData: UserProfile = {
        ...initialData,
        username: 'charlie',
      };

      updateModel(context, updatedData, undefined, undefined, [['username']]);

      const data = getModelData(context);
      expect(data.displayName).toBe('@charlie');
    });
  });

  describe('with validations', () => {
    const validateFn = jest.fn();

    const testModel = model<UserProfile>((root, builder) => [
      builder.withFields(root, ['username', 'age', 'tags'], ({ username, age }) => [
        builder.validate(username, { age }, validateFn),
      ]),
    ]);

    beforeEach(() => {
      validateFn.mockClear();
    });

    it('should run validations when changedPaths hint is provided', () => {
      const context = createValidationContext(testModel);
      updateModel(context, initialData);

      validateFn.mockClear();

      const updatedData: UserProfile = {
        ...initialData,
        username: 'bob',
      };

      updateModel(context, updatedData, undefined, undefined, [['username']]);

      expect(validateFn).toHaveBeenCalled();
    });

    it('should produce the same validation errors with and without hint', () => {
      const validationError = 'username too short';
      validateFn.mockReturnValue(validationError);

      const contextWithHint = createValidationContext(testModel);
      const contextWithoutHint = createValidationContext(testModel);

      updateModel(contextWithHint, initialData);
      updateModel(contextWithoutHint, initialData);

      const updatedData: UserProfile = {
        ...initialData,
        username: 'x',
      };

      updateModel(contextWithHint, updatedData, undefined, undefined, [['username']]);

      updateModel(contextWithoutHint, updatedData);

      expect(getValidationErrors(contextWithHint)).toEqual(getValidationErrors(contextWithoutHint));
    });
  });

  describe('with conditions', () => {
    const testModel = model<UserProfile>((root, builder) => [
      builder.withFields(root, ['username', 'age', 'displayName', 'tags'], ({ username, age, displayName }) => [
        builder.when(
          username,
          (name: string) => name === 'admin',
          () => [
            builder.value(
              displayName,
              builder.compute(age, (a: number) => `admin:${a}`),
            ),
          ],
        ),
      ]),
    ]);

    it('should produce the same model data with and without hint when condition triggers', () => {
      const contextWithHint = createValidationContext(testModel);
      const contextWithoutHint = createValidationContext(testModel);

      updateModel(contextWithHint, { ...initialData, username: 'guest' });
      updateModel(contextWithoutHint, { ...initialData, username: 'guest' });

      const updatedData: UserProfile = {
        ...initialData,
        username: 'admin',
      };

      updateModel(contextWithHint, updatedData, undefined, undefined, [['username']]);

      updateModel(contextWithoutHint, updatedData);

      expect(getModelData(contextWithHint)).toEqual(getModelData(contextWithoutHint));
    });
  });

  describe('with array item changes', () => {
    type ContactList = {
      contacts: { email: string; normalized?: string }[];
    };

    const testModel = model<ContactList>((root, builder) => [
      builder.field(root, 'contacts', contacts => [
        builder.array(contacts, item => [
          builder.withFields(item, ['email', 'normalized'], ({ email, normalized }) => [
            builder.value(
              normalized,
              builder.compute(email, (e: string) => e.toLowerCase().trim()),
            ),
          ]),
        ]),
      ]),
    ]);

    const contactsInitialData: ContactList = {
      contacts: [{ email: 'Alice@test.com' }, { email: 'Bob@test.com' }, { email: 'Charlie@test.com' }],
    };

    it('should produce the same model data when changing an array item field', () => {
      const contextWithHint = createValidationContext(testModel);
      const contextWithoutHint = createValidationContext(testModel);

      updateModel(contextWithHint, contactsInitialData);
      updateModel(contextWithoutHint, contactsInitialData);

      // use model data (which includes computed values) as the base for the next update,
      // matching how form libraries feed Yavl: always passing the latest model data back
      const modelDataWithHint = getModelData(contextWithHint);
      const modelDataWithoutHint = getModelData(contextWithoutHint);

      const updatedForHint: ContactList = {
        contacts: [
          { ...modelDataWithHint.contacts[0], email: 'New@test.com' },
          modelDataWithHint.contacts[1],
          modelDataWithHint.contacts[2],
        ],
      };

      const updatedForNoHint: ContactList = {
        contacts: [
          { ...modelDataWithoutHint.contacts[0], email: 'New@test.com' },
          modelDataWithoutHint.contacts[1],
          modelDataWithoutHint.contacts[2],
        ],
      };

      updateModel(contextWithHint, updatedForHint, undefined, undefined, [['contacts', 0, 'email']]);

      updateModel(contextWithoutHint, updatedForNoHint);

      expect(getModelData(contextWithHint)).toEqual(getModelData(contextWithoutHint));
    });

    it('should update the computed value for the changed array item', () => {
      const context = createValidationContext(testModel);
      updateModel(context, contactsInitialData);

      const modelData = getModelData(context);

      const updatedData: ContactList = {
        contacts: [
          { ...modelData.contacts[0], email: '  Updated@TEST.com  ' },
          modelData.contacts[1],
          modelData.contacts[2],
        ],
      };

      updateModel(context, updatedData, undefined, undefined, [['contacts', 0, 'email']]);

      const data = getModelData(context);
      expect(data.contacts[0].normalized).toBe('updated@test.com');
      expect(data.contacts[1].normalized).toBe('bob@test.com');
      expect(data.contacts[2].normalized).toBe('charlie@test.com');
    });
  });

  describe('with multiple changedPaths', () => {
    const testModel = model<UserProfile>((root, builder) => [
      builder.withFields(root, ['username', 'age', 'displayName', 'tags'], ({ username, age, displayName }) => [
        builder.value(
          displayName,
          builder.compute({ username, age }, ({ username: n, age: a }) => `${n}:${a}`),
        ),
      ]),
    ]);

    it('should handle multiple fields changing at once', () => {
      const contextWithHint = createValidationContext(testModel);
      const contextWithoutHint = createValidationContext(testModel);

      updateModel(contextWithHint, initialData);
      updateModel(contextWithoutHint, initialData);

      const updatedData: UserProfile = {
        ...initialData,
        username: 'bob',
        age: 25,
      };

      updateModel(contextWithHint, updatedData, undefined, undefined, [['username'], ['age']]);

      updateModel(contextWithoutHint, updatedData);

      expect(getModelData(contextWithHint)).toEqual(getModelData(contextWithoutHint));
      expect(getModelData(contextWithHint).displayName).toBe('bob:25');
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

      updateModel(contextWithHint, cascadeUpdated, undefined, undefined, [['a']]);

      updateModel(contextWithoutHint, cascadeUpdated);

      const withHint = getModelData(contextWithHint);
      const withoutHint = getModelData(contextWithoutHint);

      expect(withHint).toEqual(withoutHint);
      expect(withHint.b).toBe('changed');
      expect(withHint.c).toBe('changed');
    });
  });

  describe('backward compatibility', () => {
    const testModel = model<UserProfile>((root, builder) => [
      builder.withFields(root, ['username', 'age', 'displayName', 'tags'], ({ username, displayName }) => [
        builder.value(
          displayName,
          builder.compute(username, (name: string) => `@${name}`),
        ),
      ]),
    ]);

    it('should work when called with isEqualFn as a function', () => {
      const context = createValidationContext(testModel);
      updateModel(context, initialData, undefined, Object.is);

      const data = getModelData(context);
      expect(data.displayName).toBe('@alice');
    });

    it('should work when called without optional arguments', () => {
      const context = createValidationContext(testModel);
      updateModel(context, initialData);

      const data = getModelData(context);
      expect(data.displayName).toBe('@alice');
    });

    it('should work when called with both isEqualFn and changedPaths', () => {
      const context = createValidationContext(testModel);
      updateModel(context, initialData);

      const updatedData: UserProfile = { ...initialData, username: 'bob' };
      updateModel(context, updatedData, undefined, Object.is, [['username']]);

      const data = getModelData(context);
      expect(data.displayName).toBe('@bob');
    });
  });
});
