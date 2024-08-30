import * as R from 'ramda';
import as, { AsFn } from './builder/as';
import nthFocus, { NthFocusFn } from './builder/nthFocus';
import field, { FieldFn } from './builder/field';
import array, { ArrayFn } from './builder/array';
import validate, { ValidateFn } from './builder/validate';
import validator, { MakeValidatorFn } from './builder/validator';
import dependency, { DependencyFn } from './builder/dependency';
import passiveDependency from './builder/passiveDependency';
import when, { WhenFn } from './builder/when';
import makeWhen, { MakeWhenFn } from './builder/makeWhen';
import makeRequired, { RequiredFn } from './builder/required';
import makeOptional, { OptionalFn } from './builder/optional';
import annotate, { AnnotateFn } from './builder/annotate';
import value, { ValueFn } from './builder/value';
import { sideEffect, SideEffectFn } from './builder/sideEffect';
import decorate, { DecorateFn } from './builder/decorate';
import withFields, { WithFieldsFn } from './builder/withFields';
import dependsOn, { DependsOnFn } from './builder/dependsOn';
import {
  ModelContext,
  ExternalModelContext,
  Model,
  ModelDefinition,
  SupportedDefinition
} from './types';
import processDefinitionList from './processDefinitionList';
import buildFieldDependencyCache from './buildFieldDependencyCache';
import compute, { ComputeBuilderFn } from './builder/compute';
import pick, { PickBuilderFn } from './builder/pick';
import filter, { FilterBuilderFn } from './builder/filter';
import annotation, { AnnotationFn } from './builder/annotation';
import path, { PathFn } from './builder/path';
import index, { IndexFn } from './builder/index';
import log, { LogFn } from './builder/log';
import { getFieldsWithDependencies } from './getFieldsWithDependencies';
import { PassiveFn, passive } from './builder/passive';
import { PreviousBuilderFn, previous } from './builder/previous';

export type ModelBuilder<
  FormData,
  ExternalData = undefined,
  ErrorType = string
> = {
  as: AsFn;
  nthFocus: NthFocusFn;
  field: FieldFn<ErrorType>;
  array: ArrayFn<ErrorType>;
  validate: ValidateFn<FormData, ExternalData, ErrorType>;
  validator: MakeValidatorFn<FormData, ExternalData, ErrorType>;
  dep: DependencyFn;
  dependency: DependencyFn;
  passive: PassiveFn;
  passiveDependency: DependencyFn;
  when: WhenFn<FormData, ExternalData, ErrorType>;
  makeWhen: MakeWhenFn<FormData, ExternalData, ErrorType>;
  required: RequiredFn<ErrorType>;
  optional: OptionalFn<ErrorType>;
  annotate: AnnotateFn;
  value: ValueFn;
  sideEffect: SideEffectFn;
  decorate: DecorateFn;
  withFields: WithFieldsFn<ErrorType>;
  dependsOn: DependsOnFn;
  compute: ComputeBuilderFn;
  pick: PickBuilderFn;
  filter: FilterBuilderFn;
  annotation: AnnotationFn;
  path: PathFn;
  index: IndexFn;
  previous: PreviousBuilderFn;
  externalData: ExternalModelContext<ExternalData>;
  root: ModelContext<FormData>;
  log: LogFn<ErrorType>;
};

export type MakeModelFn<FormData, ExternalData, ErrorType> = (
  root: ModelContext<FormData>,
  model: ModelBuilder<FormData, ExternalData, ErrorType>
) => SupportedDefinition<ErrorType>;

export type ModelOptions = {
  testRequiredFn: (value: any) => boolean;
};

export const defaultTestRequiredFn = (value: any) =>
  !R.isNil(value) && !R.isEmpty(value);

export interface ModelFn {
  <FormData, ExternalData = undefined, ErrorType = string>(
    makeModel: MakeModelFn<FormData, ExternalData, ErrorType>
  ): Model<FormData, ExternalData, ErrorType>;

  <FormData, ExternalData = undefined, ErrorType = string>(
    opts: ModelOptions,
    makeModel: MakeModelFn<FormData, ExternalData, ErrorType>
  ): Model<FormData, ExternalData, ErrorType>;
}

const model: ModelFn = (
  optsOrMakeModel: ModelOptions | MakeModelFn<any, any, any>,
  maybeMakeModel?: MakeModelFn<any, any, any>
): Model<any, any> => {
  const opts =
    typeof optsOrMakeModel === 'object'
      ? optsOrMakeModel
      : {
          testRequiredFn: defaultTestRequiredFn
        };

  const makeModel =
    typeof optsOrMakeModel === 'function' ? optsOrMakeModel : maybeMakeModel!;

  const root: ModelContext<any> = { type: 'internal', pathToField: [] };
  const externalData: ExternalModelContext<any> = {
    type: 'external',
    pathToField: []
  };

  const required = makeRequired(opts.testRequiredFn);
  const optional = makeOptional(opts.testRequiredFn);

  const definitions = makeModel(root, {
    as,
    nthFocus,
    field,
    array,
    validate,
    validator,
    dep: dependency,
    dependency,
    passive,
    // TODO: deprecate passiveDependency
    passiveDependency,
    when,
    makeWhen,
    required,
    optional,
    annotate,
    value,
    sideEffect,
    decorate,
    withFields,
    dependsOn,
    compute,
    pick,
    filter,
    annotation,
    path,
    index,
    previous,
    externalData,
    root,
    log
  });

  const processedDefinitions = processDefinitionList([root], [definitions]);

  const modelDefinition: ModelDefinition<any, any> = {
    type: 'model',
    context: root,
    children: processedDefinitions
  };

  const fieldDependencyCache = buildFieldDependencyCache(modelDefinition);
  const fieldsWithDependencies = getFieldsWithDependencies(
    fieldDependencyCache
  );

  return {
    modelDefinition,
    fieldDependencyCache,
    fieldsWithDependencies
  };
};

export default model;
