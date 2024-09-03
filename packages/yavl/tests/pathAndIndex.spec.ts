import { createAnnotation, createValidationContext, getAllAnnotations, model, updateModel } from '../src';

const pathAnnotation = createAnnotation<string>('path');
const indexAnnotation = createAnnotation<number>('index');

describe('path and index', () => {
  it('should give correct paths and indices', () => {
    type TestModel = {
      nested: {
        list: Array<{
          value: string;
        }>;
      };
    };

    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'nested', nested => [
        model.field(nested, 'list', list => [
          model.array(list, item => [
            model.field(item, 'value', value => [
              model.annotate(value, pathAnnotation, model.path(value)),
              model.annotate(value, indexAnnotation, model.index(item)),
            ]),
          ]),
        ]),
      ]),
    ]);

    const validationContext = createValidationContext(testModel);
    updateModel(validationContext, {
      nested: {
        list: [{ value: 'a' }, { value: 'b' }],
      },
    });

    expect(getAllAnnotations(validationContext)).toEqual({
      'nested.list[0].value': {
        [pathAnnotation]: 'nested.list[0].value',
        [indexAnnotation]: 0,
      },
      'nested.list[1].value': {
        [pathAnnotation]: 'nested.list[1].value',
        [indexAnnotation]: 1,
      },
    });
  });

  it('should throw an error if using index on field that is not an array item', () => {
    type TestModel = {
      list: Array<{ value: string }>;
    };

    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'list', list => [
        model.array(list, item => [
          model.field(item, 'value', value => [model.annotate(value, indexAnnotation, model.index(value))]),
        ]),
      ]),
    ]);

    const validationContext = createValidationContext(testModel);
    expect(() =>
      updateModel(validationContext, {
        list: [{ value: 'a' }, { value: 'b' }],
      }),
    ).toThrow('index() cannot be used on non-arrays');
  });

  it('should work correctly with filter & nthFocus', () => {
    type TestModel = {
      list: Array<{ value: string }>;
    };

    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'list', list => {
        const filtered = model.filter(list, ['value'], ({ value }) => value === 'b');
        const focusedItem = model.nthFocus(filtered, 0);

        return [
          model.annotate(list, pathAnnotation, model.path(model.dep(focusedItem, 'value'))),
          model.annotate(list, indexAnnotation, model.index(focusedItem)),
        ];
      }),
    ]);

    const validationContext = createValidationContext(testModel);
    updateModel(validationContext, {
      list: [{ value: 'a' }, { value: 'b' }],
    });

    expect(getAllAnnotations(validationContext)).toEqual({
      list: {
        [pathAnnotation]: 'list[1].value',
        [indexAnnotation]: 1,
      },
    });
  });
});
