import {
  createAnnotation,
  createValidationContext,
  getAllAnnotations,
  Model,
  model,
  ModelValidationContext,
  updateModel,
} from '../src';
import { AnnotationData } from '../src/types';

const testAnnotation = createAnnotation<string | undefined>('test');

describe('annotations', () => {
  let validationContext: ModelValidationContext<any> | undefined;

  const testIncrementalValidate = <T>(testModel: Model<T>, data: T) => {
    if (!validationContext) {
      validationContext = createValidationContext(testModel);
    }

    updateModel(validationContext, data);
  };

  beforeEach(() => {
    validationContext = undefined;
  });

  describe('annotation for a value outside array defined inside array', () => {
    type TestModel = {
      value?: string;
      list: string[];
    };

    const testModel = model<TestModel>((root, model) => [
      model.withFields(root, ['value', 'list'], ({ value, list }) => [
        model.array(list, item => [
          model.annotate(value, testAnnotation, item),
          model.validate(value, item, (_, item) => `error: ${item}`),
        ]),
      ]),
    ]);

    it('should work for initial update', () => {
      testIncrementalValidate(testModel, { list: ['a', 'b', 'c'] });

      expect(getAllAnnotations(validationContext!)).toEqual({
        value: {
          [testAnnotation]: 'c',
        },
      });
    });

    it('should work for incremental update', () => {
      testIncrementalValidate(testModel, { list: [] });
      testIncrementalValidate(testModel, { list: ['a', 'b', 'c'] });

      expect(getAllAnnotations(validationContext!)).toEqual({
        value: {
          [testAnnotation]: 'c',
        },
      });
    });
  });

  describe('annotations inside array items', () => {
    type TestModel = {
      list: string[];
    };

    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'list', list => [model.array(list, item => [model.annotate(item, testAnnotation, 'test')])]),
    ]);

    it('should return annotations for initial items', () => {
      testIncrementalValidate(testModel, { list: ['a', 'b'] });

      expect(getAllAnnotations(validationContext!)).toEqual({
        'list[0]': {
          [testAnnotation]: 'test',
        },
        'list[1]': {
          [testAnnotation]: 'test',
        },
      });
    });

    it('should return annotations for new items', () => {
      testIncrementalValidate(testModel, { list: ['a'] });
      testIncrementalValidate(testModel, { list: ['a', 'b', 'c'] });

      expect(getAllAnnotations(validationContext!)).toEqual({
        'list[0]': {
          [testAnnotation]: 'test',
        },
        'list[1]': {
          [testAnnotation]: 'test',
        },
        'list[2]': {
          [testAnnotation]: 'test',
        },
      });
    });

    it('should remove annotations for deleted items', () => {
      testIncrementalValidate(testModel, { list: ['a', 'b', 'c'] });
      testIncrementalValidate(testModel, { list: ['a'] });

      expect(getAllAnnotations(validationContext!)).toEqual({
        'list[0]': {
          [testAnnotation]: 'test',
        },
      });
    });
  });

  describe('annotations inside conditions and array items', () => {
    type TestModel = {
      list: { value: string | undefined }[];
    };

    const testModel = model<TestModel>((root, model) => [
      model.field(root, 'list', list => [
        model.array(list, item => [
          model.when(
            item,
            item => item.value !== undefined,
            () => [model.annotate(item, testAnnotation, 'test')],
          ),
        ]),
      ]),
    ]);

    it('should return annotations for initial items', () => {
      testIncrementalValidate(testModel, {
        list: [{ value: 'a' }, { value: 'b' }],
      });

      expect(getAllAnnotations(validationContext!)).toEqual({
        'list[0]': {
          [testAnnotation]: 'test',
        },
        'list[1]': {
          [testAnnotation]: 'test',
        },
      });
    });

    it('should return annotations for new items', () => {
      testIncrementalValidate(testModel, { list: [{ value: 'a' }] });
      testIncrementalValidate(testModel, {
        list: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
      });

      expect(getAllAnnotations(validationContext!)).toEqual({
        'list[0]': {
          [testAnnotation]: 'test',
        },
        'list[1]': {
          [testAnnotation]: 'test',
        },
        'list[2]': {
          [testAnnotation]: 'test',
        },
      });
    });

    it('should remove annotations for deleted items', () => {
      testIncrementalValidate(testModel, {
        list: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
      });

      testIncrementalValidate(testModel, { list: [{ value: 'a' }] });

      expect(getAllAnnotations(validationContext!)).toEqual({
        'list[0]': {
          [testAnnotation]: 'test',
        },
      });
    });
  });

  describe('annotation API', () => {
    describe('when annotation for a field changes', () => {
      type TestModel = {
        a?: string;
        b?: string;
      };

      const testModel = model<TestModel>((root, model) => [
        model.withFields(root, ['a', 'b'], ({ a, b }) => [
          model.annotate(a, testAnnotation, a),
          model.annotate(b, testAnnotation, b),
        ]),
      ]);

      let initialAnnotations: Record<string, AnnotationData>;
      let oldAnnotations: Record<string, AnnotationData>;
      let newAnnotations: Record<string, AnnotationData>;

      beforeEach(() => {
        validationContext = createValidationContext(testModel);
        initialAnnotations = getAllAnnotations(validationContext!);

        testIncrementalValidate(testModel, { a: 'x', b: 'y' });
        oldAnnotations = getAllAnnotations(validationContext!);

        testIncrementalValidate(testModel, { a: 'changed', b: 'y' });
        newAnnotations = getAllAnnotations(validationContext!);
      });

      it('should not mutate objects that have been returned', () => {
        expect(initialAnnotations).toEqual({});
        expect(oldAnnotations).toEqual({ a: { test: 'x' }, b: { test: 'y' } });
        expect(newAnnotations).toEqual({
          a: { test: 'changed' },
          b: { test: 'y' },
        });
      });

      it('should return new object reference for changed paths', () => {
        expect(Object.is(newAnnotations.a, oldAnnotations.a)).toBe(false);
      });

      it('should retain same object reference for unchanged paths', () => {
        expect(Object.is(newAnnotations.b, oldAnnotations.b)).toBe(true);
      });
    });
  });
});
