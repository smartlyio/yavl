import {
  AnyExtensibleContext,
  ArrayAllFocusFn,
  ArrayFocusFn,
  ContextType,
  SameContextOfType,
  ArrayModelContext,
  ExternalArrayModelContext,
  ModelContext,
  AnyArrayModelContext,
  ExternalModelContext,
  MaybeField,
  MaybeArrayItem,
  FieldFocus,
  ArrayIndexFocus,
  AnyContext,
  ModelContextToArrayModelContext
} from '../types';

type KeysOfUnionWithArrayFocus<T> = T extends Record<string, unknown>
  ? keyof T
  : T extends readonly unknown[]
  ? number | ArrayFocusFn
  : never;

type NextAllowedKeys<Context> = KeysOfUnionWithArrayFocus<ContextType<Context>>;

/**
 * Focus the next field when traversing model. We have two ways of
 * accessing the next field currently:
 * 1. With a concrete field name in an object or numeric index in an array
 * 2. Special array focus accessors, eg. array.all and array.current
 */
type NextField<Type, Key> = Key extends ArrayFocusFn
  ? MaybeArrayItem<Type>
  : MaybeField<Type, Key>;

/**
 * 1. If we focus array.all, then we must turn eg. ModelContext => ArrayModelContext
 * 2. If we have a MappedArrayContext<{ value: ModelContext<number> }> accessing the
 *    'value' with dependency must produce ArrayModelContext<number> to retain the
 *    information that we're dealing with an array.
 * 3. Otherwise we just retain the current context type.
 */
type GetNextContextWithType<Type, Context, Key> = Key extends ArrayAllFocusFn
  ? SameContextOfType<ModelContextToArrayModelContext<Context>, Type>
  : // wrap in tuple to disable distributive conditional types
  [Type] extends [AnyContext<any>]
  ? ModelContextToArrayModelContext<Type>
  : SameContextOfType<Context, Type>;

// NextContext is split into two types to avoid repeating the NextField stuff
type NextContext<Context, Key> = GetNextContextWithType<
  NextField<ContextType<Context>, Key>,
  Context,
  Key
>;

/**
 * Traverse through the model recursively, maintaining the correct context type
 * for each level. The context type can change from one to another in two situations:
 *
 * 1. array.all will change a single model context such as ModelContext into an array
 *    model context of same type, eg. ArrayModelContext.
 * 2. MappedArrayContext can contain any sort of contexts inside it. When accessing
 *    the next field in a mapped context, we use whatever context is specified for the
 *    mapped context.
 */
type TraverseModel<Context, Keys> = Keys extends [...infer Rest, infer Key]
  ? NextContext<TraverseModel<Context, Rest>, Key>
  : Context;

export interface DependencyFn {
  <Context extends AnyExtensibleContext<any>>(field: Context): Context;

  <Context extends AnyExtensibleContext<any>, K1>(
    field: Context,
    k1: K1 & NextAllowedKeys<TraverseModel<Context, []>>
  ): TraverseModel<Context, [K1]>;

  <Context extends AnyExtensibleContext<any>, K1, K2>(
    field: Context,
    k1: K1 & NextAllowedKeys<TraverseModel<Context, []>>,
    k2: K2 & NextAllowedKeys<TraverseModel<Context, [K1]>>
  ): TraverseModel<Context, [K1, K2]>;

  <Context extends AnyExtensibleContext<any>, K1, K2, K3>(
    field: Context,
    k1: K1 & NextAllowedKeys<TraverseModel<Context, []>>,
    k2: K2 & NextAllowedKeys<TraverseModel<Context, [K1]>>,
    k3: K3 & NextAllowedKeys<TraverseModel<Context, [K1, K2]>>
  ): TraverseModel<Context, [K1, K2, K3]>;

  <Context extends AnyExtensibleContext<any>, K1, K2, K3, K4>(
    field: Context,
    k1: K1 & NextAllowedKeys<TraverseModel<Context, []>>,
    k2: K2 & NextAllowedKeys<TraverseModel<Context, [K1]>>,
    k3: K3 & NextAllowedKeys<TraverseModel<Context, [K1, K2]>>,
    k4: K4 & NextAllowedKeys<TraverseModel<Context, [K1, K2, K3]>>
  ): TraverseModel<Context, [K1, K2, K3, K4]>;

  <Context extends AnyExtensibleContext<any>, K1, K2, K3, K4, K5>(
    field: Context,
    k1: K1 & NextAllowedKeys<TraverseModel<Context, []>>,
    k2: K2 & NextAllowedKeys<TraverseModel<Context, [K1]>>,
    k3: K3 & NextAllowedKeys<TraverseModel<Context, [K1, K2]>>,
    k4: K4 & NextAllowedKeys<TraverseModel<Context, [K1, K2, K3]>>,
    k5: K5 & NextAllowedKeys<TraverseModel<Context, [K1, K2, K3, K4]>>
  ): TraverseModel<Context, [K1, K2, K3, K4, K5]>;
}

export type ExtractDependencies<
  Dependencies
> = Dependencies extends AnyArrayModelContext<infer U>
  ? U[]
  : Dependencies extends AnyContext<infer U>
  ? U
  : Dependencies extends Record<string, unknown> | readonly unknown[]
  ? { [K in keyof Dependencies]: ExtractDependencies<Dependencies[K]> }
  : Dependencies;

const dependency: DependencyFn = (
  parentField: AnyExtensibleContext<any>,
  ...path: readonly (string | ArrayFocusFn)[]
): AnyExtensibleContext<any> => {
  const transformedPath = path.map((arrayOrField) =>
    typeof arrayOrField === 'function'
      ? arrayOrField()
      : typeof arrayOrField === 'string'
      ? ({ type: 'field', name: arrayOrField } as FieldFocus)
      : ({
          type: 'array',
          focus: 'index',
          index: arrayOrField,
          multiToSingleFocus: false
        } as ArrayIndexFocus)
  );

  const pathToField = parentField.pathToField.concat(transformedPath);

  const multiFocus = pathToField.some(
    (it) => it.type === 'array' && it.focus === 'all'
  );

  if (multiFocus) {
    const result: ArrayModelContext<any> | ExternalArrayModelContext<any> = {
      type: parentField.type,
      pathToField,
      multiFocus: true
    };

    return result;
  } else {
    const result: ModelContext<any> | ExternalModelContext<any> = {
      type: parentField.type,
      pathToField
    };

    return result;
  }
};

export default dependency;
