export type FieldFocus = { type: 'field'; name: string };

export type ArrayCurrentFocus = { type: 'array'; focus: 'current' };
export type ArrayAllFocus = { type: 'array'; focus: 'all' };
export type ArrayIndexFocus = {
  type: 'array';
  focus: 'index';
  index: number;
  multiToSingleFocus: boolean;
};
export type ArrayFocus = ArrayCurrentFocus | ArrayAllFocus | ArrayIndexFocus;

export type ArrayCurrentFocusFn = () => ArrayCurrentFocus;
export type ArrayAllFocusFn = () => ArrayAllFocus;
export type ArrayFocusFn = ArrayCurrentFocusFn | ArrayAllFocusFn;

/**
 * NarrowFocus can be used to narrow down a type, eg. objects with pick
 * and arrays with filter.
 *
 * The benefit of NarrowFocus is that since the resulting data has to
 * be a subset of the input data, you can still further dive to the type
 * with field/dependency builder functions. For example:
 *
 * const narrowedObj = pick(obj, ['foo', 'bar']);
 * const fooDep = dependency(
 *   narrowedObj,
 *   'foo'
 * )
 */
export type PickFocus = {
  type: 'pick';
  keys: readonly string[];
};

export type FilterFnWithoutDependencies<Type, Keys extends keyof Type & string> = (
  data: Pick<Type, Keys>,
  index: number,
) => boolean;

export type FilterFnWithDependencies<Type, Keys extends keyof Type & string, Dependencies> = (
  data: Pick<Type, Keys>,
  dependencies: Dependencies,
  index: number,
) => boolean;

export type FilterFocus = {
  type: 'filter';
  keys: readonly string[];
} & (
  | {
      filterFn: FilterFnWithoutDependencies<any, any>;
    }
  | {
      dependencies: any;
      filterFn: FilterFnWithDependencies<any, any, any>;
    }
);

export type CreateToArray = {
  index: number;
  removeCount?: number;
};
export type CreateToArrayFn = (array: readonly unknown[]) => CreateToArray;

export type AnnotationFocus = {
  type: 'annotation';
  annotation: Annotation<any>;
  defaultValue:
    | {
        hasValue: true;
        value: any;
      }
    | { hasValue: false };
};

export type PathFocus = {
  type: 'path';
};

export type IndexFocus = {
  type: 'index';
};

export type PathToField = ReadonlyArray<
  FieldFocus | ArrayFocus | PickFocus | FilterFocus | AnnotationFocus | PathFocus | IndexFocus
>;
export type DataPathToField = Array<string | number>;

/**
 * The regular "keyof Foo | Bar" will only give you shared keys between Foo and Bar,
 * or "never" if there are no common keys shared between the typess.
 *
 * "KeysOfUnion<Foo | Bar>" will return all the keys in both of the types.
 */
export type KeysOfUnion<T> = T extends Record<string, unknown>
  ? keyof T
  : T extends readonly unknown[]
  ? number
  : never;

/**
 * Uses distributive conditional types to figure out if K exists in every type of union type T:
 * https://www.typescriptlang.org/docs/handbook/advanced-types.html#distributive-conditional-types
 *
 * If K exists in all types of union, the return type is just "T[K]", if it does not exist in some
 * of the types, the return type will be "T[K] | undefined" instead.
 */
export type MaybeField<T, K> = T extends any ? (K extends keyof T ? T[K] : undefined) : never;

export type MaybeArrayItem<T> = Exclude<T, readonly unknown[]> extends never
  ? Extract<T, readonly unknown[]>[number]
  : Extract<T, readonly unknown[]>[number] | undefined;

type ContextWithPath = {
  pathToField: PathToField;
};

type BaseModelContext<FieldType> = ContextWithPath & {
  isPassive?: boolean;
  dependsOn?: readonly AnyModelContext<any>[];
  __tag?: {
    type: FieldType;
  };
};

export type OptionallyArray<T> = T | readonly T[];

export type ChangeFieldType<T, K extends keyof T, U> = Omit<T, K> & { [P in K]: U };

export type ModelContext<FieldType> = BaseModelContext<FieldType> & {
  type: 'internal';
  multiFocus?: false;
  nonExtensible?: false;
  /**
   * We use isComputedValue to differentiate between value() and
   * sideEffect(). For value() we want to evaluate the annotation
   * even if the context changes, but for sideEffect() we don't
   */
  isComputedValue?: boolean;
};

export type ArrayModelContext<FieldType> = BaseModelContext<FieldType> & {
  type: 'internal';
  multiFocus: true;
  nonExtensible?: false;
};

export type NonExtensibleModelContext<FieldType> = BaseModelContext<FieldType> & {
  type: 'internal';
  multiFocus?: false;
  nonExtensible: true;
};

export type NonExtensibleArrayModelContext<FieldType> = BaseModelContext<FieldType> & {
  type: 'internal';
  multiFocus: true;
  nonExtensible: true;
};

export type ExternalModelContext<FieldType> = BaseModelContext<FieldType> & {
  type: 'external';
  multiFocus?: false;
};

export type ExternalArrayModelContext<FieldType> = BaseModelContext<FieldType> & {
  type: 'external';
  multiFocus: true;
};

export type AnyExtensibleSingleModelContext<FieldType> = ModelContext<FieldType> | ExternalModelContext<FieldType>;

export type AnyExtensibleArrayModelContext<FieldType> =
  | ArrayModelContext<FieldType>
  | ExternalArrayModelContext<FieldType>;

export type AnySingleModelContext<FieldType> =
  | AnyExtensibleSingleModelContext<FieldType>
  | NonExtensibleModelContext<FieldType>;

export type AnyArrayModelContext<FieldType> =
  | AnyExtensibleArrayModelContext<FieldType>
  | NonExtensibleArrayModelContext<FieldType>;

export type AnyExtensibleModelContext<FieldType> =
  | AnyExtensibleSingleModelContext<FieldType>
  | AnyExtensibleArrayModelContext<FieldType>;

export type AnyExtensibleContext<Type> = AnyExtensibleModelContext<Type>;

export type AnyModelContext<FieldType> = AnySingleModelContext<FieldType> | AnyArrayModelContext<FieldType>;

export type ComputeFn<Data, ReturnType> = (data: Data) => ReturnType;

export type ComputedContext<Type> = {
  type: 'computed';
  dependencies: any;
  computeFn: ComputeFn<any, Type>;
  /**
   * !!! DO NOT REMOVE !!!
   * We need __tag to add a value type in addition to the function return type, because of
   * how covariance and contravariance works in TS. If we don't have this, you can bump
   * into weird corner-cases where "ComputedContext<A | B>" is assignable to just "ComputedContext<A>".
   */
  __tag?: { type: Type };
};

export type PreviousContext<Type> = {
  type: 'previous';
  dependencies: any;
  /**
   * !!! DO NOT REMOVE !!!
   * We need __tag to add a value type in addition to the function return type, because of
   * how covariance and contravariance works in TS. If we don't have this, you can bump
   * into weird corner-cases where "ComputedContext<A | B>" is assignable to just "ComputedContext<A>".
   */
  __tag?: { type: Type };
};

export type AnySingleContext<Type> = AnySingleModelContext<Type> | ComputedContext<Type> | PreviousContext<Type>;

export type AnyContext<Type> = AnyModelContext<Type> | ComputedContext<Type> | PreviousContext<Type>;

export type ContextType<Context> = Context extends AnyContext<infer Type> ? Type : never;

export type ValueOrContextOfType<T> = NoInfer<
  | T
  | ComputedContext<T>
  | PreviousContext<T>
  | ([T] extends [readonly unknown[]] // disable distributive union types by wrapping in tuple
      ? AnySingleModelContext<T> | AnyArrayModelContext<T[number]>
      : AnySingleModelContext<T>)
>;

export type SameContextOfType<Context, Type> = Context extends ArrayModelContext<any>
  ? ArrayModelContext<Type>
  : Context extends ExternalArrayModelContext<any>
  ? ExternalArrayModelContext<Type>
  : Context extends ModelContext<any>
  ? ModelContext<Type>
  : Context extends ExternalModelContext<any>
  ? ExternalModelContext<Type>
  : Context extends ComputedContext<any>
  ? ComputedContext<Type>
  : never;

export type SameNonExtensibleModelContextOfType<Context, Type> = Context extends ArrayModelContext<any>
  ? NonExtensibleArrayModelContext<Type>
  : Context extends ModelContext<any>
  ? NonExtensibleModelContext<Type>
  : never;

type ArrayItemContextType<Context> = (ContextType<Context> & readonly unknown[])[number];

// Converts ModelContext<T[]> => ArrayModelContext<T>
// Converts ExternalModelContext<T[]> => ExternalArrayModelContext<T>
// Retain ComputedContext<T[]> => ComputedContext<T[]>
// TODO: come up with a better name?
export type ArrayOfSameContextType<Context> = Context extends ModelContext<readonly any[]>
  ? ArrayModelContext<ArrayItemContextType<Context>>
  : Context extends ExternalModelContext<readonly any[]>
  ? ExternalArrayModelContext<ArrayItemContextType<Context>>
  : Context extends ComputedContext<readonly any[]>
  ? Context
  : never;

// Converts ModelContext<T> => ArrayModelContext<T>
// Converts ExternalModelContext<T> => ExternalArrayModelContext<T>
// Retains ArrayModelContext<T>
// Retains ExternalArrayModelContext<T>
// Retains ComputedContext<T[]>
export type ModelContextToArrayModelContext<Context> = Context extends AnyArrayModelContext<any>
  ? Context
  : Context extends ModelContext<infer T>
  ? ArrayModelContext<T>
  : Context extends ExternalModelContext<infer T>
  ? ExternalArrayModelContext<T>
  : Context extends ComputedContext<readonly any[]>
  ? Context
  : never;

// Converts ArrayModelContext<string> => ModelContext<string>
// Converts ComputedContext<T[]> => ComputedContext<T>
export type ArrayModelContextToSingleModelContext<Context> = Context extends ArrayModelContext<any>
  ? ModelContext<ContextType<Context>>
  : Context extends ExternalArrayModelContext<any>
  ? ExternalModelContext<ContextType<Context>>
  : Context extends ComputedContext<readonly any[]>
  ? ComputedContext<ArrayItemContextType<Context>>
  : never;

export type Annotation<T> = string & { __annotation?: T };
export type AnnotationData = Record<Annotation<any>, any>;

export type ArrayDefinitionInput<ErrorType> = {
  type: 'array';
  context: ModelContext<any>;
  children: DefinitionListInput<ErrorType>;
};

export type ArrayDefinition<ErrorType> = ChangeFieldType<
  ArrayDefinitionInput<ErrorType>,
  'children',
  DefinitionList<ErrorType>
>;

export type WhenTestFn<Data, FormData, ExternalData, NarrowedType extends Data> =
  | ((data: Data, formData: FormData, extData: ExternalData) => data is NarrowedType)
  | ((data: Data, formData: FormData, extData: ExternalData) => boolean);

export type WhenDefinitionInput<ErrorType> = {
  type: 'when';
  dependencies: any;
  testFn: WhenTestFn<any, any, any, any>;
  children: DefinitionListInput<ErrorType>;
};

export type WhenDefinition<ErrorType> = ChangeFieldType<
  WhenDefinitionInput<ErrorType>,
  'children',
  DefinitionList<ErrorType>
>;

export type ValidatorFnWithoutDependencies<FieldType, FormData, ExternalData, ReturnType> = (
  value: FieldType,
  formData: FormData,
  externalData: ExternalData,
) => ReturnType;

export type ValidatorFnWithDependencies<FieldType, Dependencies, FormData, ExternalData, ReturnType> = (
  value: FieldType,
  dependencies: Dependencies,
  formData: FormData,
  externalData: ExternalData,
) => ReturnType;

export type Dependency = {
  type: 'internal' | 'external';
  pathToField: PathToField;
};

export type ValidateDefinitionInput<ErrorType> = {
  type: 'validate';
  context: ModelContext<any>;
  dependencies?: any;
  validators: ReadonlyArray<(...args: any[]) => ErrorType | ErrorType[] | undefined>;
};

export type ValidateDefinition<ErrorType> = ValidateDefinitionInput<ErrorType>;

export type AnnotateDefinitionInput = {
  type: 'annotation';
  context: ModelContext<any>;
  annotation: Annotation<any>;
  value: any;
};

export type AnnotateDefinition = AnnotateDefinitionInput;

export type FieldDependencyAnnotation<ErrorType> = {
  definition: AnnotateDefinition;
  modelPath: PathToField;
  parentDefinitions: readonly RecursiveDefinition<ErrorType>[];
  // used to figure out whether the annotation is added for the field,
  // or whether the field is used as a dependency for computed annotation
  isDependencyOfValue: boolean; // TODO: rename as isDependency
  isComputedValue: boolean;
};

export type FieldDependencyValidation<ErrorType> = {
  definition: ValidateDefinition<ErrorType>;
  modelPath: PathToField;
  parentDefinitions: RecursiveDefinition<ErrorType>[];
  // used to figure out whether the validation is added for the field,
  // or whether the field is used as a dependency for other field
  isDependency: boolean;
  // when processing validations, we skip processing any validations
  // that are marked as a passive dependency. we still need to add the
  // validation to the cache entry because getFieldValidationErrors()
  // uses the cache to look up any fields that have validations added,
  isPassive: boolean;
};

export type FieldDependencyCondition<ErrorType> = {
  definition: WhenDefinition<ErrorType>;
  modelPath: PathToField;
  parentDefinitions: RecursiveDefinition<ErrorType>[];
};

export type FieldDependency<ErrorType> =
  | FieldDependencyAnnotation<ErrorType>
  | FieldDependencyValidation<ErrorType>
  | FieldDependencyCondition<ErrorType>;

// TODO: we could optimize getFieldValidationErrors & getFieldResolvedAnnotation a bit
// if we added selfAnnotations & selfValidations for the cases when isDependency = false
export type FieldDependencyEntry<ErrorType> = {
  annotations: FieldDependencyAnnotation<ErrorType>[];
  validations: FieldDependencyValidation<ErrorType>[];
  conditions: FieldDependencyCondition<ErrorType>[];
};

export type FieldDependencyCache<ErrorType> = Record<string, FieldDependencyEntry<ErrorType> | undefined>;

export type ModelDefinition<ModelType, ExternalData = undefined, ErrorType = string> = {
  type: 'model';
  context: ModelContext<any>;
  children: DefinitionList<ErrorType>;
  __model?: ModelType;
  __extData?: ExternalData;
};

export type HasDependenciesInfo = {
  computedValues: boolean;
  conditions: boolean;
  validations: boolean;
};

export type FieldsWithDependencies = Record<
  string,
  {
    hasDependencies: HasDependenciesInfo;
  }
>;

export type Model<ModelType, ExternalData = undefined, ErrorType = string> = {
  modelDefinition: ModelDefinition<ModelType, ExternalData, ErrorType>;
  fieldDependencyCache: FieldDependencyCache<ErrorType>;
  /**
   * Keep track of fields that someone depends on. For arrays we just record the field name with [],
   * because we're not interested if you have a dependency on current, all or specific index, we just
   * care whether the field has any dependencies at all. This allows certain optimizations such as skip
   * processing changed data that nobody is interested in. When we record the dependent data, we'll also
   * record the whole path up to the field that is depended on, because when we compute the changed data,
   * we need to continue recursing in case someone is interested in something deeper in the data.
   */
  fieldsWithDependencies: FieldsWithDependencies;
};

export type SupportedDefinition<ErrorType = string> =
  | ArrayDefinitionInput<ErrorType>
  | WhenDefinitionInput<ErrorType>
  | ValidateDefinitionInput<ErrorType>
  | AnnotateDefinitionInput
  | DefinitionListInput<ErrorType>;

export type DefinitionListInput<ErrorType> = SupportedDefinition<ErrorType>[];

export type FlattenedDefinitionListInput<ErrorType> = Exclude<
  SupportedDefinition<ErrorType>,
  DefinitionListInput<ErrorType>
>[];

export type ProcessedDefinition<ErrorType> =
  | ArrayDefinition<ErrorType>
  | WhenDefinition<ErrorType>
  | ValidateDefinition<ErrorType>
  | AnnotateDefinition;

export type DefinitionList<ErrorType> = ProcessedDefinition<ErrorType>[];

export type ModelDefinitionFn<Context, ErrorType = string> = (field: Context) => SupportedDefinition<ErrorType>;

export type ModelDefinitionFnWithNoArg<ErrorType> = () => SupportedDefinition<ErrorType>;

export type RecursiveDefinition<ErrorType> =
  | ModelDefinition<any, any, ErrorType>
  | ArrayDefinition<ErrorType>
  | WhenDefinition<ErrorType>;

export type DefinitionWithContext<ErrorType> = ModelDefinition<ErrorType> | ArrayDefinition<ErrorType>;

export type NoInfer<T> = [T][T extends any ? 0 : never];

// this is used as a default argument for functions that accept optional defaultValue argument
export const noValue = Symbol();
export type NoValue = typeof noValue;

export type SubscribeToFieldAnnotationFn<Value, DefaultValue> = (value: Value | DefaultValue) => void;

export type AnnotationsSubscriptionValue = Record<string, AnnotationData>;

export type DeduceAnnotationData<Annotations extends Annotation<unknown>[]> = {
  [K in keyof Annotations]: Annotations[K] extends Annotation<infer T> ? T : never;
};

export type SubscribeToAnnotationsFn = (annotations: AnnotationsSubscriptionValue) => void;

export type UnsubscribeFn = () => void;

export type FieldAnnotationSubscription<Value, DefaultValue> = {
  path: string;
  annotation: Annotation<Value>;
  subscribeFn: SubscribeToFieldAnnotationFn<Value, DefaultValue>;
  previousValue: Value | DefaultValue;
  defaultValue: DefaultValue | NoValue;
};

export type AnnotationsSubscriptionFilters = {
  pathPrefix?: string;
  annotations?: Annotation<unknown>[];
};

export type AnnotationsSubscription = {
  filters: AnnotationsSubscriptionFilters;
  subscribeFn: SubscribeToAnnotationsFn;
  previousValue: AnnotationsSubscriptionValue;
};
