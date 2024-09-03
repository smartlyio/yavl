import {
  ModelContext,
  ModelDefinitionFn,
  ArrayCurrentFocusFn,
  ArrayAllFocusFn,
  MaybeArrayItem,
  CreateToArrayFn,
  SupportedDefinition,
} from '../types';

export type CallableArrayFn<ErrorType> = <FieldType>(
  parentContext: ModelContext<FieldType>,
  modelDefinitionFn: ModelDefinitionFn<ModelContext<MaybeArrayItem<FieldType>>, ErrorType>,
) => SupportedDefinition<ErrorType>;

export type ArrayFn<ErrorType = string> = CallableArrayFn<ErrorType> & {
  current: ArrayCurrentFocusFn;
  all: ArrayAllFocusFn;
  append: CreateToArrayFn;
  prepend: CreateToArrayFn;
  insert: (index: number) => CreateToArrayFn;
  replace: (index: number, removeCount: number) => CreateToArrayFn;
};

const array: ArrayFn<any> = (
  parentContext: ModelContext<any>,
  modelDefinitionFn: ModelDefinitionFn<any, any>,
): SupportedDefinition<any> => {
  const context: ModelContext<any> = {
    type: parentContext.type,
    pathToField: parentContext.pathToField.concat(array.current()),
  };

  const definitions = modelDefinitionFn(context);

  return {
    type: 'array',
    context,
    children: [definitions],
  };
};

array.current = () => ({
  type: 'array',
  focus: 'current',
});

array.all = () => ({ type: 'array', focus: 'all' });

array.append = (array: readonly unknown[]) => ({
  index: array.length,
});

array.prepend = () => ({
  index: 0,
});

array.insert = (index: number) => () => ({
  index,
});

array.replace = (index: number, removeCount: number) => () => ({
  index,
  removeCount,
});

export default array;
