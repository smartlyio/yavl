import model from './model';
import {
  Model,
  WhenDefinitionInput,
  ArrayDefinition,
  ValidateDefinition,
  WhenDefinition,
  AnnotateDefinition,
  SupportedDefinition,
} from './types';
import processDefinitionList from './processDefinitionList';
import { createAnnotation } from './annotations';

type TestModel = {
  value: string;
  nested: {
    list: {
      value: string;
    }[];
  };
  anotherValue: string;
};

let testModel: Model<TestModel>;

const testAnnotation = createAnnotation<boolean>('test');

describe('buildFieldDependencyCache', () => {
  let arrayDefinition: ArrayDefinition<any>;

  const captureArray = (definition: SupportedDefinition) => {
    arrayDefinition = processDefinitionList([], [definition])[0] as ArrayDefinition<any>;

    return definition;
  };

  describe('annotations', () => {
    let annotation: AnnotateDefinition;

    const captureAnnotation = (definition: SupportedDefinition) => {
      annotation = processDefinitionList([], [definition])[0] as AnnotateDefinition;

      return definition;
    };

    describe('simple annotation', () => {
      beforeEach(() => {
        testModel = model<TestModel>((root, model) => [
          model.field(root, 'value', value => [captureAnnotation(model.annotate(value, testAnnotation, true))]),
        ]);
      });

      it('should add cache entry for annotation', () => {
        expect(testModel.fieldDependencyCache['internal:value']?.annotations).toEqual([
          {
            definition: annotation,
            modelPath: [
              {
                type: 'field',
                name: 'value',
              },
            ],
            parentDefinitions: [testModel.modelDefinition],
            isDependencyOfValue: false,
            isComputedValue: false,
          },
        ]);
      });
    });

    describe('nested annotation', () => {
      beforeEach(() => {
        testModel = model<TestModel>((root, model) => [
          model.field(root, 'nested', nested => [
            model.field(nested, 'list', list => [
              captureArray(
                model.array(list, elem => [
                  model.field(elem, 'value', value => [captureAnnotation(model.annotate(value, testAnnotation, true))]),
                ]),
              ),
            ]),
          ]),
        ]);
      });

      it('should add cache entry with correct parent definitions', () => {
        expect(testModel.fieldDependencyCache['internal:nested.list[current].value']?.annotations).toEqual([
          {
            definition: annotation,
            modelPath: [
              {
                type: 'field',
                name: 'nested',
              },
              {
                type: 'field',
                name: 'list',
              },
              {
                type: 'array',
                focus: 'current',
              },
              {
                type: 'field',
                name: 'value',
              },
            ],
            parentDefinitions: [testModel.modelDefinition, arrayDefinition],
            isDependencyOfValue: false,
            isComputedValue: false,
          },
        ]);
      });
    });

    describe('dynamic annotation', () => {
      beforeEach(() => {
        testModel = model<TestModel>((root, model) => [
          model.withFields(root, ['value', 'anotherValue', 'nested'], ({ value, anotherValue, nested }) => [
            captureAnnotation(
              model.annotate(
                value,
                testAnnotation,
                model.compute(
                  {
                    anotherValue,
                    nestedList: model.dependency(nested, 'list'),
                  },
                  () => true,
                ),
              ),
            ),
          ]),
        ]);
      });

      it('should add cache entry for the field for which the annotation is added', () => {
        expect(testModel.fieldDependencyCache['internal:value']?.annotations).toEqual([
          {
            definition: annotation,
            modelPath: [
              {
                type: 'field',
                name: 'value',
              },
            ],
            parentDefinitions: [testModel.modelDefinition],
            isDependencyOfValue: false,
            isComputedValue: false,
          },
        ]);
      });

      it('should add cache entries for any fields that are used to compute the value', () => {
        expect(testModel.fieldDependencyCache['internal:anotherValue']?.annotations).toEqual([
          {
            definition: annotation,
            modelPath: [
              {
                type: 'field',
                name: 'anotherValue',
              },
            ],
            parentDefinitions: [testModel.modelDefinition],
            isDependencyOfValue: true,
            isComputedValue: false,
          },
        ]);

        expect(testModel.fieldDependencyCache['internal:nested.list']?.annotations).toEqual([
          {
            definition: annotation,
            modelPath: [
              {
                type: 'field',
                name: 'nested',
              },
              {
                type: 'field',
                name: 'list',
              },
            ],
            parentDefinitions: [testModel.modelDefinition],
            isDependencyOfValue: true,
            isComputedValue: false,
          },
        ]);
      });
    });
  });

  describe('validations', () => {
    let validation: ValidateDefinition<any>;

    const captureValidation = (definition: SupportedDefinition<any>) => {
      validation = processDefinitionList([], [definition])[0] as ValidateDefinition<any>;

      return definition;
    };

    describe('with only context', () => {
      beforeEach(() => {
        testModel = model<TestModel>((root, model) => [
          model.field(root, 'value', value => [captureValidation(model.validate(value, () => true, 'test error'))]),
        ]);
      });

      it('should add cache entry for the value field', () => {
        expect(testModel.fieldDependencyCache['internal:value']?.validations).toEqual([
          {
            definition: validation,
            modelPath: [
              {
                type: 'field',
                name: 'value',
              },
            ],
            parentDefinitions: [testModel.modelDefinition],
            isDependency: false,
            isPassive: false,
          },
        ]);
      });
    });

    describe('with passive context', () => {
      beforeEach(() => {
        testModel = model<TestModel>((root, model) => [
          model.field(root, 'value', value => [
            captureValidation(model.validate(model.passive(value), () => true, 'test error')),
          ]),
        ]);
      });

      it('should add cache entry for the value field', () => {
        expect(testModel.fieldDependencyCache['internal:value']?.validations).toEqual([
          {
            definition: validation,
            modelPath: [
              {
                type: 'field',
                name: 'value',
              },
            ],
            parentDefinitions: [testModel.modelDefinition],
            isDependency: false,
            isPassive: true,
          },
        ]);
      });
    });

    describe('with context and dependencies', () => {
      beforeEach(() => {
        testModel = model<TestModel>((root, model) => [
          model.field(root, 'value', value => [
            captureValidation(
              model.validate(value, { anotherValue: model.dependency(root, 'anotherValue') }, () => true, 'test error'),
            ),
          ]),
        ]);
      });

      it('should add cache entry for the value field', () => {
        expect(testModel.fieldDependencyCache['internal:value']?.validations).toEqual([
          {
            definition: validation,
            modelPath: [
              {
                type: 'field',
                name: 'value',
              },
            ],
            parentDefinitions: [testModel.modelDefinition],
            isDependency: false,
            isPassive: false,
          },
        ]);
      });

      it('should add cache entry for the anotherValue field', () => {
        expect(testModel.fieldDependencyCache['internal:anotherValue']?.validations).toEqual([
          {
            definition: validation,
            modelPath: [
              {
                type: 'field',
                name: 'anotherValue',
              },
            ],
            parentDefinitions: [testModel.modelDefinition],
            isDependency: true,
            isPassive: false,
          },
        ]);
      });
    });

    describe('nested validations', () => {
      beforeEach(() => {
        testModel = model<TestModel>((root, model) => [
          model.field(root, 'nested', nested => [
            model.field(nested, 'list', list => [
              captureArray(
                model.array(list, elem => [
                  model.field(elem, 'value', value => [
                    captureValidation(model.validate(value, () => true, 'test error')),
                  ]),
                ]),
              ),
            ]),
          ]),
        ]);
      });

      it('should add cache entry with correct parent definitions', () => {
        expect(testModel.fieldDependencyCache['internal:nested.list[current].value']?.validations).toEqual([
          {
            definition: validation,
            modelPath: [
              {
                type: 'field',
                name: 'nested',
              },
              {
                type: 'field',
                name: 'list',
              },
              {
                type: 'array',
                focus: 'current',
              },
              {
                type: 'field',
                name: 'value',
              },
            ],
            parentDefinitions: [testModel.modelDefinition, arrayDefinition],
            isDependency: false,
            isPassive: false,
          },
        ]);
      });
    });

    describe('nested dependencies', () => {
      beforeEach(() => {
        testModel = model<TestModel>((root, model) => [
          model.field(root, 'value', value => [
            captureValidation(
              model.validate(
                value,
                model.dependency(root, 'nested', 'list', model.array.all, 'value'),
                () => true,
                'test error',
              ),
            ),
          ]),
        ]);
      });

      it('should add cache entry for the nested value field', () => {
        expect(testModel.fieldDependencyCache['internal:nested.list[all].value']?.validations).toEqual([
          {
            definition: validation,
            modelPath: [
              {
                type: 'field',
                name: 'nested',
              },
              {
                type: 'field',
                name: 'list',
              },
              {
                type: 'array',
                focus: 'all',
              },
              {
                type: 'field',
                name: 'value',
              },
            ],
            parentDefinitions: [testModel.modelDefinition],
            isDependency: true,
            isPassive: false,
          },
        ]);
      });
    });
  });

  describe('conditions', () => {
    let condition: WhenDefinitionInput<any>;

    const captureCondition = (definitions: SupportedDefinition<any>[]) => {
      condition = processDefinitionList([], definitions)[0] as WhenDefinition<any>;

      return definitions;
    };

    describe('with only dependencies', () => {
      beforeEach(() => {
        testModel = model<TestModel>((root, model) => [
          model.field(root, 'value', () => [
            captureCondition(
              model.when(
                { anotherValue: model.dependency(root, 'anotherValue') },
                () => true,
                () => [],
              ),
            ),
          ]),
        ]);
      });

      it('should add cache entry for the anotherValue field', () => {
        expect(testModel.fieldDependencyCache['internal:anotherValue']?.conditions).toEqual([
          {
            definition: condition,
            modelPath: [
              {
                type: 'field',
                name: 'anotherValue',
              },
            ],
            parentDefinitions: [testModel.modelDefinition],
          },
        ]);
      });
    });

    describe('nested conditions', () => {
      beforeEach(() => {
        testModel = model<TestModel>((root, model) => [
          model.field(root, 'nested', nested => [
            model.field(nested, 'list', list => [
              captureArray(
                model.array(list, elem => [
                  model.field(elem, 'value', value => [
                    captureCondition(
                      model.when(
                        value,
                        () => true,
                        () => [],
                      ),
                    ),
                  ]),
                ]),
              ),
            ]),
          ]),
        ]);
      });

      it('should add cache entry with correct parent definitions', () => {
        expect(testModel.fieldDependencyCache['internal:nested.list[current].value']?.conditions).toEqual([
          {
            definition: condition,
            modelPath: [
              {
                type: 'field',
                name: 'nested',
              },
              {
                type: 'field',
                name: 'list',
              },
              {
                type: 'array',
                focus: 'current',
              },
              {
                type: 'field',
                name: 'value',
              },
            ],
            parentDefinitions: [testModel.modelDefinition, arrayDefinition],
          },
        ]);
      });
    });

    describe('nested dependencies', () => {
      beforeEach(() => {
        testModel = model<TestModel>((root, model) => [
          model.field(root, 'value', () => [
            captureCondition(
              model.when(
                model.dependency(root, 'nested', 'list', model.array.all, 'value'),
                () => true,
                () => [],
              ),
            ),
          ]),
        ]);
      });

      it('should add cache entry for the nested value field', () => {
        expect(testModel.fieldDependencyCache['internal:nested.list[all].value']?.conditions).toEqual([
          {
            definition: condition,
            modelPath: [
              {
                type: 'field',
                name: 'nested',
              },
              {
                type: 'field',
                name: 'list',
              },
              {
                type: 'array',
                focus: 'all',
              },
              {
                type: 'field',
                name: 'value',
              },
            ],
            parentDefinitions: [testModel.modelDefinition],
          },
        ]);
      });
    });
  });
});
