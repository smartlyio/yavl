import {
  ValidateDefinition,
  WhenDefinition,
  RecursiveDefinition,
  AnnotationData,
  Model,
  FieldDependencyCache,
  Annotation,
  FieldAnnotationSubscription,
  AnnotateDefinition,
  FieldDependencyEntry,
  AnnotationsSubscription,
  ComputedContext,
} from '../types';

export type FieldErrorTuple<ErrorType> = [string, ErrorType];

/**
 * Keys are field names eg. "list[0].field.name"
 */
export type ProcessedComputations = Map<ComputedContext<any>, unknown>;
export type MutatingFieldProcessingCacheEntry<ErrorType> = {
  ranValidations: Map<ValidateDefinition<ErrorType>, boolean>;
  conditionTestFnResults: Map<WhenDefinition<ErrorType>, boolean>;
  processedConditionDefinitions: Map<WhenDefinition<ErrorType>, boolean>;
  processedAnnotationDefinitions: Map<AnnotateDefinition, 'processing' | 'processed'>;
  processedComputations: ProcessedComputations;
};

export type MutatingFieldProcessingCache<ErrorType> = Record<string, MutatingFieldProcessingCacheEntry<ErrorType>>;

export type CompareFn = (a: any, b: any) => boolean;

// Map<PathToField, Map<AnnotateDefinition, AnnotationData>>
export type ModelValidationAnnotationCache = Map<string, Map<AnnotateDefinition, AnnotationData>>;

export type ValidateDefinitionErrors<ErrorType> = Map<
  ValidateDefinition<ErrorType>,
  { field: string; errors: ErrorType[] }
>;

export type MutatingErrorCacheKey<ErrorType> = RecursiveDefinition<ErrorType> | number;

export type ModelValidationCache<ErrorType> = {
  isPathActive: boolean;
  annotations: ModelValidationAnnotationCache;
  errors: ValidateDefinitionErrors<ErrorType>;
  children: Map<MutatingErrorCacheKey<ErrorType>, ModelValidationCache<ErrorType>>;
};

// { [field]: { [annotation]: Set<subscriptions> }}
export type FieldAnnotationSubscriptions = Map<
  string,
  Map<Annotation<any>, Set<FieldAnnotationSubscription<any, any>>>
>;

export type AnnotationsSubscriptions = Set<AnnotationsSubscription>;

// the Map keys are paths, and the values are set of changed annotations
// we use Map & Set here so we don't store duplicate entries to make processing faster
export type ChangedAnnotationsCache = Map<string, Set<Annotation<any>>>;

export type ResolvedValidations<ErrorType> = {
  current: Record<string, ErrorType[]>;
};

export type ResolvedAnnotations = {
  current: Record<string, AnnotationData>;
};

export type ModelValidationContext<Data, ExternalData = undefined, ErrorType = string> = {
  model: Model<Data, ExternalData, ErrorType>;
  previousData: Data | undefined;
  previousExternalData: ExternalData | undefined;
  cache: ModelValidationCache<ErrorType>;
  resolvedAnnotations: ResolvedAnnotations;
  resolvedValidations: ResolvedValidations<ErrorType>;
  subscriptions: {
    fieldAnnotation: FieldAnnotationSubscriptions;
    annotations: AnnotationsSubscriptions;
  };
  pendingChangedAnnotations: ChangedAnnotationsCache;
  transactionCounter: number;
};

export type ModelValidationErrors<ErrorType = string> = Record<string, ErrorType[]> | undefined;

export type CurrentIndices = Record<string, number>;

// the keys are path to condition definition
export type UnprocessedValidationsForCondition = {
  pathToCondition: RecursiveDefinition<any>[];
  indices: CurrentIndices;
};

export type AnnotationBeingResolved = {
  field: string;
  annotation: Annotation<any>;
};

export type ProcessingContext<Data, ExternalData, ErrorType> = {
  isInitialValidation: boolean;
  // the latest data & externalData to process model for
  data: Data;
  externalData: ExternalData;
  // the previous data at start of updateModel
  previousDataAtStartOfUpdate: Data | undefined;
  previousExternalDataAtStartOfUpdate: ExternalData | undefined;
  // the initial data at start of pass
  dataAtStartOfPass: Data;
  // persistent caches stored in the ModelValidationContext, mutating these will mutate the ModelValidationContext directly
  validateDiffCache: ModelValidationCache<ErrorType>;
  resolvedAnnotations: ResolvedAnnotations;
  resolvedValidations: ResolvedValidations<ErrorType>;
  annotationBeingResolved: AnnotationBeingResolved | undefined;
  // persistent static cache created when model is built
  fieldDependencyCache: FieldDependencyCache<ErrorType>;
  // a temporary cache for single process step for optimization purposes
  fieldProcessingCache: MutatingFieldProcessingCache<ErrorType>;
  // a temporary cache to keep track of changed annotations so we can notify subscribers
  changedAnnotationsCache: ChangedAnnotationsCache;
  // pending validations that we have to run
  unprocessedValidationsForConditons: UnprocessedValidationsForCondition[];
  // compare function to when calculating diffs
  isEqualFn: CompareFn;
};

export type ChangedAnnotationsDependency = {
  field: string;
  annotation: Annotation<any>;
  dependencies: FieldDependencyEntry<any>[];
};

export type NewDefinition<ErrorType> = {
  pathToDefinition: RecursiveDefinition<ErrorType>[];
  indices: Record<string, number>;
};
