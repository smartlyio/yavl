import model from './model';
import getAllAnnotations from './getAllAnnotations';
import { ModelValidationContext } from './validate/types';
import validateModel from './validate/validateModel';
import createValidationContext from './validate/createValidationContext';
import { createAnnotation } from './annotations';

type TestModel = {
  valueA: string;
  valueB: string;
  valueC: string;
  nested: {
    value: string;
  };
  list: {
    value: string;
    nestedList: number[];
  }[];
};

const testData: TestModel = {
  valueA: 'test',
  valueB: 'test',
  valueC: 'test',
  nested: { value: 'test' },
  list: [
    {
      value: 'test',
      nestedList: [1, 2]
    },
    {
      value: 'test',
      nestedList: [3, 4]
    }
  ]
};

const conditionInsideArray = jest.fn();

const annotations = {
  isRequired: createAnnotation<boolean>('isRequired'),
  meta: createAnnotation<string>('meta'),
  conditionalMeta: createAnnotation<string>('conditionalMeta'),
  insideArray: createAnnotation<boolean>('insideArray'),
  insideNestedArray: createAnnotation<boolean>('insideNestedArray')
};

describe('getAllAnnotations', () => {
  let validationContext: ModelValidationContext<TestModel>;

  const testModel = model<TestModel>((root, model) => [
    model.field(root, 'valueA', (valueA) => [
      model.annotate(valueA, annotations.isRequired, true),
      model.annotate(valueA, annotations.meta, 'test')
    ]),
    model.field(root, 'valueB', (valueB) => [
      model.annotate(valueB, annotations.isRequired, true),
      model.when(
        valueB,
        () => false,
        () => [model.annotate(valueB, annotations.conditionalMeta, 'test')]
      )
    ]),
    model.field(root, 'valueC', (valueC) => [
      model.annotate(valueC, annotations.isRequired, true),
      model.when(
        valueC,
        () => true,
        () => [model.annotate(valueC, annotations.conditionalMeta, 'test')]
      )
    ]),
    model.field(root, 'nested', (nested) => [
      model.field(nested, 'value', (value) => [
        model.annotate(value, annotations.isRequired, true),
        model.annotate(value, annotations.meta, 'test')
      ])
    ]),
    model.field(root, 'list', (list) => [
      model.array(list, (elem) => [
        model.when(elem, conditionInsideArray, () => [
          model.field(elem, 'value', (value) => [
            model.annotate(value, annotations.insideArray, true)
          ]),
          model.field(elem, 'nestedList', (nestedList) => [
            model.array(nestedList, (elem) => [
              model.annotate(elem, annotations.insideNestedArray, true)
            ])
          ])
        ])
      ])
    ])
  ]);

  beforeEach(() => {
    conditionInsideArray.mockReturnValue(true);

    validationContext = createValidationContext(testModel);
    validateModel(validationContext, testData);
  });

  it('should get all fields with annotations', () => {
    const result = getAllAnnotations(validationContext);

    expect(result).toMatchInlineSnapshot(`
      {
        "list[0].nestedList[0]": {
          "insideNestedArray": true,
        },
        "list[0].nestedList[1]": {
          "insideNestedArray": true,
        },
        "list[0].value": {
          "insideArray": true,
        },
        "list[1].nestedList[0]": {
          "insideNestedArray": true,
        },
        "list[1].nestedList[1]": {
          "insideNestedArray": true,
        },
        "list[1].value": {
          "insideArray": true,
        },
        "nested.value": {
          "isRequired": true,
          "meta": "test",
        },
        "valueA": {
          "isRequired": true,
          "meta": "test",
        },
        "valueB": {
          "isRequired": true,
        },
        "valueC": {
          "conditionalMeta": "test",
          "isRequired": true,
        },
      }
    `);
  });
});
