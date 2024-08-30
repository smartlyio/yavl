import {
  createValidationContext,
  Model,
  model,
  ModelValidationContext,
  updateModel
} from '../src';

describe('previous', () => {
  let validationContext: ModelValidationContext<any, any> | undefined;

  const testIncrementalValidate = <T, E>(
    testModel: Model<T, E>,
    data: T,
    externalData?: E
  ) => {
    if (!validationContext) {
      validationContext = createValidationContext(testModel, externalData);
    }

    updateModel(validationContext, data, externalData);
  };

  beforeEach(() => {
    validationContext = undefined;
  });

  type TestModel = {
    a?: string;
    b?: string;
    c?: string;
    list?: string[];
  };

  it('should give previous data to validate', () => {
    const validator = jest.fn();
    const testModel = model<TestModel>((root, builder) => [
      builder.withFields(root, ['a'], ({ a }) => [
        builder.validate(a, builder.previous(a), validator)
      ])
    ]);

    const initialData: TestModel = { a: 'initial' };

    testIncrementalValidate(testModel, initialData);
    expect(validator).toHaveBeenCalledTimes(1);
    expect(validator).toHaveBeenCalledWith(
      'initial',
      undefined,
      initialData,
      undefined
    );

    jest.clearAllMocks();

    const updatedData: TestModel = { a: 'changed' };
    testIncrementalValidate(testModel, updatedData);

    expect(validator).toHaveBeenCalledTimes(1);
    expect(validator).toHaveBeenCalledWith(
      'changed',
      'initial',
      updatedData,
      undefined
    );
  });

  it('should not give intermediate previous data on cascading changes', () => {
    const captureDependencies = jest.fn();
    const testModel = model<TestModel>((root, builder) => [
      builder.withFields(root, ['a', 'b', 'c'], ({ a, b, c }) => [
        builder.value(b, a),
        builder.value(
          c,
          builder.compute(builder.previous(root), (data) => {
            captureDependencies(data);
            return undefined;
          })
        )
      ])
    ]);

    const initialData: TestModel = { a: 'initial' };

    testIncrementalValidate(testModel, initialData);

    expect(captureDependencies).toHaveBeenCalledTimes(2);
    expect(captureDependencies).toHaveBeenNthCalledWith(1, undefined);
    expect(captureDependencies).toHaveBeenNthCalledWith(2, undefined);

    jest.clearAllMocks();
    const updatedData: TestModel = { a: 'changed', b: 'initial' };
    testIncrementalValidate(testModel, updatedData);

    expect(captureDependencies).toHaveBeenCalledTimes(2);
    expect(captureDependencies).toHaveBeenNthCalledWith(1, {
      a: 'initial',
      b: 'initial'
    });
    expect(captureDependencies).toHaveBeenNthCalledWith(2, {
      a: 'initial',
      b: 'initial'
    });
  });

  it('should return undefined as previous data for array.all dependencies on initial update', () => {
    const validator = jest.fn();
    const testModel = model<TestModel>((root, builder) => [
      builder.withFields(root, ['a', 'list'], ({ a, list }) => [
        builder.validate(
          a,
          builder.previous(builder.dep(list, builder.array.all)),
          validator
        )
      ])
    ]);

    const initialData: TestModel = { list: ['a', 'b'] };

    testIncrementalValidate(testModel, initialData);
    expect(validator).toHaveBeenCalledTimes(1);
    expect(validator).toHaveBeenCalledWith(
      undefined,
      undefined,
      initialData,
      undefined
    );
  });

  it('should give previous external data to validate', () => {
    type ExternalData = { value: string };

    const validator = jest.fn();
    const testModel = model<TestModel, ExternalData>((root, builder) => [
      builder.withFields(root, ['a'], ({ a }) => [
        builder.validate(
          a,
          builder.previous(builder.dep(builder.externalData, 'value')),
          validator
        )
      ])
    ]);

    const initialData: TestModel = { a: 'a' };
    const initialExternalData: ExternalData = { value: 'initial' };

    testIncrementalValidate(testModel, initialData, initialExternalData);
    expect(validator).toHaveBeenCalledTimes(1);
    expect(validator).toHaveBeenCalledWith(
      'a',
      undefined,
      initialData,
      initialExternalData
    );

    jest.clearAllMocks();

    const updatedExternalData: ExternalData = { value: 'changed' };
    testIncrementalValidate(testModel, initialData, updatedExternalData);

    expect(validator).toHaveBeenCalledTimes(1);
    expect(validator).toHaveBeenCalledWith(
      'a',
      'initial',
      initialData,
      updatedExternalData
    );
  });
});
