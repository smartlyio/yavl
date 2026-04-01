import * as R from 'ramda';
import model from '../src/model';
import validateModel from '../src/validate/validateModel';
import { ModelValidationContext, ModelValidationErrors } from '../src/validate/types';
import { Model } from '../src/types';
import createValidationContext from '../src/validate/createValidationContext';
import { createAnnotation, getAllAnnotations } from '../src';

type TestModel = {
  simpleValue: string;
  optionalValue?: string;
  simpleGroup: {
    valueA: string;
    valueB: string;
    valueC: string;
  };
  simpleList: string[];
  pathA: {
    value: string;
    otherValue: string;
  };
  pathB: {
    value: string;
    otherValue: string;
  };
  list: { value: string; otherValue: string }[];
  outerList: { innerList: string[] }[];
  very: {
    deeply: {
      nested: {
        value: string;
      };
    };
  };
  complex: {
    outerList: {
      innerListA: {
        value: string;
      }[];
      innerListB: {
        value: string;
      }[];
    }[];
  };
  computedTest: {
    numA: number;
    numB: number;
    arrayOfNums: number[];
  };
};

type TestExternalData = {
  extSimpleValue: string;
};

const initialData: TestModel = {
  simpleValue: 'test',
  simpleGroup: {
    valueA: 'testA',
    valueB: 'testB',
    valueC: 'testC',
  },
  simpleList: ['1', '2', '3'],
  pathA: {
    value: 'testA',
    otherValue: 'testA',
  },
  pathB: {
    value: 'testB',
    otherValue: 'testB',
  },
  list: [
    { value: '1', otherValue: 'A' },
    { value: '2', otherValue: 'B' },
    { value: '3', otherValue: 'C' },
  ],
  outerList: [{ innerList: ['1', '2'] }, { innerList: ['3', '4'] }],
  very: {
    deeply: {
      nested: {
        value: 'test',
      },
    },
  },
  complex: {
    outerList: [
      {
        innerListA: [{ value: 'AA' }, { value: 'AB' }],
        innerListB: [{ value: 'BA' }, { value: 'BB' }],
      },
    ],
  },
  computedTest: {
    numA: 1,
    numB: 2,
    arrayOfNums: [1, 2, 3],
  },
};

const initialExternalData: TestExternalData = {
  extSimpleValue: 'external data',
};

const testAnnotation = createAnnotation<string>('test');

describe('model incremental validation', () => {
  let validationContext: ModelValidationContext<TestModel, TestExternalData, any> | undefined;
  let errors: ModelValidationErrors;

  const validateA = jest.fn();
  const validateB = jest.fn();

  const conditionA = jest.fn();
  const conditionB = jest.fn();
  const conditionC = jest.fn();

  const testIncrementalValidate = (
    testModel: Model<TestModel, any>,
    data: TestModel,
    externalData?: TestExternalData,
  ) => {
    if (!validationContext) {
      validationContext = createValidationContext(testModel, externalData);
    }

    errors = validateModel(validationContext, data, externalData);
  };

  beforeEach(() => {
    validationContext = undefined;
  });

  describe('simple field', () => {
    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'simpleValue', data => [model.validate(data, validateA)]),
    ]);

    beforeEach(() => {
      validateA.mockReturnValue(undefined);
      testIncrementalValidate(testModel, initialData);
    });

    it('should validate value on first validate', () => {
      expect(validateA).toHaveBeenCalledTimes(1);
      expect(validateA).toHaveBeenCalledWith('test', initialData, undefined);
    });

    it('should have no errors', () => {
      expect(errors).toBeUndefined();
    });

    describe('when value changes to invalid', () => {
      const changedData = R.set(R.lensPath(['simpleValue']), 'invalid', initialData);

      beforeEach(() => {
        jest.clearAllMocks();
        validateA.mockReturnValue('error');
        testIncrementalValidate(testModel, changedData);
      });

      it('should validate the changed value', () => {
        expect(validateA).toHaveBeenCalledTimes(1);
        expect(validateA).toHaveBeenLastCalledWith('invalid', changedData, undefined);
      });

      it('should have error for the field', () => {
        expect(errors).toEqual({
          simpleValue: ['error'],
        });
      });
    });

    describe('when value changes back to valid', () => {
      const changedData = R.set(R.lensPath(['simpleValue']), 'valid', initialData);

      beforeEach(() => {
        jest.clearAllMocks();
        validateA.mockReturnValue(undefined);
        testIncrementalValidate(testModel, changedData);
      });

      it('should validate the changed value', () => {
        expect(validateA).toHaveBeenCalledTimes(1);
        expect(validateA).toHaveBeenLastCalledWith('valid', changedData, undefined);
      });

      it('should have no errors', () => {
        expect(errors).toBeUndefined();
      });
    });
  });

  describe('undefined values', () => {
    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'optionalValue', optionalValue => [model.validate(optionalValue, validateA)]),
    ]);

    beforeEach(() => {
      validateA.mockReturnValue('error');
      testIncrementalValidate(testModel, initialData);
    });

    it('should validate value on first validate', () => {
      expect(validateA).toHaveBeenCalledTimes(1);
      expect(validateA).toHaveBeenCalledWith(undefined, initialData, undefined);
    });

    it('should have error for the field', () => {
      expect(errors).toEqual({ optionalValue: ['error'] });
    });

    describe('when value changes to string', () => {
      const changedData = R.set(R.lensPath(['optionalValue']), 'changed', initialData);

      beforeEach(() => {
        jest.clearAllMocks();
        validateA.mockReturnValue(undefined);
        testIncrementalValidate(testModel, changedData);
      });

      it('should validate the changed value', () => {
        expect(validateA).toHaveBeenCalledTimes(1);
        expect(validateA).toHaveBeenLastCalledWith('changed', changedData, undefined);
      });

      it('should clear the error for the field', () => {
        expect(errors).toBeUndefined();
      });

      describe('when value changes back to undefined', () => {
        const nextChangedData = R.set(R.lensPath(['optionalValue']), undefined, changedData);

        beforeEach(() => {
          jest.clearAllMocks();
          validateA.mockReturnValue('new error');
          testIncrementalValidate(testModel, nextChangedData);
        });

        it('should validate the changed value', () => {
          expect(validateA).toHaveBeenCalledTimes(1);
          expect(validateA).toHaveBeenLastCalledWith(undefined, nextChangedData, undefined);
        });

        it('should have the new error for the field', () => {
          expect(errors).toEqual({ optionalValue: ['new error'] });
        });
      });

      describe('when value is deleted from object', () => {
        const nextChangedData = R.omit(['optionalValue'], changedData);

        beforeEach(() => {
          jest.clearAllMocks();
          validateA.mockReturnValue('new error');
          testIncrementalValidate(testModel, nextChangedData);
        });

        it('should validate the changed value', () => {
          expect(validateA).toHaveBeenCalledTimes(1);
          expect(validateA).toHaveBeenLastCalledWith(undefined, nextChangedData, undefined);
        });

        it('should have the new error for the field', () => {
          expect(errors).toEqual({ optionalValue: ['new error'] });
        });
      });
    });
  });

  describe('validation inside inactive condition', () => {
    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'simpleValue', data => [
        model.when(
          {},
          () => false,
          () => [model.validate(data, validateA)],
        ),
      ]),
    ]);

    beforeEach(() => {
      validateA.mockReturnValue(undefined);
      testIncrementalValidate(testModel, initialData);
    });

    it('should not validate value on first validate', () => {
      expect(validateA).toHaveBeenCalledTimes(0);
    });

    describe('when value changes that validation depends on', () => {
      const changedData = R.set(R.lensPath(['simpleValue']), 'changed', initialData);

      beforeEach(() => {
        jest.clearAllMocks();
        testIncrementalValidate(testModel, changedData);
      });

      it('should not validate value on change', () => {
        expect(validateA).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('deeply nested field with conditions', () => {
    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'very', very => [
        model.when(very, conditionA, () => [
          model.field(very, 'deeply', deeply => [
            model.when(very, conditionB, () => [
              model.field(deeply, 'nested', nested => [
                model.when(very, conditionC, () => [
                  model.field(nested, 'value', value => [model.validate(value, validateA)]),
                ]),
              ]),
            ]),
          ]),
        ]),
      ]),
    ]);

    beforeEach(() => {
      conditionA.mockReturnValue(true);
      conditionB.mockReturnValue(true);
      conditionC.mockReturnValue(true);

      validateA.mockReturnValueOnce('error');

      testIncrementalValidate(testModel, initialData);
    });

    it('should return error on first validate', () => {
      expect(validateA).toHaveBeenCalledTimes(1);
      expect(errors).toEqual({
        ['very.deeply.nested.value']: ['error'],
      });
    });

    describe('when value of deeply nested value changes', () => {
      const changedData = R.set(R.lensPath(['very', 'deeply', 'nested', 'value']), 'changed', initialData);

      beforeEach(() => {
        jest.clearAllMocks();

        validateA.mockReturnValueOnce('another error');

        testIncrementalValidate(testModel, changedData);
      });

      it('should return updated error', () => {
        expect(validateA).toHaveBeenCalledTimes(1);
        expect(errors).toEqual({
          ['very.deeply.nested.value']: ['another error'],
        });
      });
    });
  });

  describe('arrays', () => {
    const validateArray = jest.fn();
    const validateElem = jest.fn();

    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'list', list => [
        model.validate(list, validateArray),
        model.array(list, elem => [
          model.field(elem, 'value', value => [
            model.validate(value, validateElem),
            model.annotate(
              value,
              testAnnotation,
              model.compute(value, value => `test ${value}`),
            ),
          ]),
        ]),
      ]),
    ]);

    describe('array itself', () => {
      beforeEach(() => {
        validateArray.mockReturnValue('error');
        validateElem.mockReturnValue(undefined);

        testIncrementalValidate(testModel, initialData);
      });

      it('should have error for the array', () => {
        expect(errors).toEqual({
          list: ['error'],
        });
      });

      it('should only validate the array once', () => {
        expect(validateArray).toHaveBeenCalledTimes(1);
      });
    });

    describe('array elems', () => {
      beforeEach(() => {
        validateArray.mockReturnValue(undefined);
        validateElem.mockReturnValueOnce('error 1').mockReturnValueOnce('error 2').mockReturnValueOnce('error 3');

        testIncrementalValidate(testModel, initialData);
      });

      it('should have error for all array items', () => {
        expect(errors).toEqual({
          'list[0].value': ['error 1'],
          'list[1].value': ['error 2'],
          'list[2].value': ['error 3'],
        });
      });

      it('should only validate each item once', () => {
        expect(validateElem).toHaveBeenCalledTimes(3);
      });

      it('should have annotations for all array items', () => {
        expect(getAllAnnotations(validationContext!)).toEqual({
          'list[0].value': {
            [testAnnotation]: 'test 1',
          },
          'list[1].value': {
            [testAnnotation]: 'test 2',
          },
          'list[2].value': {
            [testAnnotation]: 'test 3',
          },
        });
      });

      describe('when validation for one item passes', () => {
        const changedData = R.set(R.lensPath(['list', 1, 'value']), 'changed', initialData);

        beforeEach(() => {
          jest.clearAllMocks();

          validateElem.mockReturnValue(undefined);

          testIncrementalValidate(testModel, changedData);
        });

        it('should remove error for the valid field', () => {
          expect(errors).toEqual({
            'list[0].value': ['error 1'],
            'list[2].value': ['error 3'],
          });
        });

        it('should only call validate for the changed item', () => {
          expect(validateElem).toHaveBeenCalledTimes(1);
        });
      });

      describe('when removing item from end of array', () => {
        const changedData = R.over(R.lensPath(['list']), R.remove(-1, 1), initialData);

        beforeEach(() => {
          jest.clearAllMocks();

          testIncrementalValidate(testModel, changedData);
        });

        it('should remove errors from the removed item', () => {
          expect(errors).toEqual({
            'list[0].value': ['error 1'],
            'list[1].value': ['error 2'],
          });
        });

        it('should not call validate for the rest of the items', () => {
          expect(validateElem).toHaveBeenCalledTimes(0);
        });

        it('should remove annotation from the removed item', () => {
          expect(getAllAnnotations(validationContext!)).toEqual({
            'list[0].value': {
              [testAnnotation]: 'test 1',
            },
            'list[1].value': {
              [testAnnotation]: 'test 2',
            },
          });
        });
      });

      describe('when removing item from middle of array', () => {
        const changedData = R.over(R.lensPath(['list']), R.remove(1, 1), initialData);

        beforeEach(() => {
          jest.clearAllMocks();

          validateElem.mockReturnValueOnce('new error');

          testIncrementalValidate(testModel, changedData);
        });

        it('should remove errors from the removed item and shift remaining errors down', () => {
          expect(errors).toEqual({
            'list[0].value': ['error 1'],
            'list[1].value': ['new error'],
          });
        });

        it('should only call validate for elements after the removed item', () => {
          expect(validateElem).toHaveBeenCalledTimes(1);
        });

        it('should remove annotation from the removed item', () => {
          expect(getAllAnnotations(validationContext!)).toEqual({
            'list[0].value': {
              [testAnnotation]: 'test 1',
            },
            'list[1].value': {
              [testAnnotation]: 'test 3',
            },
          });
        });
      });

      describe('when removing all items from array', () => {
        const changedData = R.set(R.lensPath(['list']), [], initialData);

        beforeEach(() => {
          jest.clearAllMocks();
          testIncrementalValidate(testModel, changedData);
        });

        it('should remove errors from all array items', () => {
          expect(errors).toEqual(undefined);
        });

        it('should not call validate for any items', () => {
          expect(validateElem).toHaveBeenCalledTimes(0);
        });

        it('should remove all annotations from the array', () => {
          expect(getAllAnnotations(validationContext!)).toEqual({});
        });
      });
    });
  });

  describe('nested arrays', () => {
    const validateArray = jest.fn();
    const validateElem = jest.fn();

    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'outerList', outerList => [
        model.array(outerList, outerElem => [
          model.field(outerElem, 'innerList', innerList => [
            model.validate(innerList, validateArray),
            model.array(innerList, innerElem => [model.validate(innerElem, validateElem)]),
          ]),
        ]),
      ]),
    ]);

    describe('array itself', () => {
      beforeEach(() => {
        validateArray.mockReturnValueOnce(undefined).mockReturnValueOnce('error');

        validateElem.mockReturnValue(undefined);

        testIncrementalValidate(testModel, initialData);
      });

      it('should validate both nested arrays', () => {
        expect(validateArray).toHaveBeenCalledTimes(2);
      });

      it('should have error for the 2nd inner array', () => {
        expect(errors).toEqual({
          'outerList[1].innerList': ['error'],
        });
      });
    });

    describe('array elems', () => {
      beforeEach(() => {
        validateArray.mockReturnValue(undefined);
        validateElem
          .mockReturnValueOnce('error 1')
          .mockReturnValueOnce('error 2')
          .mockReturnValueOnce('error 3')
          .mockReturnValueOnce('error 4');

        testIncrementalValidate(testModel, initialData);
      });

      it('should have error for all array items', () => {
        expect(errors).toEqual({
          'outerList[0].innerList[0]': ['error 1'],
          'outerList[0].innerList[1]': ['error 2'],
          'outerList[1].innerList[0]': ['error 3'],
          'outerList[1].innerList[1]': ['error 4'],
        });
      });

      it('should only validate each item once', () => {
        expect(validateElem).toHaveBeenCalledTimes(4);
      });

      describe('when validation for one item passes', () => {
        const changedData = R.set(R.lensPath(['outerList', 1, 'innerList', 0]), 'changed', initialData);

        beforeEach(() => {
          jest.clearAllMocks();

          validateElem.mockReturnValue(undefined);

          testIncrementalValidate(testModel, changedData);
        });

        it('should remove error for the valid field', () => {
          expect(errors).toEqual({
            'outerList[0].innerList[0]': ['error 1'],
            'outerList[0].innerList[1]': ['error 2'],
            'outerList[1].innerList[1]': ['error 4'],
          });
        });

        it('should only call validate for the changed item', () => {
          expect(validateElem).toHaveBeenCalledTimes(1);
        });
      });

      describe('when removing item from end of nested array', () => {
        const changedData = R.over(R.lensPath(['outerList', 1, 'innerList']), R.remove(-1, 1), initialData);

        beforeEach(() => {
          jest.clearAllMocks();

          testIncrementalValidate(testModel, changedData);
        });

        it('should remove errors from the removed item', () => {
          expect(errors).toEqual({
            'outerList[0].innerList[0]': ['error 1'],
            'outerList[0].innerList[1]': ['error 2'],
            'outerList[1].innerList[0]': ['error 3'],
          });
        });

        it('should not call validate for the rest of the items', () => {
          expect(validateElem).toHaveBeenCalledTimes(0);
        });
      });

      describe('when removing item from beginning nested of array', () => {
        const changedData = R.over(R.lensPath(['outerList', 1, 'innerList']), R.remove(0, 1), initialData);

        beforeEach(() => {
          jest.clearAllMocks();

          validateElem.mockReturnValueOnce('new error');

          testIncrementalValidate(testModel, changedData);
        });

        it('should remove errors from the removed item and shift remaining errors down', () => {
          expect(errors).toEqual({
            'outerList[0].innerList[0]': ['error 1'],
            'outerList[0].innerList[1]': ['error 2'],
            'outerList[1].innerList[0]': ['new error'],
          });
        });

        it('should only call validate for elements after the removed item', () => {
          expect(validateElem).toHaveBeenCalledTimes(1);
        });
      });

      describe('when removing all items from nested array', () => {
        const changedData = R.set(R.lensPath(['outerList', 1, 'innerList']), [], initialData);

        beforeEach(() => {
          jest.clearAllMocks();
          testIncrementalValidate(testModel, changedData);
        });

        it('should remove errors from all inner array items', () => {
          expect(errors).toEqual({
            'outerList[0].innerList[0]': ['error 1'],
            'outerList[0].innerList[1]': ['error 2'],
          });
        });

        it('should not call validate for any items', () => {
          expect(validateElem).toHaveBeenCalledTimes(0);
        });
      });

      describe('when removing item from outer array', () => {
        const changedData = R.over(R.lensPath(['outerList']), R.remove(-1, 1), initialData);

        beforeEach(() => {
          jest.clearAllMocks();

          testIncrementalValidate(testModel, changedData);
        });

        it('should remove errors from all nested array items', () => {
          expect(errors).toEqual({
            'outerList[0].innerList[0]': ['error 1'],
            'outerList[0].innerList[1]': ['error 2'],
          });
        });
      });

      describe('when removing all items from outer array', () => {
        const changedData = R.set(R.lensPath(['outerList']), [], initialData);

        beforeEach(() => {
          jest.clearAllMocks();

          testIncrementalValidate(testModel, changedData);
        });

        it('should remove errors from all items', () => {
          expect(errors).toEqual(undefined);
        });
      });
    });
  });

  describe('sibling arrays', () => {
    const validateElemInList = jest.fn();
    const validateElemInSimpleList = jest.fn();

    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'list', list => [model.array(list, elem => [model.validate(elem, validateElemInList)])]),
      model.field(root, 'simpleList', list => [
        model.array(list, elem => [model.validate(elem, validateElemInSimpleList)]),
      ]),
    ]);

    beforeEach(() => {
      validateElemInList.mockReturnValue('error');
      validateElemInSimpleList.mockReturnValue('error');
      testIncrementalValidate(testModel, initialData);
    });

    it('should have error for all items in both arrays', () => {
      expect(errors).toEqual({
        'list[0]': ['error'],
        'list[1]': ['error'],
        'list[2]': ['error'],
        'simpleList[0]': ['error'],
        'simpleList[1]': ['error'],
        'simpleList[2]': ['error'],
      });
    });

    describe('when removing items from array', () => {
      const changedData = R.set(R.lensPath(['list']), [], initialData);

      beforeEach(() => {
        jest.clearAllMocks();
        testIncrementalValidate(testModel, changedData);
      });

      it('should not affect errors in sibling list', () => {
        expect(errors).toEqual({
          'simpleList[0]': ['error'],
          'simpleList[1]': ['error'],
          'simpleList[2]': ['error'],
        });
      });
    });
  });

  describe('arrays inside condition', () => {
    const validateElem = jest.fn();

    const testModel = model<TestModel>((root, model) => [
      model.when(
        root,
        () => true,
        () => [
          model.field(root, 'list', list => [
            model.array(list, elem => [model.field(elem, 'value', value => [model.validate(value, validateElem)])]),
          ]),
        ],
      ),
    ]);

    beforeEach(() => {
      validateElem.mockReturnValueOnce('error 1').mockReturnValueOnce('error 2').mockReturnValueOnce('error 3');

      testIncrementalValidate(testModel, initialData);
    });

    it('should have error for all array items', () => {
      expect(errors).toEqual({
        'list[0].value': ['error 1'],
        'list[1].value': ['error 2'],
        'list[2].value': ['error 3'],
      });
    });

    describe('when removing item', () => {
      const changedData = R.over(R.lensPath(['list']), R.remove(-1, 1), initialData);

      beforeEach(() => {
        jest.clearAllMocks();

        testIncrementalValidate(testModel, changedData);
      });

      it('should remove errors from the removed item', () => {
        expect(errors).toEqual({
          'list[0].value': ['error 1'],
          'list[1].value': ['error 2'],
        });
      });
    });

    describe('when removing all items from array', () => {
      const changedData = R.set(R.lensPath(['list']), [], initialData);

      beforeEach(() => {
        jest.clearAllMocks();
        testIncrementalValidate(testModel, changedData);
      });

      it('should remove errors from all array items', () => {
        expect(errors).toEqual(undefined);
      });
    });
  });

  describe('field validation depending on parent sibling values', () => {
    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'pathA', data => [
        model.field(data, 'value', value => [
          model.validate(value, { dep: model.dependency(root, 'simpleValue') }, validateA),
          model.validate(value, validateB),
        ]),
      ]),
      model.field(root, 'simpleValue', () => []),
    ]);

    beforeEach(() => {
      validateA.mockReturnValue('initial error');

      testIncrementalValidate(testModel, initialData);
    });

    it('should run the validation with correct data', () => {
      expect(validateA).toHaveBeenCalledTimes(1);
      expect(validateA).toHaveBeenCalledWith('testA', { dep: 'test' }, initialData, undefined);
    });

    it('should set error for the correct field', () => {
      expect(errors).toEqual({
        ['pathA.value']: ['initial error'],
      });
    });

    describe('when dependency of validation changes', () => {
      const changedData = R.set(R.lensPath(['simpleValue']), 'changed', initialData);

      beforeEach(() => {
        jest.clearAllMocks();

        validateA.mockReturnValue('updated error');

        testIncrementalValidate(testModel, changedData);
      });

      it('should re-run the validation with updated dependent data', () => {
        expect(validateA).toHaveBeenCalledTimes(1);
        expect(validateA).toHaveBeenCalledWith('testA', { dep: 'changed' }, changedData, undefined);
      });

      it('should update the error for the correct field', () => {
        expect(errors).toEqual({
          ['pathA.value']: ['updated error'],
        });
      });

      it('should not run the validation without dependencies', () => {
        expect(validateB).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('array validation depending on value from outside', () => {
    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'simpleValue', () => []),
      model.field(root, 'simpleList', simpleList => [
        model.array(simpleList, elem => [
          model.validate(elem, { outsideList: model.dependency(root, 'simpleValue') }, validateA),
        ]),
      ]),
    ]);

    beforeEach(() => {
      testIncrementalValidate(testModel, initialData);
    });

    it('should call validate for each list element', () => {
      expect(validateA).toHaveBeenCalledTimes(3);
      expect(validateA).toHaveBeenCalledWith('1', { outsideList: 'test' }, initialData, undefined);
      expect(validateA).toHaveBeenCalledWith('2', { outsideList: 'test' }, initialData, undefined);
      expect(validateA).toHaveBeenCalledWith('3', { outsideList: 'test' }, initialData, undefined);
    });

    describe('when dependent data changes', () => {
      const changedData = R.set(R.lensPath(['simpleValue']), 'changed', initialData);

      beforeEach(() => {
        jest.clearAllMocks();

        testIncrementalValidate(testModel, changedData);
      });

      it('should call validate for each list element', () => {
        expect(validateA).toHaveBeenCalledTimes(3);
        expect(validateA).toHaveBeenCalledWith('1', { outsideList: 'changed' }, changedData, undefined);
        expect(validateA).toHaveBeenCalledWith('2', { outsideList: 'changed' }, changedData, undefined);
        expect(validateA).toHaveBeenCalledWith('3', { outsideList: 'changed' }, changedData, undefined);
      });
    });
  });

  describe('nested array depending on value from outside both arrays', () => {
    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'simpleValue', () => []),
      model.field(root, 'outerList', outerList => [
        model.array(outerList, outerElem => [
          model.field(outerElem, 'innerList', innerList => [
            model.array(innerList, innerElem => [
              model.validate(
                innerElem,
                {
                  outsideList: model.dependency(root, 'simpleValue'),
                },
                validateA,
              ),
            ]),
          ]),
        ]),
      ]),
    ]);

    beforeEach(() => {
      testIncrementalValidate(testModel, initialData);
    });

    it('should call validate for each list element', () => {
      expect(validateA).toHaveBeenCalledTimes(4);
      expect(validateA).toHaveBeenCalledWith('1', { outsideList: 'test' }, initialData, undefined);
      expect(validateA).toHaveBeenCalledWith('2', { outsideList: 'test' }, initialData, undefined);
      expect(validateA).toHaveBeenCalledWith('3', { outsideList: 'test' }, initialData, undefined);
      expect(validateA).toHaveBeenCalledWith('4', { outsideList: 'test' }, initialData, undefined);
    });

    describe('when dependent data changes', () => {
      const changedData = R.set(R.lensPath(['simpleValue']), 'changed', initialData);

      beforeEach(() => {
        jest.clearAllMocks();

        testIncrementalValidate(testModel, changedData);
      });

      it('should call validate for each list element', () => {
        expect(validateA).toHaveBeenCalledTimes(4);
        expect(validateA).toHaveBeenCalledWith('1', { outsideList: 'changed' }, changedData, undefined);
        expect(validateA).toHaveBeenCalledWith('2', { outsideList: 'changed' }, changedData, undefined);
        expect(validateA).toHaveBeenCalledWith('3', { outsideList: 'changed' }, changedData, undefined);
        expect(validateA).toHaveBeenCalledWith('4', { outsideList: 'changed' }, changedData, undefined);
      });
    });
  });

  describe('when depending on direct parent value', () => {
    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'simpleValue', simpleValue => [
        model.when(simpleValue, conditionA, () => [model.validate(simpleValue, validateA)]),
      ]),
    ]);

    beforeEach(() => {
      validateA.mockReturnValue('first error');
      conditionA.mockReturnValue(true);
      testIncrementalValidate(testModel, initialData);
    });

    it('should run the when with correct data', () => {
      expect(conditionA).toHaveBeenCalledTimes(1);
      expect(conditionA).toHaveBeenCalledWith('test', initialData, undefined);
    });

    it('should run the nested validation', () => {
      expect(validateA).toHaveBeenCalledTimes(1);
      expect(validateA).toHaveBeenCalledWith('test', initialData, undefined);
    });

    it('should set error to the correct field', () => {
      expect(errors).toEqual({
        simpleValue: ['first error'],
      });
    });

    describe('when the dependency of when changes', () => {
      const changedData = R.set(R.lensPath(['simpleValue']), 'changed', initialData);

      beforeEach(() => {
        validateA.mockReturnValue('second error');

        jest.clearAllMocks();

        testIncrementalValidate(testModel, changedData);
      });

      it('should re-run the when with updated dependent data', () => {
        expect(conditionA).toHaveBeenCalledTimes(1);
        expect(conditionA).toHaveBeenCalledWith('changed', changedData, undefined);
      });

      it('should re-run the nested validate', () => {
        expect(validateA).toHaveBeenCalledTimes(1);
      });

      it('should update error for the correct field', () => {
        expect(errors).toEqual({
          simpleValue: ['second error'],
        });
      });
    });
  });

  describe('when depending on parent of parent', () => {
    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'simpleGroup', simpleGroup => [
        model.field(simpleGroup, 'valueA', valueA => [
          model.when(simpleGroup, conditionA, () => [model.validate(valueA, validateA)]),
        ]),
        model.field(simpleGroup, 'valueB', valueB => [
          model.when(valueB, conditionB, () => [model.validate(valueB, validateB)]),
        ]),
        model.field(simpleGroup, 'valueC', () => []),
      ]),
    ]);

    beforeEach(() => {
      validateA.mockReturnValue('first error A');
      validateB.mockReturnValue('first error B');

      conditionA.mockReturnValue(true);
      conditionB.mockReturnValue(true);

      testIncrementalValidate(testModel, initialData);
    });

    it('should run the conditions with correct data', () => {
      expect(conditionA).toHaveBeenCalledTimes(1);
      expect(conditionA).toHaveBeenCalledWith(initialData.simpleGroup, initialData, undefined);

      expect(conditionB).toHaveBeenCalledTimes(1);
      expect(conditionB).toHaveBeenCalledWith('testB', initialData, undefined);
    });

    it('should run the nested validations', () => {
      expect(validateA).toHaveBeenCalledTimes(1);
      expect(validateA).toHaveBeenCalledWith('testA', initialData, undefined);

      expect(validateB).toHaveBeenCalledTimes(1);
      expect(validateB).toHaveBeenCalledWith('testB', initialData, undefined);
    });

    it('should set errors for the correct fields', () => {
      expect(errors).toEqual({
        ['simpleGroup.valueA']: ['first error A'],
        ['simpleGroup.valueB']: ['first error B'],
      });
    });

    describe('when the dependency of when changes', () => {
      const changedData = R.set(R.lensPath(['simpleGroup', 'valueC']), 'changed', initialData);

      beforeEach(() => {
        jest.clearAllMocks();
        testIncrementalValidate(testModel, changedData);
      });

      it('should re-run the condition with updated dependent data', () => {
        expect(conditionA).toHaveBeenCalledTimes(1);
        expect(conditionA).toHaveBeenCalledWith(changedData.simpleGroup, changedData, undefined);
      });

      it('should not re-run the nested validate', () => {
        expect(validateA).toHaveBeenCalledTimes(0);
      });

      it('should not re-run the condition with no dependency changes', () => {
        expect(conditionB).toHaveBeenCalledTimes(0);
      });

      it('should not re-run the validation with no dependency changes', () => {
        expect(validateB).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('when depending on sibling of parent', () => {
    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'simpleValue', () => []),
      model.field(root, 'simpleGroup', simpleGroup => [
        model.field(simpleGroup, 'valueA', valueA => [
          model.when(model.dependency(root, 'simpleValue'), conditionA, () => [model.validate(valueA, validateA)]),
        ]),
        model.field(simpleGroup, 'valueB', valueB => [
          model.when(valueB, conditionB, () => [model.validate(valueB, validateB)]),
        ]),
      ]),
    ]);

    beforeEach(() => {
      validateA.mockReturnValue('first error A');
      validateB.mockReturnValue('first error B');

      conditionA.mockReturnValue(true);
      conditionB.mockReturnValue(true);

      testIncrementalValidate(testModel, initialData);
    });

    it('should run the conditions with correct data', () => {
      expect(conditionA).toHaveBeenCalledTimes(1);
      expect(conditionA).toHaveBeenCalledWith(initialData.simpleValue, initialData, undefined);

      expect(conditionB).toHaveBeenCalledTimes(1);
      expect(conditionB).toHaveBeenCalledWith(initialData.simpleGroup.valueB, initialData, undefined);
    });

    it('should run the nested validations', () => {
      expect(validateA).toHaveBeenCalledTimes(1);
      expect(validateA).toHaveBeenCalledWith(initialData.simpleGroup.valueA, initialData, undefined);

      expect(validateB).toHaveBeenCalledTimes(1);
      expect(validateB).toHaveBeenCalledWith(initialData.simpleGroup.valueB, initialData, undefined);
    });

    it('should set errors for the correct fields', () => {
      expect(errors).toEqual({
        ['simpleGroup.valueA']: ['first error A'],
        ['simpleGroup.valueB']: ['first error B'],
      });
    });

    describe('when the dependency of condition changes', () => {
      const changedData = R.set(R.lensPath(['simpleValue']), 'changed', initialData);

      beforeEach(() => {
        jest.clearAllMocks();
        testIncrementalValidate(testModel, changedData);
      });

      it('should re-run the condition with updated dependent data', () => {
        expect(conditionA).toHaveBeenCalledTimes(1);
        expect(conditionA).toHaveBeenCalledWith(changedData.simpleValue, changedData, undefined);
      });

      it('should not re-run the nested validate', () => {
        expect(validateA).toHaveBeenCalledTimes(0);
      });

      it('should not re-run the condition with no dependency changes', () => {
        expect(conditionB).toHaveBeenCalledTimes(0);
      });

      it('should not re-run the validation with no dependency changes', () => {
        expect(validateB).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('when inside array depending on value outside the array', () => {
    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'simpleValue', () => []),
      model.field(root, 'simpleList', simpleList => [
        model.array(simpleList, elem => [
          model.when(model.dependency(root, 'simpleValue'), conditionA, () => [model.validate(elem, validateA)]),
        ]),
      ]),
    ]);

    beforeEach(() => {
      conditionA.mockReturnValue(true);
      validateA.mockReturnValue('error');

      testIncrementalValidate(testModel, initialData);
    });

    it('should run the condition for each array element', () => {
      expect(conditionA).toHaveBeenCalledTimes(3);
      expect(conditionA).toHaveBeenCalledWith(initialData.simpleValue, initialData, undefined);
    });

    it('should run the validation inside when for all array elements', () => {
      expect(validateA).toHaveBeenCalledTimes(3);
      expect(validateA).toHaveBeenCalledWith(initialData.simpleList[0], initialData, undefined);
      expect(validateA).toHaveBeenCalledWith(initialData.simpleList[1], initialData, undefined);
      expect(validateA).toHaveBeenCalledWith(initialData.simpleList[2], initialData, undefined);
    });

    it('should set errors for the correct fields', () => {
      expect(errors).toEqual({
        ['simpleList[0]']: ['error'],
        ['simpleList[1]']: ['error'],
        ['simpleList[2]']: ['error'],
      });
    });

    describe('when the dependency of condition changes', () => {
      const changedData = R.set(R.lensPath(['simpleValue']), 'changed', initialData);

      beforeEach(() => {
        jest.clearAllMocks();
        testIncrementalValidate(testModel, changedData);
      });

      it('should re-run the condition with updated dependency for each array element', () => {
        expect(conditionA).toHaveBeenCalledTimes(3);
        expect(conditionA).toHaveBeenCalledWith(changedData.simpleValue, changedData, undefined);
      });

      it('should not re-run the nested validates', () => {
        expect(validateA).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('when condition result changes', () => {
    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'pathA', data => [
        model.when(data, conditionA, () => [model.field(data, 'value', value => [model.validate(value, validateA)])]),
        model.field(data, 'otherValue'),
      ]),
      model.field(root, 'pathB', data => [
        model.when(data, conditionB, () => [model.field(data, 'value', value => [model.validate(value, validateB)])]),
        model.field(data, 'otherValue'),
      ]),
    ]);

    beforeEach(() => {
      conditionA.mockReturnValueOnce(true);
      conditionB.mockReturnValueOnce(false);
      validateA.mockReturnValueOnce('initial error');

      testIncrementalValidate(testModel, initialData);
    });

    it('should check all conditions on first validation', () => {
      expect(conditionA).toHaveBeenCalledTimes(1);
      expect(conditionA).toHaveBeenCalledWith(initialData.pathA, initialData, undefined);
      expect(conditionB).toHaveBeenCalledTimes(1);
      expect(conditionB).toHaveBeenCalledWith(initialData.pathB, initialData, undefined);
    });

    it('should only run validations for truthy paths', () => {
      expect(validateA).toHaveBeenCalledTimes(1);
      expect(validateB).toHaveBeenCalledTimes(0);
    });

    it('should set error for the correct field', () => {
      expect(errors).toEqual({
        ['pathA.value']: ['initial error'],
      });
    });

    describe('when condition changes to true', () => {
      const changedData = R.set(R.lensPath(['pathB', 'otherValue']), 'changed', initialData);

      beforeEach(() => {
        jest.clearAllMocks();

        conditionB.mockReturnValueOnce(true);
        validateB.mockReturnValueOnce('new error');

        testIncrementalValidate(testModel, changedData);
      });

      it('should check the condition with changed data', () => {
        expect(conditionB).toHaveBeenCalledTimes(1);
        expect(conditionB).toHaveBeenCalledWith(changedData.pathB, changedData, undefined);
      });

      it('should run the validation under the condition that changed to true', () => {
        expect(validateB).toHaveBeenCalledTimes(1);
        expect(validateB).toHaveBeenCalledWith(changedData.pathB.value, changedData, undefined);
      });

      it('should return error for the newly checked field merged with previous errors', () => {
        expect(errors).toEqual({
          ['pathA.value']: ['initial error'],
          ['pathB.value']: ['new error'],
        });
      });

      it('should not check the condition with unchanged data', () => {
        expect(conditionA).toHaveBeenCalledTimes(0);
      });

      it('should not run the validation with unchanged data', () => {
        expect(validateA).toHaveBeenCalledTimes(0);
      });
    });

    describe('when condition changes to false', () => {
      const changedData = R.set(R.lensPath(['pathA', 'otherValue']), 'changed', initialData);

      beforeEach(() => {
        jest.clearAllMocks();

        conditionA.mockReturnValueOnce(false);

        testIncrementalValidate(testModel, changedData);
      });

      it('should check the condition with changed data', () => {
        expect(conditionA).toHaveBeenCalledTimes(1);
        expect(conditionA).toHaveBeenCalledWith(changedData.pathA, changedData, undefined);
      });

      it('should not run the validation under the condition that changed to false', () => {
        expect(validateA).toHaveBeenCalledTimes(0);
      });

      it('should remove errors for field under the condition', () => {
        expect(errors).toEqual(undefined);
      });

      it('should not check the condition with unchanged data', () => {
        expect(conditionB).toHaveBeenCalledTimes(0);
      });

      it('should not run the validation with unchanged data', () => {
        expect(validateB).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('validation depending on external data', () => {
    const testModel = model<TestModel, TestExternalData>((root, model) => [
      model.field(root, 'simpleValue', simpleValue => [
        model.validate(
          simpleValue,
          {
            ext: model.dependency(model.externalData, 'extSimpleValue'),
          },
          validateA,
        ),
        model.validate(simpleValue, validateB),
      ]),
    ]);

    beforeEach(() => {
      validateA.mockReturnValue('initial error');
      validateB.mockReturnValue(undefined);

      testIncrementalValidate(testModel, initialData, initialExternalData);
    });

    it('should run the validation with correct data', () => {
      expect(validateA).toHaveBeenCalledTimes(1);
      expect(validateA).toHaveBeenCalledWith('test', { ext: 'external data' }, initialData, initialExternalData);
    });

    it('should set error for the correct field', () => {
      expect(errors).toEqual({
        ['simpleValue']: ['initial error'],
      });
    });

    describe('when external data changes', () => {
      const changedExternalData = R.set(R.lensPath(['extSimpleValue']), 'changed', initialExternalData);

      beforeEach(() => {
        jest.clearAllMocks();

        validateA.mockReturnValue('updated error');

        testIncrementalValidate(testModel, initialData, changedExternalData);
      });

      it('should re-run the validation with updated external data', () => {
        expect(validateA).toHaveBeenCalledTimes(1);
        expect(validateA).toHaveBeenCalledWith('test', { ext: 'changed' }, initialData, changedExternalData);
      });

      it('should update the error for the correct field', () => {
        expect(errors).toEqual({
          ['simpleValue']: ['updated error'],
        });
      });

      it('should not run the validation without dependencies', () => {
        expect(validateB).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('when depending on multiple dependencies', () => {
    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'simpleValue', () => [
        model.when(
          {
            depA: model.dependency(root, 'simpleGroup', 'valueA'),
            depB: model.dependency(root, 'simpleGroup', 'valueB'),
            depC: model.dependency(root, 'simpleGroup', 'valueC'),
          },
          conditionA,
          () => [],
        ),
      ]),
      model.field(root, 'simpleGroup', simpleGroup => [
        model.field(simpleGroup, 'valueA', () => []),
        model.field(simpleGroup, 'valueB', () => []),
        model.field(simpleGroup, 'valueC', () => []),
      ]),
    ]);

    beforeEach(() => {
      conditionA.mockReturnValue(true);
      testIncrementalValidate(testModel, initialData);
    });

    it('should run the when with correct data', () => {
      expect(conditionA).toHaveBeenCalledTimes(1);
      expect(conditionA).toHaveBeenCalledWith(
        {
          depA: initialData.simpleGroup.valueA,
          depB: initialData.simpleGroup.valueB,
          depC: initialData.simpleGroup.valueC,
        },
        initialData,
        undefined,
      );
    });

    describe('when any of the dependencies changes', () => {
      const changedData = R.set(R.lensPath(['simpleGroup', 'valueC']), 'changed', initialData);

      beforeEach(() => {
        jest.clearAllMocks();

        testIncrementalValidate(testModel, changedData);
      });

      it('should re-run the when with updated dependent data', () => {
        expect(conditionA).toHaveBeenCalledTimes(1);
        expect(conditionA).toHaveBeenCalledWith(
          {
            depA: initialData.simpleGroup.valueA,
            depB: initialData.simpleGroup.valueB,
            depC: changedData.simpleGroup.valueC,
          },
          changedData,
          undefined,
        );
      });
    });
  });

  describe('when validation field is a passive dependency', () => {
    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'simpleValue', simpleValue => [
        model.validate(
          model.passive(simpleValue),
          {
            dep: model.dependency(root, 'pathA', 'value'),
          },
          validateA,
        ),
      ]),
    ]);

    beforeEach(() => {
      jest.clearAllMocks();
      validateA.mockReturnValue('error');
      testIncrementalValidate(testModel, initialData);
    });

    it('should have validation error', () => {
      expect(errors).toEqual({
        simpleValue: ['error'],
      });
    });

    describe('when the field changes', () => {
      const changedData = R.set(R.lensPath(['simpleValue']), 'changed', initialData);

      beforeEach(() => {
        jest.clearAllMocks();
        validateA.mockReturnValue(undefined);
        testIncrementalValidate(testModel, changedData);
      });

      it('should not re-run the validation, the error should remain', () => {
        expect(errors).toEqual({
          simpleValue: ['error'],
        });
      });
    });

    describe('when the dependency changes', () => {
      const changedData = R.set(R.lensPath(['pathA', 'value']), 'changed', initialData);

      beforeEach(() => {
        jest.clearAllMocks();
        validateA.mockReturnValue(undefined);
        testIncrementalValidate(testModel, changedData);
      });

      it('should re-run the validation and update errors', () => {
        expect(errors).toBeUndefined();
      });
    });
  });

  describe('when validation has passive dependency', () => {
    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'simpleValue', simpleValue => [
        model.validate(
          simpleValue,
          {
            dep: model.dependency(root, 'pathA', 'value'),
          },
          validateA,
        ),
        model.validate(
          simpleValue,
          {
            passiveDep: model.passive(model.dep(root, 'pathA', 'value')),
          },
          validateB,
        ),
      ]),
      model.field(root, 'pathA', pathA => [model.field(pathA, 'value', () => [])]),
    ]);

    beforeEach(() => {
      testIncrementalValidate(testModel, initialData);
    });

    it('should run the validation with regular dependency on initial validation', () => {
      expect(validateA).toHaveBeenCalledTimes(1);
      expect(validateA).toHaveBeenCalledWith(
        initialData.simpleValue,
        {
          dep: initialData.pathA.value,
        },
        initialData,
        undefined,
      );
    });

    it('should run the validation with passive dependency on initial validation', () => {
      expect(validateB).toHaveBeenCalledTimes(1);
      expect(validateB).toHaveBeenCalledWith(
        initialData.simpleValue,
        {
          passiveDep: initialData.pathA.value,
        },
        initialData,
        undefined,
      );
    });

    describe('when the dependency changes', () => {
      const changedData = R.set(R.lensPath(['pathA', 'value']), 'changed', initialData);

      beforeEach(() => {
        jest.clearAllMocks();

        testIncrementalValidate(testModel, changedData);
      });

      it('should re-run the validation with regular dependency', () => {
        expect(validateA).toHaveBeenCalledTimes(1);
        expect(validateA).toHaveBeenCalledWith(
          changedData.simpleValue,
          {
            dep: changedData.pathA.value,
          },
          changedData,
          undefined,
        );
      });

      it('should not re-run the validation with passive dependency', () => {
        expect(validateB).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('depending on value that is not part of model', () => {
    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'pathA', pathA => [
        model.validate(pathA, { value: pathA, outsideModel: model.dependency(root, 'pathB') }, validateA),
      ]),
    ]);

    const changedData = R.set(R.lensPath(['pathB', 'value']), 'changed', initialData);

    beforeEach(() => {
      // initial validation
      testIncrementalValidate(testModel, initialData);

      jest.clearAllMocks();

      // incremental validation
      testIncrementalValidate(testModel, changedData);
    });

    it('should call validate when dependent data is updated', () => {
      expect(validateA).toHaveBeenCalledTimes(1);
    });
  });

  describe('validation inside condition which is inside list depending on value of another sibling list', () => {
    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'complex', complex => [
        model.field(complex, 'outerList', outerList => [
          model.array(outerList, outerElem => [
            model.withFields(outerElem, ['innerListA', 'innerListB'], ({ innerListA, innerListB }) => [
              model.array(innerListA, innerElemA => [
                model.field(innerElemA, 'value', value => [
                  model.when({}, conditionA, () => [
                    model.validate(
                      value,
                      {
                        elemsFromB: model.dependency(innerListB, model.array.all, 'value'),
                      },
                      validateA,
                    ),
                  ]),
                ]),
              ]),
              model.array(innerListB, innerElemB => [model.field(innerElemB, 'value', () => [])]),
            ]),
          ]),
        ]),
      ]),
    ]);

    beforeEach(() => {
      conditionA.mockReturnValue(true);
      validateA.mockReturnValue(undefined).mockReturnValueOnce('error');
      testIncrementalValidate(testModel, initialData);
    });

    it('should evaluate condition for both elems', () => {
      expect(conditionA).toHaveBeenCalledTimes(2);
    });

    it('should validate value on first validate', () => {
      expect(validateA).toHaveBeenCalledTimes(2);
      expect(validateA).toHaveBeenNthCalledWith(
        1,
        'AA',
        {
          elemsFromB: ['BA', 'BB'],
        },
        initialData,
        undefined,
      );
      expect(validateA).toHaveBeenNthCalledWith(
        2,
        'AB',
        {
          elemsFromB: ['BA', 'BB'],
        },
        initialData,
        undefined,
      );
    });

    it('should return correct errors', () => {
      expect(errors).toEqual({
        'complex.outerList[0].innerListA[0].value': ['error'],
      });
    });

    describe('when value changes in innerListB', () => {
      const changedData = R.set(
        R.lensPath(['complex', 'outerList', 0, 'innerListB', 0, 'value']),
        'changed',
        initialData,
      );

      beforeEach(() => {
        jest.clearAllMocks();
        validateA.mockReturnValueOnce('new error');
        testIncrementalValidate(testModel, changedData);
      });

      it('should not evaluate conditions again', () => {
        expect(conditionA).toHaveBeenCalledTimes(0);
      });

      it('should validate value again', () => {
        expect(validateA).toHaveBeenCalledTimes(2);
        expect(validateA).toHaveBeenNthCalledWith(
          1,
          'AA',
          {
            elemsFromB: ['changed', 'BB'],
          },
          changedData,
          undefined,
        );
        expect(validateA).toHaveBeenNthCalledWith(
          2,
          'AB',
          {
            elemsFromB: ['changed', 'BB'],
          },
          changedData,
          undefined,
        );
      });

      it('should return correct errors', () => {
        expect(errors).toEqual({
          'complex.outerList[0].innerListA[0].value': ['new error'],
        });
      });
    });
  });

  describe('passiveDependency', () => {
    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'simpleValue', value => [model.validate(model.passive(value), validateA)]),
    ]);

    beforeEach(() => {
      validateA.mockReturnValue(undefined);
      testIncrementalValidate(testModel, initialData);
    });

    it('should validate value on first validate', () => {
      expect(validateA).toHaveBeenCalledTimes(1);
      expect(validateA).toHaveBeenCalledWith('test', initialData, undefined);
    });

    it('should have no errors', () => {
      expect(errors).toBeUndefined();
    });

    describe('when value changes', () => {
      const changedData = R.set(R.lensPath(['simpleValue']), 'changed', initialData);

      beforeEach(() => {
        jest.clearAllMocks();
        testIncrementalValidate(testModel, changedData);
      });

      it('should not validate the changed value', () => {
        expect(validateA).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('array as model', () => {
    let arrayValidationContext: ModelValidationContext<string[]>;

    const testModel = model<string[]>((array, model) => [
      model.array(array, elem => [model.validate(elem, validateA, 'error')]),
    ]);

    const testArray = ['a', 'b', 'c'];

    beforeEach(() => {
      arrayValidationContext = createValidationContext(testModel);
      errors = validateModel(arrayValidationContext, testArray);
    });

    it('should validate all array elements', () => {
      expect(validateA).toHaveBeenCalledTimes(3);
      expect(validateA).toHaveBeenCalledWith('a', testArray, undefined);
      expect(validateA).toHaveBeenCalledWith('b', testArray, undefined);
      expect(validateA).toHaveBeenCalledWith('c', testArray, undefined);
    });

    describe('when value changes', () => {
      const changedData = R.update(1, 'changed', testArray);

      beforeEach(() => {
        jest.clearAllMocks();
        validateModel(arrayValidationContext, changedData, undefined);
      });

      it('should only validate the changed value', () => {
        expect(validateA).toHaveBeenCalledTimes(1);
        expect(validateA).toHaveBeenCalledWith('changed', changedData, undefined);
      });
    });
  });

  describe('dependsOn', () => {
    const testModel = model<TestModel>((root, model) => [
      model.withFields(root, ['simpleValue', 'simpleGroup'], ({ simpleValue, simpleGroup }) => [
        model.validate(simpleValue, model.dependsOn(simpleGroup, ['valueA', 'valueC']), validateA),
        model.validate(model.dependsOn(simpleGroup, ['valueA', 'valueC']), validateB),
      ]),
    ]);

    beforeEach(() => {
      testIncrementalValidate(testModel, initialData);
    });

    describe('with dependsOn as dependency', () => {
      it('should run the validation on initial validation', () => {
        expect(validateA).toHaveBeenCalledTimes(1);
        expect(validateA).toHaveBeenCalledWith(
          initialData.simpleValue,
          initialData.simpleGroup,
          initialData,
          undefined,
        );
      });

      describe('when field listed in dependsOn changes', () => {
        const changedData = R.set(R.lensPath(['simpleGroup', 'valueC']), 'changed', initialData);

        beforeEach(() => {
          jest.clearAllMocks();

          testIncrementalValidate(testModel, changedData);
        });

        it('should re-run the validation', () => {
          expect(validateA).toHaveBeenCalledTimes(1);
          expect(validateA).toHaveBeenCalledWith(
            changedData.simpleValue,
            changedData.simpleGroup,
            changedData,
            undefined,
          );
        });
      });

      describe('when field not listed in dependsOn changes', () => {
        const changedData = R.set(R.lensPath(['simpleGroup', 'valueB']), 'changed', initialData);

        beforeEach(() => {
          jest.clearAllMocks();

          testIncrementalValidate(testModel, changedData);
        });

        it('should not re-run the validation', () => {
          expect(validateA).toHaveBeenCalledTimes(0);
        });
      });
    });

    describe('with dependsOn as field to validate', () => {
      it('should run the validation on initial validation', () => {
        expect(validateB).toHaveBeenCalledTimes(1);
        expect(validateB).toHaveBeenCalledWith(initialData.simpleGroup, initialData, undefined);
      });

      describe('when field listed in dependsOn changes', () => {
        const changedData = R.set(R.lensPath(['simpleGroup', 'valueC']), 'changed', initialData);

        beforeEach(() => {
          jest.clearAllMocks();

          testIncrementalValidate(testModel, changedData);
        });

        it('should re-run the validation', () => {
          expect(validateB).toHaveBeenCalledTimes(1);
          expect(validateB).toHaveBeenCalledWith(changedData.simpleGroup, changedData, undefined);
        });
      });

      describe('when field not listed in dependsOn changes', () => {
        const changedData = R.set(R.lensPath(['simpleGroup', 'valueB']), 'changed', initialData);

        beforeEach(() => {
          jest.clearAllMocks();

          testIncrementalValidate(testModel, changedData);
        });

        it('should not re-run the validation', () => {
          expect(validateB).toHaveBeenCalledTimes(0);
        });
      });
    });
  });

  describe('depending on specific index of an array', () => {
    const testModel = model<TestModel>((root, model) => [
      model.withFields(root, ['simpleValue', 'simpleList'], ({ simpleValue, simpleList }) => [
        model.validate(simpleValue, model.dependency(simpleList, 0), validateA),
      ]),
    ]);

    beforeEach(() => {
      testIncrementalValidate(testModel, initialData);
    });

    it('should run the validation on initial validation', () => {
      expect(validateA).toHaveBeenCalledTimes(1);
      expect(validateA).toHaveBeenCalledWith(
        initialData.simpleValue,
        initialData.simpleList[0],
        initialData,
        undefined,
      );
    });

    describe('when element with a dependency changes', () => {
      const changedData = R.set(R.lensPath(['simpleList', 0]), 'changed', initialData);

      beforeEach(() => {
        jest.clearAllMocks();

        testIncrementalValidate(testModel, changedData);
      });

      it('should re-run the validation', () => {
        expect(validateA).toHaveBeenCalledTimes(1);
        expect(validateA).toHaveBeenCalledWith(
          changedData.simpleValue,
          changedData.simpleList[0],
          changedData,
          undefined,
        );
      });
    });

    describe('when element without a dependency changes', () => {
      const changedData = R.set(R.lensPath(['simpleList', 1]), 'changed', initialData);

      beforeEach(() => {
        jest.clearAllMocks();

        testIncrementalValidate(testModel, changedData);
      });

      it('should not re-run the validation', () => {
        expect(validateA).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('when validation inside an array uses field outside of the array as context', () => {
    const testModel = model<TestModel>((root, model) => [
      model.withFields(root, ['simpleValue', 'simpleList'], ({ simpleValue, simpleList }) => [
        model.array(simpleList, elem => [model.validate(simpleValue, elem, validateA)]),
      ]),
    ]);

    beforeEach(() => {
      validateA.mockReturnValueOnce('error 1').mockReturnValueOnce('error 2').mockReturnValueOnce('error 3');
      testIncrementalValidate(testModel, initialData);
    });

    it('should run the validate for each array elem', () => {
      expect(validateA).toHaveBeenCalledTimes(3);
      expect(validateA).toHaveBeenNthCalledWith(
        1,
        initialData.simpleValue,
        initialData.simpleList[0],
        initialData,
        undefined,
      );
      expect(validateA).toHaveBeenNthCalledWith(
        2,
        initialData.simpleValue,
        initialData.simpleList[1],
        initialData,
        undefined,
      );
      expect(validateA).toHaveBeenNthCalledWith(
        3,
        initialData.simpleValue,
        initialData.simpleList[2],
        initialData,
        undefined,
      );
    });

    it('should return error for each array item in the parent field', () => {
      expect(errors).toEqual({
        simpleValue: ['error 1', 'error 2', 'error 3'],
      });
    });
  });

  describe('computed dependencies', () => {
    const testModel = model<TestModel>((root, model) => {
      const testComputed = model.compute(
        {
          A: model.dependency(root, 'computedTest', 'numA'),
          B: model.dependency(root, 'computedTest', 'numB'),
        },
        ({ A, B }) => A + B,
      );

      const testComputedArray = model.compute(model.dependency(root, 'computedTest', 'arrayOfNums'), arrayOfNums =>
        arrayOfNums.reduce((acc, num) => acc + num, 0),
      );

      return [
        model.field(root, 'simpleValue', simpleValue => [
          model.validate(simpleValue, { computed: testComputed }, validateA),
          model.validate(simpleValue, { computed: testComputedArray }, validateB),
        ]),

        model.when({ computed: testComputed }, conditionA, () => []),
        model.when({ computed: testComputedArray }, conditionB, () => []),
      ];
    });

    beforeEach(() => {
      validateA.mockReturnValue(undefined);
      validateB.mockReturnValue(undefined);
      testIncrementalValidate(testModel, initialData);
    });

    it('should validate with correct computed data initially', () => {
      const expectedComputed = initialData.computedTest.numA + initialData.computedTest.numB;

      expect(validateA).toHaveBeenCalledTimes(1);
      expect(validateA).toHaveBeenCalledWith('test', { computed: expectedComputed }, initialData, undefined);

      const expectedComputedArray = initialData.computedTest.arrayOfNums.reduce((acc, num) => acc + num, 0);

      expect(validateB).toHaveBeenCalledTimes(1);
      expect(validateB).toHaveBeenCalledWith('test', { computed: expectedComputedArray }, initialData, undefined);
    });

    it('should check conditions with correct computed data initially', () => {
      const expectedComputed = initialData.computedTest.numA + initialData.computedTest.numB;

      expect(conditionA).toHaveBeenCalledTimes(1);
      expect(conditionA).toHaveBeenCalledWith({ computed: expectedComputed }, initialData, undefined);

      const expectedComputedArray = initialData.computedTest.arrayOfNums.reduce((acc, num) => acc + num, 0);

      expect(conditionB).toHaveBeenCalledTimes(1);
      expect(conditionB).toHaveBeenCalledWith(
        {
          computed: expectedComputedArray,
        },
        initialData,
        undefined,
      );
    });

    describe('when a computed dependency changes', () => {
      const changedData = R.set(R.lensPath(['computedTest', 'numB']), 3, initialData);

      beforeEach(() => {
        jest.clearAllMocks();
        testIncrementalValidate(testModel, changedData);
      });

      it('should re-run validation with updated computed data', () => {
        const expectedComputed = changedData.computedTest.numA + changedData.computedTest.numB;

        expect(validateA).toHaveBeenCalledTimes(1);
        expect(validateA).toHaveBeenLastCalledWith('test', { computed: expectedComputed }, changedData, undefined);
      });

      it('should re-check conditions with updated computed data', () => {
        const expectedComputed = changedData.computedTest.numA + changedData.computedTest.numB;

        expect(conditionA).toHaveBeenCalledTimes(1);
        expect(conditionA).toHaveBeenCalledWith({ computed: expectedComputed }, changedData, undefined);
      });

      it('should not re-run validations with unaffected computed data', () => {
        expect(validateB).toHaveBeenCalledTimes(0);
      });

      it('should not re-check conditions with unaffected computed data', () => {
        expect(conditionB).toHaveBeenCalledTimes(0);
      });
    });

    describe('when an array changes that is used in a computed data', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('should re-run validations and conditions with updated compuation when new item is added', () => {
        const changedData = R.over(R.lensPath(['computedTest', 'arrayOfNums']), R.append(4), initialData);

        const expectedComputed = changedData.computedTest.arrayOfNums.reduce((acc, num) => acc + num, 0);

        testIncrementalValidate(testModel, changedData);

        expect(validateB).toHaveBeenLastCalledWith('test', { computed: expectedComputed }, changedData, undefined);

        expect(conditionB).toHaveBeenLastCalledWith({ computed: expectedComputed }, changedData, undefined);
      });

      it('should re-run validations and conditions with updated compuation when item is removed', () => {
        const changedData = R.over(R.lensPath(['computedTest', 'arrayOfNums']), R.remove(0, 1), initialData);

        const expectedComputed = changedData.computedTest.arrayOfNums.reduce((acc, num) => acc + num, 0);

        testIncrementalValidate(testModel, changedData);

        expect(validateB).toHaveBeenLastCalledWith('test', { computed: expectedComputed }, changedData, undefined);

        expect(conditionB).toHaveBeenLastCalledWith({ computed: expectedComputed }, changedData, undefined);
      });

      it('should re-run validations and conditions with updated compuation when whole array is replaced', () => {
        const changedData = R.set(R.lensPath(['computedTest', 'arrayOfNums']), [4, 5, 6], initialData);

        const expectedComputed = changedData.computedTest.arrayOfNums.reduce((acc, num) => acc + num, 0);

        testIncrementalValidate(testModel, changedData);

        expect(validateB).toHaveBeenLastCalledWith('test', { computed: expectedComputed }, changedData, undefined);

        expect(conditionB).toHaveBeenLastCalledWith({ computed: expectedComputed }, changedData, undefined);
      });
    });
  });

  describe('builder utils', () => {
    describe('pick', () => {
      const testModel = model<TestModel>((root, model) => {
        return [
          model.withFields(root, ['simpleGroup', 'list', 'computedTest'], ({ simpleGroup, list, computedTest }) => {
            return [
              // test picking from object
              model.when({ picked: model.pick(simpleGroup, ['valueA', 'valueC']) }, conditionA, () => []),
              // test picking from array of objects
              model.when(
                {
                  picked: model.pick(model.dependency(list, model.array.all), ['value']),
                },
                conditionB,
                () => [],
              ),
              // test picking from computed data
              model.when(
                {
                  picked: model.pick(
                    model.compute(computedTest, it => ({
                      summed: it.numA + it.numB,
                      multiplied: it.numA * it.numB,
                    })),
                    ['summed'],
                  ),
                },
                conditionC,
                () => [],
              ),
            ];
          }),
        ];
      });

      beforeEach(() => {
        testIncrementalValidate(testModel, initialData);
      });

      describe('with objects as input', () => {
        it('should pick data from object correctly', () => {
          expect(conditionA).toHaveBeenCalledTimes(1);
          expect(conditionA).toHaveBeenCalledWith(
            {
              picked: {
                valueA: initialData.simpleGroup.valueA,
                valueC: initialData.simpleGroup.valueC,
              },
            },
            initialData,
            undefined,
          );
        });

        it('should re-run when picked property changes', () => {
          jest.clearAllMocks();

          const changedData = R.set(R.lensPath(['simpleGroup', 'valueA']), 'changed', initialData);

          testIncrementalValidate(testModel, changedData);

          expect(conditionA).toHaveBeenCalledTimes(1);
          expect(conditionA).toHaveBeenCalledWith(
            {
              picked: {
                valueA: changedData.simpleGroup.valueA,
                valueC: changedData.simpleGroup.valueC,
              },
            },
            changedData,
            undefined,
          );
        });

        it('should not re-run when non-picked property changes', () => {
          jest.clearAllMocks();

          const changedData = R.set(R.lensPath(['simpleGroup', 'valueB']), 'changed', initialData);

          testIncrementalValidate(testModel, changedData);

          expect(conditionA).toHaveBeenCalledTimes(0);
        });
      });

      describe('with array items from array.all as input', () => {
        it('should pick data from array correctly', () => {
          expect(conditionB).toHaveBeenCalledTimes(1);
          expect(conditionB).toHaveBeenCalledWith(
            {
              picked: initialData.list.map(R.pick(['value'])),
            },
            initialData,
            undefined,
          );
        });

        it('should re-run when picked property changes', () => {
          jest.clearAllMocks();

          const changedData = R.set(R.lensPath(['list', 0, 'value']), 'changed', initialData);

          testIncrementalValidate(testModel, changedData);

          expect(conditionB).toHaveBeenCalledTimes(1);
          expect(conditionB).toHaveBeenCalledWith(
            {
              picked: changedData.list.map(R.pick(['value'])),
            },
            changedData,
            undefined,
          );
        });

        it('should not re-run when non-picked property changes', () => {
          jest.clearAllMocks();

          const changedData = R.set(R.lensPath(['list', 0, 'otherValue']), 'changed', initialData);

          testIncrementalValidate(testModel, changedData);

          expect(conditionB).toHaveBeenCalledTimes(0);
        });
      });

      describe('with computed data as input', () => {
        it('should pick data from array correctly', () => {
          expect(conditionC).toHaveBeenCalledTimes(1);
          expect(conditionC).toHaveBeenCalledWith(
            {
              picked: {
                summed: 3,
              },
            },
            initialData,
            undefined,
          );
        });

        it('should re-run when inputs for computed data changes', () => {
          jest.clearAllMocks();

          const changedData = R.set(R.lensPath(['computedTest', 'numA']), 2, initialData);

          testIncrementalValidate(testModel, changedData);

          expect(conditionC).toHaveBeenCalledTimes(1);
          expect(conditionC).toHaveBeenCalledWith(
            {
              picked: {
                summed: 4,
              },
            },
            changedData,
            undefined,
          );
        });
      });
    });
  });

  describe('duplicate errors', () => {
    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'simpleValue', data => [model.validate(data, validateA), model.validate(data, validateB)]),
    ]);

    beforeEach(() => {
      validateA.mockReturnValue('test error');
      validateB.mockReturnValue('test error');
      testIncrementalValidate(testModel, initialData);
    });

    it('should only return unique errors', () => {
      expect(errors).toEqual({ simpleValue: ['test error'] });
    });

    describe('when a duplicate error changes to unique error', () => {
      const changedData = R.set(R.lensPath(['simpleValue']), 'changed', initialData);

      beforeEach(() => {
        jest.clearAllMocks();
        validateA.mockReturnValue('test error');
        validateB.mockReturnValue('changed error');
        testIncrementalValidate(testModel, changedData);
      });

      it('should give both errors', () => {
        expect(errors).toEqual({
          simpleValue: ['test error', 'changed error'],
        });
      });

      describe('when unique errors changes to duplicate error', () => {
        const changedData = R.set(R.lensPath(['simpleValue']), 'changed again', initialData);

        beforeEach(() => {
          jest.clearAllMocks();
          validateA.mockReturnValue('test error');
          validateB.mockReturnValue('test error');
          testIncrementalValidate(testModel, changedData);
        });

        it('should give only one error', () => {
          expect(errors).toEqual({
            simpleValue: ['test error'],
          });
        });
      });
    });
  });
});
