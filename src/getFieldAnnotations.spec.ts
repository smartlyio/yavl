import model from './model';
import getFieldAnnotations from './getFieldAnnotations';
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
    nestedList: {
      value: string;
    }[];
  }[];
};

const testData: TestModel = {
  valueA: 'test',
  valueB: 'test',
  valueC: 'test',
  nested: { value: 'test' },
  list: [
    {
      value: 'a',
      nestedList: []
    },
    {
      value: 'b',
      nestedList: []
    }
  ]
};

const conditionInsideArray = jest.fn();

const annotations = {
  meta: createAnnotation<string>('meta'),
  anotherMeta: createAnnotation<string>('anotherMeta'),
  truthyMeta: createAnnotation<string>('truthyMeta'),
  falsyMeta: createAnnotation<string>('falsyMeta'),
  conflict: createAnnotation<string>('conflict'),
  insideArray: createAnnotation<boolean>('insideArray'),
  insideArrayWhen: createAnnotation<boolean>('insideArrayWhen'),
  insideNestedArray: createAnnotation<boolean>('insideNestedArray')
};

describe('getFieldAnnotations', () => {
  const testModel = model<TestModel>((root, model) => [
    model.field(root, 'valueA', (valueA) => [
      model.annotate(valueA, annotations.meta, 'A'),
      model.annotate(valueA, annotations.anotherMeta, 'B')
    ]),
    model.field(root, 'valueB', (valueB) => [
      model.annotate(valueB, annotations.meta, 'A'),
      model.when(
        valueB,
        () => false,
        () => [model.annotate(valueB, annotations.falsyMeta, 'B')]
      ),
      model.when(
        valueB,
        () => true,
        () => [model.annotate(valueB, annotations.truthyMeta, 'C')]
      )
    ]),
    model.field(root, 'valueC', (valueC) => [
      model.annotate(valueC, annotations.conflict, 'A'),
      model.when(
        valueC,
        () => false,
        () => [model.annotate(valueC, annotations.conflict, 'B')]
      )
    ]),
    model.field(root, 'list', (list) => [
      model.array(list, (elem) => [
        model.annotate(elem, annotations.insideArray, true),
        model.when(
          elem,
          (elem) => elem.value === 'a',
          () => [
            model.annotate(elem, annotations.insideArrayWhen, true),
            model.field(elem, 'nestedList', (nestedList) => [
              model.array(nestedList, (elem) => [
                model.annotate(elem, annotations.insideNestedArray, true)
              ])
            ])
          ]
        )
      ])
    ])
  ]);

  beforeEach(() => {
    conditionInsideArray.mockReturnValue(true);
  });

  describe('getting annotations with validation context', () => {
    let validationContext: ModelValidationContext<TestModel>;

    beforeEach(() => {
      conditionInsideArray.mockReturnValueOnce(true).mockReturnValueOnce(false);

      validationContext = createValidationContext(testModel);
      validateModel(validationContext, testData);
    });

    it('should only return annotations for active branches', () => {
      expect(getFieldAnnotations(validationContext, 'valueB')).toEqual({
        [annotations.meta]: 'A',
        [annotations.truthyMeta]: 'C'
      });
    });

    it('should return conditional annotations for array items for active branches', () => {
      expect(getFieldAnnotations(validationContext, 'list[0]')).toEqual({
        [annotations.insideArray]: true,
        [annotations.insideArrayWhen]: true
      });
    });

    it('should not return conditional annotations for array items for inactive branches', () => {
      expect(getFieldAnnotations(validationContext, 'list[1]')).toEqual({
        [annotations.insideArray]: true
      });
    });
  });
});
