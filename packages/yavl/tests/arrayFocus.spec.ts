import { createValidationContext, Model, model, ModelValidationContext, updateModel } from '../src';

type TestModel = {
  list: { value: string }[];
};

describe('array focus', () => {
  let validationContext: ModelValidationContext<TestModel> | undefined;

  const captureDependencies = jest.fn();

  const testIncrementalValidate = (testModel: Model<TestModel>, data: TestModel) => {
    if (!validationContext) {
      validationContext = createValidationContext(testModel);
    }

    updateModel(validationContext, data);
  };

  beforeEach(() => {
    validationContext = undefined;
  });

  it('should track dependencies correctly using nthFocus() on all array items', () => {
    const testModel = model<TestModel>((root, model) => {
      const { array, nthFocus, dependency, when } = model;
      const dep = dependency(nthFocus(dependency(root, 'list', array.all), 1), 'value');

      return [when(dep, captureDependencies, () => [])];
    });

    const data: TestModel = {
      list: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
    };
    testIncrementalValidate(testModel, data);

    expect(captureDependencies).toHaveBeenCalledTimes(1);
    expect(captureDependencies).toHaveBeenCalledWith('b', data, undefined);

    const updatedData: TestModel = {
      list: [{ value: 'a' }, { value: 'b2' }, { value: 'c' }],
    };
    testIncrementalValidate(testModel, updatedData);

    expect(captureDependencies).toHaveBeenCalledTimes(2);
    expect(captureDependencies).toHaveBeenCalledWith('b2', updatedData, undefined);
  });

  it('should track dependencies correctly using nthFocus() on filtered array', () => {
    const testModel = model<TestModel>((root, model) => {
      const { array, nthFocus, dependency, when, filter } = model;

      const filteredList = filter(dependency(root, 'list', array.all), [], (_, index) => index === 1);
      const dep = dependency(nthFocus(filteredList, 0), 'value');

      return [when(dep, captureDependencies, () => [])];
    });

    const data: TestModel = {
      list: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
    };
    testIncrementalValidate(testModel, data);

    expect(captureDependencies).toHaveBeenCalledTimes(1);
    expect(captureDependencies).toHaveBeenCalledWith('b', data, undefined);

    const updatedData: TestModel = {
      list: [{ value: 'a' }, { value: 'b2' }, { value: 'c' }],
    };
    testIncrementalValidate(testModel, updatedData);

    expect(captureDependencies).toHaveBeenCalledTimes(2);
    expect(captureDependencies).toHaveBeenCalledWith('b2', updatedData, undefined);
  });

  it('should track index() correctly using nthFocus() on filtered array that changes', () => {
    const testModel = model<TestModel>((root, model) => {
      const { array, nthFocus, dependency, when, filter, index } = model;

      const filteredList = filter(dependency(root, 'list', array.all), ['value'], ({ value }) => value === 'include');
      const dep = index(nthFocus(filteredList, 0));

      return [when(dep, captureDependencies, () => [])];
    });

    const data: TestModel = {
      list: [{ value: 'exclude' }, { value: 'include' }],
    };
    testIncrementalValidate(testModel, data);

    // matches the 2nd item on initial process
    expect(captureDependencies).toHaveBeenCalledTimes(1);
    expect(captureDependencies).toHaveBeenCalledWith(1, data, undefined);

    const updatedData: TestModel = {
      list: [{ value: 'include' }, { value: 'include' }],
    };
    testIncrementalValidate(testModel, updatedData);

    // should match 1st item after update
    expect(captureDependencies).toHaveBeenCalledTimes(2);
    expect(captureDependencies).toHaveBeenCalledWith(0, updatedData, undefined);
  });
});
