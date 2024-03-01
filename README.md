# Yet Another Validation Library (YAVL)

YAVL is a declarative and type-safe model & validation library.

## Table of Contents

- [Features](#features)
- [What it looks like](#what-it-looks-like)
- [Purpose / Scoping of the library](#purpose--scoping-of-the-library)
- [Building the model](#building-the-model)
  - [Types](#types)
    - [ModelBuilder](#modelbuilder)
    - [ModelContext&lt;T&gt;](#modelcontextt)
    - [Definitions](#definitions)
  - [Create New Model](#create-new-model)
    - [model](#model)
  - [Builder Object Reference](#builder-object-reference)
    - [annotate](#annotate)
    - [array](#array)
    - [as](#as)
    - [defaultValue](#defaultvalue)
    - [dependency](#dependency)
    - [dependsOn](#dependson)
    - [externalData](#externaldata)
    - [field](#field)
    - [optional](#optional)
    - [passiveDependency](#passivedependency)
    - [required](#required)
    - [validate](#validate)
    - [validator](#validator)
    - [when](#when)
    - [withFields](#withfields)
- [Validating Data](#validating-data)
  - [Reference](#reference)
    - [createValidationContext](#createvalidationcontext)
    - [validateModel](#validatemodel)
    - [useIncrementalValidation](#useincrementalvalidation)
- [Creating data](#creating-data)
  - [Circular default values](#circular-default-values)
  - [Reference](#reference-1)
    - [withDefaultValues](#withdefaultvalues)
    - [createWithDefaultValues](#createwithdefaultvalues)
- [Annotations](#annotations)
  - [Types](#types-1)
  - [Reference](#reference-2)
    - [createAnnotation](#createAnnotation)
    - [getAllAnnotations](#getallannotations)
    - [getFieldsWithAnnotations](#getfieldswithannotations)
    - [getFieldAnnotations](#getfieldannotations)
    - [getFieldAnnotation](#getfieldannotation)
    - [getDefaultValue](#getdefaultvalue)
- [Development](#development)
  - [Technical overview](#technical-overview)
- [Planned features](#planned-features)

## Features

- Declarative validations
  - Define the fields your validation depends on
  - Ensures validations are ran when dependencies changes
- Conditional validations
  - Don’t run validations for optional fields
  - Run different set of validations based on criteria
- Support for array fields
  - Depend on data from current array element
  - Depend on data from sibling elements
- Strong type-safety with TypeScript support
  - Build models based on existing types
  - Works with complex types
- Incremental validation
  - Only run validations for changed data
  - High performance
- Form-agnostic
  - Can also be used in backend
- Create complex data structures with default values
  - Resolve conditional default values with ease
  - Catches and reports cyclical default values
- Powerful annotation system
  - Add metadata to your data
  - Introspection API to query the annotations

## What it looks like

This is a very basic example that shows how the model definitions works, more advanced topics are covered in the documentation.

```ts
type User = {
  disabled: boolean;
  name: string | undefined;
  password: string;
  passwordAgain: string;
};

type MyForm = {
  users: User[];
};

const isValidPassword = (password: string) => {
  if (password.length < 8 || password.length > 32) {
    return 'Password must be between 8 and 32 characters';
  }
  if (
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    return 'Password must contain at least one lower-case letter, one upper-case letter and one number';
  }
  // no errors
  return undefined;
};

const myModel = model<MyForm>(
  (
    form,
    { field, withFields, array, validate, when, optional, defaultValue }
  ) => [
    field(form, 'users', (users) => [
      array(users, (user) => [
        withFields(
          user,
          ['disabled', 'name', 'password', 'passwordAgain'],
          (disabled, name, password, passwordAgain) => [
            defaultValue(name, 'John Doe'),

            // only validate user when user is enabled
            when(
              disabled,
              (disabled) => !disabled,
              () => [
                // name is string | undefined here
                optional(name, (name) => [
                  // optional removes undefined from the type; always string here
                  validate(
                    name,
                    (name) => name.length >= 5,
                    'Name must be at least 5 characters'
                  )
                ]),

                validate(password, isValidPassword),
                validate(
                  passwordAgain,
                  password,
                  (pw1, pw2) => pw1 !== pw2,
                  'Passwords do not match'
                )
              ]
            )
          ]
        )
      ])
    ])
  ]
);

const errors = validateModel(myModel, {
  users: [
    {
      name: 'John',
      password: 'Example123',
      passwordAgain: 'invalid'
    }
  ]
});

/**
 * Returns:
 * {
 *   'users[0].name': ['Name must be at least 5 characters'],
 *   'users[0].passwordAgain': ['Passwords do not match'],
 * }
 */
```

## Purpose / Scoping of the library

The purpose of YAVL is first and foremost to provide a way to declare dependencies in complex data structures, and a way to run validations based on changes in data. And to do all this in a type-safe manner.

Anyone who has used tools such as JSON schema or any validation library that invents its own DSL to define constraints on data know how difficult it can be to keep your validations up-to-date with the structure of your data.

When YAVL was designed, one of the main things we wanted to get right was to make sure that we’ll get compile-time errors for our validations if our data is refactored to have eg. different shape and the model and validations were not updated to reflect those changes.

So YAVL is not yet another way of defining your data constraints with some new syntax, nor a collection of validators that provides you functions to validate things like emails or URLs.

YAVL embraces functional programming principles, which means that validators, among other things, are just plain functions that are called when needed. Since we’re not inventing any new, whacky syntax to describe your validations, any library that provides you with validation functions such as `function isEmail(email: string): boolean` can be used in conjunction with YAVL. Or you can simply write your own validators.

YAVL aims to be general-purpose and library/framework agnostic, which means that it’ll leave some things up to the user to implement. For example, it provides you a function to validate your data, but it’s up to you to call that function in the correct place with the correct data. Similarly the validate function returns you error information, but it’s up to you to display those errors in a sensible way.

While the original purpose of YAVL was to simply react to changes in data and running the minimal set of required validations in a type-safe manner, some additional features are also implemented because they felt very natural fit. For example creating new data based on default values defined within the model definition.

## Building the model

### Types

You see some of these types used throughout the documentation. Here’s what they mean:

##### `ModelBuilder`

Model builder object. This object contains a set of functions as properties used to build your model, eg. `field`, `validate`, `when`, etc.

##### `ModelContext<T>`

Model context is a wrapper type for your model fields. For example if you have a `name: string` in your model data, the model context for that field would be `ModelContext<string>`. Model contexts are used to eg. dive deeper into the model while defining the model as well as to define dependencies for validations. There are actually multiple different model contexts (internal, external, array, etc), but in this documentation they’re all referred with the `ModelContext` type.

##### `Definitions`

Model builder functions such as `field` or `when` return a **model definition**. When you see a callback that needs to return `Definitions`, it means that it needs to return one or more such model definitions.

### Create New Model

#### `model`

Creates a new model.

##### Signature

- `model<Data, ExternalData = undefined, ErrorType = string>(makeModelFn)`
  - Use default options. See below.
- `model<Data, ExternalData = undefined, ErrorType = string>(options, makeModelFn)`
  - Specify options for model. See below.

##### Type parameters

- **Data** - Type of your model data, eg. the type of your form data.
- **ExternalData** - The type of your external data. External data is data that is not part of your model data, but what you need in eg. your validations. For example available options for a dropdown select. Defaults to `undefined`.
- **ErrorType** - The type of your errors. Your validators will return whatever type you define here. Note that YAVL always maintains an array of errors for each field, so even if the ErrorType is `string`, your validators can return an array of strings. Defaults to `string`.

##### Parameters

- **opts** - Optional options for the model. Details below.
- **makeModelFn** - A callback that is called immediately to build the model. The signature of the callback is: `(rootContext: ModelContext<Data>, modelBuilder: ModelBuilder) => Definitions`. The `rootContext` is the context reference to the root of your data. You can use this to dive deeper to the model with eg. `field` and `array` functions. The `modelBuilder` object contains all the functions you need to define your model.

##### Returns

- The built model.

**Options**

- **testRequiredFn** - A function of signature `(value: any) => boolean`, which is used to determine whether a value is present when `required` and `optional` model builder functions are used. If omitted, the default behaviour is that a value is considered missing when it’s either a nil value such as `undefined` or `null`, or an empty value such as `''`, `[]` or `{}`.

### Builder Object Reference

Since most of the builder functions returns one or more model definitions, the return types are not explicitly listed for each function, only for ones that do not return model definitions. The definitions should be returned by the **makeModelFn** of `model`, as well as definition callbacks that the builder functions accepts.

#### `annotate`

Annotates field with metadata,

##### Signature

- `annotate(context, annotation, value)`

##### Parameters

- **context** - The field to add annotation(s) for.
- **annotation** - The annotation to add. Must be created with [`createAnnotation`](#createAnnotation).
- **value** - The value for the annotation.

The annotations can be any metadata. Some common examples would be **isRequired** metadata to indicate whether a field is required or not, or **isDisabled** metadata to indicate whether a field is disabled.

YAVL provides an API to query model annotations. For example you can find all fields that are required, or get all annotations for a specific field.

Annotations can be defined inside `when` branches. This allows conditional annotations. For example you can mark a **zipCode** field as required, but only when **country** equals to `"US"`.

**NOTE.** Some of the other model builder functions use annotations internally. For instance `required` adds a **isRequired** annotation and `defaultValue` adds a **defaultValue** annotation.

#### `array`

Get a context handle for array items.

##### Signature

- `array(context, definitionsFn)`

##### Parameters

- **context** - The array you want to dive into.
- **definitionsFn** - A callback of type `(item: ModelContext<T>) => Definitions`. The callback receives a context to the array item as an argument, and should return definitions for the item. The definitions are applied for all items in the array.

If you have arrays in your model data, the `array` builder allows you to get a handle to the items inside that array, eg. dive into the array.

Consider the following:

```ts
type Form = {
  todos: Todo[];
};

const myModel = model<Form>((root, model) => [
  model.field(root, 'todos', (todos) => [
    // todos is ModelContext<Todo[]>
    model.array(todos, (todo) => [
      // todo is ModelContext<Todo>
    ])
  ])
]);
```

If you were to add a validation for the `todos`, it’d add a validation for the whole array. So the validator function would get the whole `Todo[]` array as its input.

Instead, if you were to add a validation for the `todo`, it’d add a validation for the items in the array, and the validator function would get the `Todo` as its input.

Often you don’t want to simply add a validations for your array items directly, but your items are objects and you want to add your validations for the fields within the object. Using `array` allows you to do that. If your Todo type was this for example:

```ts
type Todo = {
  title: string;
  done: boolean;
};
```

Doing `model.field(todos, 'title', (title) => ...)` would not work, because `'title'` does not exist in `Todo[]`.

Instead you must first get a handle to the item of the array with `model.array(todos, (todo) => ...)`, and dive to the title using: `model.field(todo, 'title', (title) => ...)`. Now you can add a validation to the title by providing `title` to the validate function.

#### `as`

A utility function to cast a `ModelContext<T>` to another model context of type `ModelContext<Type>`.

##### Signature

- `as<Type>(context)`

##### Type parameters

- **Type** - The type of model context to cast to.

##### Parameters

- **context** - A context to be cast to another type.

Doing `as<Type>(context)` is basically identical to using TypeScript `as` operator: `context as ModelContext<Type>` but without having to use the internal types of YAVL.

**NOTE.** The as function should not be needed in majority of cases, and if you end up using it, you should ask yourself Is there a better way to achieve what you’re doing.

#### `defaultValue`

Adds a default value for the field.

##### Signature

- `defaultValue(context, defaultValue)`

##### Parameters

- **context** - The field to add default value for.
- **defaultValue** - The default value to add.

The default value is added as a **defaultValue** annotation. Default values are used by the `createWithDefaultValues` API, and can also be queried via the query annotations API.

#### `dependency`

Defines a dependency to a field, eg. `dependency(form, 'username')`.

##### Signature

- `dependency(context, ...path)`

##### Parameters

- **context** - The parent field from which to start looking up a child field.
- **…path** - One or more arguments that define a path to field from the parent context. Details later.

##### Returns

- `ModelContext<T>` - A model context to the child field. This can be used as a dependency to `validate` or `when` functions.

When defining dependencies to arrays, you can either use an index to an item, eg. `dependency(list, 0)` or use the following special _array focus_ keywords from the `array` model builder:

- `dependency(list, array.all)` - Focuses all items of an array. When any items in the array changes, will re-run the dependent validations.
- `dependency(list, array.current)` - Focuses the current item of an array. Only re-runs validations when the current item in the list changes.

The array focus keyword doesn’t have to be at the end of the dependency path. For example `dependency(list, array.all, 'title')` would focus all _title_ fields from _list_, meaning that the validations will re-run only when any of the titles change within the array, but not when some other field within the array change.

**NOTE.** If the parent `context` is inside an array, it’ll focus current item from the array. For example:

```ts
model.field(form, 'users', (users) => [
  model.array(users, (user) => [
    model.withFields(
      user,
      ['password', 'passwordAgain'],
      (password, passwordAgain) => [
        model.validate(
          passwordAgain,
          model.dependency(password),
          (pw1, pw2) => pw1 === pw2,
          'Passwords do not match'
        )
      ]
    )
  ])
]);
```

The `model.dependency(password)` is identical to doing `model.dependency(form, 'users', array.current, 'password')`. What this means is that when a `password` field is modified in a form for a user, the validator for the `passwordAgain` is only run for that one user, not for every user.

#### `dependsOn`

Define a dependency to data with only some child field(s) triggering validation re-run.

##### Signature

- `dependsOn(context, dependencies)`

##### Parameters

- **context** - The field to pass to validator.
- **dependencies** - A list of child field(s) that should trigger a validation. Can either be strings for direct child fields, or `ModelContext`s for arbitrarily nested child fields, defined with `dependency`.

##### Returns

- `ModelContext<T>` that matches the type of the passed **context**.

Sometimes you need to call a function that takes as an argument a “whole object”, although that function only uses parts of that object. This is often the case when you’re interoperating with some existing code in your validators.

For simplicity’s case, let’s say you have some function such as `doPasswordsMatch` that as an input takes an `User` type, and then checks whether the fields `password` and `passwordAgain` match in that type. You could simply do something like:

```ts
validate(user, doPasswordsMatch, 'Passwords do not match');
```

However that would run the validation whenever anything in the `user` changes, not just the password fields. Instead you can do:

```ts
validate(
  dependsOn(user, ['passsword', 'passwordAgain'],
  doPassswordsMatch,
  'Passwords do not match'
)
```

**NOTE.** This is not optimal way of writing validators. If the implementation of `doPassswordsMatch ` changes to use some other field from the user object, the validator would not give a type error, the behaviour would just be undesired. When possible, you should write your validators so that they only take the data they need as parameters, so if the inputs change, your model definition will give you an error.

#### `externalData`

A context to the root of external data.

You can use the `externalData` context to refer to external data of your model. External data can contain anything, but some use cases are:

- Available options for dropdown selects, especially when the options are fetched dynamically over API.
- Options that can be used to format errors, such as user's language, locale or currency.
- Base URL for asynchronous validations that make requests.
  - Asynchronous validations not yet supported by YAVL.
- Dynamic default values for fields fetched over API.
  - Dynamic annotations not yet supported though.

`externalData` can be used with builder functions such as `dependency`, `passiveDependency` and `dependsOn` that define dependencies. It can't be used with `field`, `array` or `withFields` that are used to dive deeper into the model.

Examples:

```ts
// Options for <Select> fetched from API
validate(
  carModel,
  { validCarModels: dependency(externalData, 'carModels') },
  (carModel, { validCarModels }) => validCarModels.includes(carModel),
  'Invalid car model'
);

// Use a localized error message
validate(
  email,
  { lang: dependency(externalData, 'lang') },
  isValidEmail,
  (_, { lang }) => translations[lang].invalidEmail
);

// Use user's currency as part of error message
validate(
  amount,
  { currency: dependency(externalData, 'currency') },
  (amount) => amount >= 10,
  (_, { currency }) => `Minimum amount is 10 ${currency}`
);
```

**NOTE.** Changes to external data also trigger validations to be re-run. This means that for example if the data for _carModels_ changed, the validation to check whether a car model is valid would be re-run even if the car model selection in the form did not change.

#### `field`

Get a context handle for a child field in an object.

##### Signature

- `field(context, name, definitionsFn)`

##### Parameters

- **context** - The parent field.
- **name** - The name of the field to dive into.
- **definitionsFn** - A callback of type `(item: ModelContext<T>) => Definitions`. The callback receives a context to the child field as an argument, and should return definitions for the field.

`field` allows you to dive into an object. For example:

```ts
field(form, 'title', (title) => [
  // title is ModelContext<string>
  validate(title, minLength(10), 'Title must be at least 10 characters long')
]);
```

You can nest calls to `field` to dive deeper to the model for more complex model data structures.

#### `optional`

Apply optional definitions for field.

##### Signature

- `optional(context, definitionsFn)`

##### Parameters

- **context** - The optional field.
- **definitionsFn** - Definitions to apply when the field is defined. Receives a narrowed field context as a type, with `undefined` removed from the context type.

If the field is defined, then the definitions returned by the `definitionsFn` are applied, otherwise they’re omitted. Whether the data is defined or not is determined by the **testRequiredFn** function that can be passed as an option to the `model` function.

An example that also demonstrates the type-narrowing:

```ts
const strLessThan10 = (val: string) => val.length < 10;

model.field(form, 'field', (field) => [
  // field is ModelContext<string | undefined>
  // "string | undefined" is not assignable to "string" that strLessThan10 takes
  validate(field, strLessThan10, 'Field has to be less than 10 characters'),

  optional(field, (definedField) => [
    // this validator is only ran when field is defined
    // definedField is ModelContext<string>, now the types align
    validate(
      definedField,
      strLessThan10,
      'Field has to be less than 10 characters'
    )
  ])
]);
```

This helps with typings, since your validators inside the optional field don’t need to use non-null assertions or add type-guards to remove the `undefined` from the types.

#### `passiveDependency`

Defines a passive dependency , eg. `passiveDependency(form, ‘username’)`

##### Signature

- `passiveDependency(context, ...path)`

##### Parameters

- **context** - The parent field from which to start looking up a child field.
- **…path** - One or more arguments that define a path to field from the parent context. Details later.

##### Returns

- `ModelContext<T>` - A model context to the child field. This can be used as a dependency to `validate` or `when` functions.

This function works exactly like `dependency`. The only difference is that it defines a passive dependency to the field. A passive dependency means that it’ll include the value referred by the dependency in the data passed to the validator, but it’ll not cause the validator to re-run when that data changes.

#### `required`

Define field as required.

##### Signature

- `required(context, error, definitionsFn?)`

##### Parameters

- **context** - The field to make required.
- **error** - The error to add for the field when it’s not defined.
- **definitionsFn** - Optional definitions to apply when the field is required. Receives a narrowed field context as a type, with `undefined` removed from the context type.

Whether the data is defined or not is determined by the **testRequiredFn** function that can be passed as an option to the `model` function.

`required` adds a **isRequired** annotation for the field. This annotation can be queried by the query annotations API, for example to show an indicator in UI that the field is required.

The `definitionsFn` is called with a narrowed context type, with `undefined` removed from the type. For example:

```ts
const strLessThan10 = (val: string) => val.length < 10

model.field(form, 'field', (field) => [
  // field is ModelContext<string | undefined>
  // "string | undefined" is not assignable to "string" that strLessThan10 takes
  validate(field, strLessThan10, 'Field has to be less than 10 characters'),

  required(field, 'Field is required', (definedField) => [
    // this validator is only ran when field is defined
    // definedField is ModelContext<string>, now the types align
    validate(definedField, strLessThan10, 'Field has to be less than 10 characters')
  ])

  // required can also be used without the callback
  required(field, 'Field is required')
])
```

This helps with typings, since your validators inside the optional field don’t need to use non-null assertions or add type-guards to remove the `undefined` from the types.

#### `validate`

Validates data.

##### Signature

- `validate(context, dependencies?, validatorFn)`
  - `validatorFn` can handle one or more validations with a single validator.
- `validate(context, dependencies?, testFn, error)`
- `validate(context, dependencies?, testFn, error[])`
- `validate(context, dependencies?, testFn, errorFn)`
  - These overloads do a single validation and de-couple the error message from the validator.

##### Parameters

- **context** - The field to validate.
- **dependencies** Optional dependencies for the validator. The _dependencies_ can be a single `ModelContext<T>` dependency or any shape of data with any number of dependencies inside the data. When validating the field, all the dependencies within the data will be resolved to their current values.
- **validatorFn** - A function with one of the signatures:
  - When dependencies are omitted:
    - `(value, data, externalData) => ErrorType | ErrorType[] | undefined`
  - When dependencies are defined:
    - `(value, dependencies, data, externalData) => ErrorType | ErrorType[] | undefined`
- **testFn** - A function with one of the signatures:
  - When dependencies are omitted:
    - `(value, data, externalData) => boolean`
  - When dependencies are defined:
    - `(value, dependencies, data, externalData) => boolean`
- **error** - An error or list of errors to add for the field when the **testFn** returns `false`.
- **errorFn** - A function that takes the same arguments as the **testFn** and returns an error, or a list of errors. Useful to create error messages that for example include the failed value as part of the message.

**NOTE.** While the validator receives the full model data and external data as arguments, you should generally not use them. If you use them instead of explicitly declaring your dependencies, your validations will not re-run when the data changes. They’re provided for convenience because sometimes they can be useful, for example when you’re debugging your validators and want to log current model/external data.

Examples of using combination of testFn and error:

```ts
validate(age, (age) => age >= 18, 'Min age is 18'),
  validate(age, (age) => age <= 60, 'Max age is 60');
```

You can also validate both cases with a single validator:

```ts
validate(age, (age) => {
  if (age < 18) {
    return 'Min age is 18';
  }
  if (iage > 60) {
    return 'Max age is 60';
  }
  return undefined;
});
```

If you want to use a value in the error message:

```ts
validate(
  age,
  (age) => age >= 18 && age <= 60,
  (age) => `${value} is not between 18 and 60`
);
```

Using dependencies:

```ts
// single dependency, eg. validating whether a password confirm field matches password
withFields(form, ['password', 'passwordAgain'], (password, passwordAgain) => [
  validate(
    password,
    passwordAgain,
    (pw1, pw2) => pw1 === pw2,
    'Passwords do not match'
  )
]);

// multiple dependencies, eg. validating a value where min/max values come from external data
validate(
  value,
  {
    min: dependency(externalData, 'min'),
    max: dependency(externalData, 'max')
  },
  (value, { min, max }) => value >= min && value <= max,
  (value, { min, max }) =>
    `Value ${value} has to be in range of ${min} - ${max}`
);

// dependencies can also be an array
validate(
  value,
  [dependency(externalData, 'min'), dependency(externalData, 'max')],
  (value, [min, max]) => value >= min && value <= max,
  (value, [min, max]) => `Value ${value} has to be in range of ${min} - ${max}`
);
```

#### `validator`

Creates a validator function that returns undefined in case of no errors, or an array of error(s).

##### Signature

- `validator(testFn, error)`
- `validator(testFn, error[])`
- `validator(testFn, errorFn)`

##### Parameters

- **testFn** - A test function that takes the data to test and optionally dependencies as arguments, and returns boolean true if data is valid, otherwise false.
- **error** - Returns a single error if testFn fails.
- **error[]** - Returns a list of errors if testFn fails.
- **errorFn** - A callback that is called with same arguments as `testFn`. Returns one or more errors.

`validate` uses this function internally when used with the `testFn` overload.

```ts
// these two are identical:
validate(age, age >= 18, 'Min age is 18');
validate(age, validator(age >= 18, 'Min age is 18'));
```

The `validator` is mostly useful when you use the same **testFn** and error messages in multiple validations and want don’t want to duplicate the error messages. Otherwise you should just use the `validate` overload directly.

#### `when`

Tests if a condition is true, and applies model definitions conditionally based on the result.

##### Signature

- `when(data, testFn, ifDefinitionFn, elseDefinitionFn?)`
  - Applies `ifDefinitionsFn` and optionally `elseDefinitionsFn` based on result of `testFn`.
- `when(data, testFn)`
  - Returns a curried function of signature `(ifDefinitionFn, elseDefinitionFn?)` which can be used to apply definitions based on the `testFn` one or more times.

##### Parameters

- **data** - The _data_ can be a single `ModelContext<T>` dependency or any shape of data with any number of dependencies inside the data. When evaluating the condition, the dependencies within the data are resolved to their current values and passed to the test function.
- **testFn** - The test function with one of the following signatures:
  - `(data, modelData, externalData) => boolean`
  - `(data, modelData, externalData) => data is Type`
    - This type predicate overload is only supported if _data_ is a `ModelContext<T>`.
    - Used to narrow the context type for the **ifDefinitionFn** and **elseDefinitionFn**.
- **ifDefinitionFn** - The definitions to apply for data when the condition is true.
- **elseDefinitionFn** - The definitions to apply for data when the condition is false.

Using `when` allows you to apply conditional definitions. For example only validate zip code field if the selected country is US, and so on.

**NOTE.** While the test function receives the full model data and external data as arguments, you should generally not use them. If you use them instead of explicitly declaring your dependencies, your conditions will not re-run when the data changes. They’re provided for convenience because sometimes they can be useful, for example when you’re debugging your conditions and want to log your current model/external data.

Simple example:

```ts
withFields(form, ['country', 'zipCode'], (country, zipCode) => [
  when(
    country,
    (country) => country === 'US',
    () => required(zipCode, 'Zip code is required for US')
  )
]);
```

Using multiple dependencies:

```ts
withFields(
  form,
  ['country', 'zipCode', 'isTourist'],
  (country, zipCode, isCitizen) => [
    when(
      [country, isCitizen], // data can also be an object
      ([country, isCitizen]) => country === 'US' && isCitizen,
      () => required(zipCode, 'Zip code is required for US citizens')
    )
  ]
);
```

Example of using a type-predicate to narrow the type.

```ts
field(form, 'user', (user) => [
  // user is ModelContext<NewUser | ExistingUser>
  when(
    user,
    (user): user is NewUser => user.id === undefined,
    (newUser) => [
      // newUser is ModelContext<NewUser>
    ],
    (existingUser) => [
      // existingUser is ModelContext<ExistingUser>
    ]
  )
]);
```

Example of using the currying:

```ts
const whenUserIsNew = when(
  user,
  (user): user is NewUser => user.id === undefined
);

// usage:
whenUserIsNew(
  (newUser) => [
    // ...
  ],
  (existingUser) => [
    // ...
  ]
);
```

#### `withFields`

Get a context handle to multiple child fields.

##### Signature

- `withFields(context, fields, definitionsFn)`

##### Parameters

- **context** - Parent field.
- **fields** - An array of fields to get context handle for.
- **definitionsFn** - A model definition callback. The contexts for the fields are passed as arguments.

It is quite common to want to add multiple validations for different fields in same level, and those field might also depend on each other in different ways. You can achieve that by doing a combination off `field()` and `dependency()` calls, but using `withFields` often makes it easier to read and repeats duplication with `dependency()` calls.

Example:

```ts
withFields(form, ['password', 'passwordAgain'], (password, passwordAgain) => [
  validate(password, isValidPasword, 'Invalid password'),
  validate(
    passwordAgain,
    password,
    (pw1, pw2) => pw1 === pw2,
    'Passwords do not match'
  )
]);
```

It can simplify your definitions, if you compare to what you need without `withFields`:

```ts
field(form, 'password', (password) => [
  validate(password, isValidPasword, 'Invalid password')
]),
  field(form, 'passwordAgain', (passwordAgain) => [
    validate(
      passwordAgain,
      dependency(form, 'password'),
      (pw1, pw2) => pw1 === pw2,
      'Passwords do not match'
    )
  ]);
```

It also provides you a nice way of grouping related validations together.

## Validating Data

YAVL uses incremental validation to validate data efficiently, meaning that only the changed data is validated. Both model data and external data changes are evaluated and validations that depend on the changed data are run. Conditions defined with `when` are also only evaluated when their dependencies changes. Conditions are evaluated before validations are run, ensuring that validations will never be run when they shouldn’t be.

### Reference

#### `createValidationContext`

Creates a validation context, used for incremental validation.

##### Signature

- `createValidationContext(model, initialExternalData?)`

##### Parameters

- **model** - The model created with `model` function.
- **initialExternalData** - Optional initial external data for your model. This is needed if you’re using the `createWithDefaultValues` API and your default values depend on external data.

##### Returns

- A validation context that can be passed to `validateModel` . The returned validation context is **MUTABLE**. This is for performance reasons and because one should not generally be interested in previous state of the validation context.

#### `validateModel`

Validates model data.

##### Signature

- `validateModel(model, data, externalData?, isEqualFn?)`
  - Validates the whole data.
  - Only use this if you don’t care about efficiency.
- `validateModel(validationContext, data, externalData?, isEqualFn?)`
  - Validates only changed data.
  - Use this when validating eg. forms to keep UI responsive and smooth.

##### Parameters

- **model** - The model created with `model`.
- **validationContext** - The incremental validation context created with `createValidationContext`.
- **data** - The data to validate.
- **externalData** - External data used by the model, if specified.
- **isEqualFn** - Equality comparison function used by the diffing algorithm to determine which parts of **data** and **externalData** have changed. By default uses `Object.is` for fast diffing, which assumes your data is immutable. If you’re dealing with mutable data, provide a better suited equality comparison function.

##### Returns

- `undefined` if there are no errors
- `Record<string, ErrorType[]>` if there are errors. The keys are field names in the returned object values are a list of errors for the corresponding field. The returned object is always flat, so if you have a form with arbitrary levels of fields, the keys in that object will be something like `todos[1].name`.

#### `useIncrementalValidation`

A helper React hook for creating a validation context.

##### Signature

- `useIncrementalValidation(model, initialExternalData?, isEqualFn?)`

##### Parameters

- **model** - The model created with `model`.
- **initialExternalData** - Initial external data, check `createValidationContext` for details.
- **isEqualFn** - Equality comparison function used by diffing algorithm. Check `validateModel` for details.

##### Returns

- An object with two properties:
  - `modelContext` - the model validation context, can be used to query for annotations, etc.
  - `validate` - a validate function that will implicitly use the created validation context. The signature for this function is: `validate(data, externalData?)`.

If you’re only interested in doing validation, you can ignore the `modelContext` property, and just use the returned `validate` function.

## Creating data

As mentioned in the “Building the Model” section, you can annotate your fields with default values. You can then create new data with those default values resolved using couple of utility functions from YAVL.

There are a couple reasons why the default value support exists in YAVL:

- It provides a logical place to define your default values in, with rest of your model. It’s good to have a single source of truth for default values, so regardless of where they’re used (creating new data, resetting some particular field, resetting the whole form, etc.) you can always use the default values from the model.
- Some times you might want to use different default value for a field depending on situation. Since YAVL allows you to define default values within `when()` definitions, it effectively allows you to define your default values based on conditions.

Sometimes your default values might depend on other fields’ default values. For example consider the following example:

```ts
type Form = {
  units: 'kilometers' | 'meters';
  distance: number;
};

const myModel = model<Form>((form, model) => [
  model.withFields(form, ['units', 'distance'], (units, distance) => [
    model.defaultValue(units, 'meters'),

    model.when(
      units,
      R.equals('kilometers'),
      () => model.defaultValue(distance, 1),
      () => model.defaultValue(distance, 1000)
    )
  ])
]);
```

If you were to create data where both fields use their default values:

```ts
const initialData = createWithDefaultValues(
  myModel,
  withDefaultValues<Form>((defaultValue) => ({
    units: defaultValue, // defaults to 'meters'
    distance: defaultValue // defaults to 1000
  }))
);
```

Because the default value of _distance_ depends on the value of _units_, YAVL knows it has to solve the value of units first, and will resolve the default value for distance afterwards.

Sometimes you might want to create some data so that you populate some of the fields but for some fields you use default values. One example would be when you load some data over API that you want to use as initial values, but have some data in your form that is created from scratch. The data creation API also supports this:

```ts
const initialData = createWithDefaultValues(
  myModel,
  withDefaultValues<Form>((defaultValue) => ({
    units: 'kilometers', // this could come from some API for example
    distance: defaultValue // defaults to 1 now
  }))
);
```

The idea is that you simply declare default values and what they depend on in your model, so when creating data all you need to say is that a field should use its default value. You don’t need to know or care how that default value is produced. This can keep the code cleaner and easier to understand, as well as ensure the logic for your default values is in a one place (single source of truth), especially if you need to deal with default values in multiple places.

#### `Circular default values`

It’s possible to create a model where two or more fields depend on the default values of each other. For example consider this case:

```ts
const myModel = model<Form>((form, model) => [
  model.withFields(form, ['units', 'distance'], (units, distance) => [
    model.when(
      distance,
      R.equals(1000),
      () => model.defaultValue(units, 'meters'),
      () => model.defaultValue(units, 'kilometers')
    ),

    model.when(
      distance,
      R.equals('kilometers'),
      () => model.defaultValue(distance, 1),
      () => model.defaultValue(distance, 1000)
    )
  ])
]);
```

This is a simplified case for the sake of an example. But if you were to try create some data using default values both fields, it’d be impossible to resolve the values, as both of them depend on each other. In cases like this, YAVL will throw a following error: `Circular default value. The following fields depend on each other: units, distance`.

When this happens the cause for the error might not be so straight-forward. One common cause is that you have a `when` condition in your model which has an object as a dependency and some children of that object also have default values defined. Here’s another simplified example to demonstrate this:

```ts
type Form = {
  distance: {
    include: boolean;
    units: 'kilometers' | 'meters';
    value: number;
  };
};

const myModel = model<Form>((form, model) => [
  model.field(form, 'distance', (distance) => [
    model.withFields(distance, ['units', 'value'], (units, value) => [
      // this will cause a circular error:
      model.when(
        distance,
        (distance) => distance.include,
        () => [
          model.defaultValue(units, 'meters'),

          model.when(
            units,
            R.equals('kilometers'),
            () => model.defaultValue(distance, 1),
            () => model.defaultValue(distance, 1000)
          )
        ]
      )
    ])
  ])
]);
```

Because the `when` depends on the **whole** `distance` object, it means that before the when can be evaluated, all of the default values within the object has to be resolved. YAVL has no way of knowing that the function only uses the `include` property from the object.

Your conditions should only depend on what they need:

```ts
model.withFields(
  distance,
  ['include', 'units', 'value'],
  (include, units, value) => [
    // this is ok!
    model.when(
      include,
      (include) => include,
      () => [
        // ...
      ]
    )
  ]
);
```

When writing your conditions and validations It’s always good practice to only depend on what you actually need. Not only does it avoid errors like this, but it also results in more efficient validation.

### Reference

#### `withDefaultValues`

Define data that can use default values from the model.

##### Signature

- `withDefaultValues<Type>(defaultValueFn)`

##### Type parameters

- **Type** - Type of the data to define default values for. For example to define default values for your whole form: `withDefaultValues<Form>((defaultValue) => { ... })`

##### Parameters

- **defaultValueFn** - A callback that receives a _defaultValue_ symbol as its argument. This symbol can be used in the returned data to indicate that a field should use a default value from the model. The returned data needs to follow the structure of **Type**, but any field can optionally be defined with the _defaultValue_ placeholder.
  - **NOTE.** You should let TypeScript to infer the type for the `defaultValue` argument for you as it’s a symbol defined in YAVL and is not exported.

##### Returns

- An object of type `WithDefaultValues<Type>`. This object can be given as an input to `createWithDefaultValues`.

The **defaultValueFn** function is invoked immediately when this function is called.

For simple models you generally use `withDefaultValues` with your model data type. When working with eg. complex form and sub-forms in particular, you usually want to break down the calls to `withDefaultValues` into smaller parts. You can then compose multiple `WithDefaultValues<T>` objects together in different situations.

One example where you might want to compose multiple `withDefaultValues` is when creating data with arrays. For example let’s say you want to populate your Todo Form with two initial todos:

```ts
type Todo = {
  title: string
  isDone: boolean
}

const todoForm = model<Todo[]>((todos, { withFields, defaultValue } => [
  withFields(todos, ['title', 'isDone'], (title, isDone) => [
    defaultValue(title, 'New Todo'),
    defaultValue(isDone, false)
  ])
])

const getNewTodo = withDefaultValues<Todo>((defaultValue) => ({
  title: defaultValue,
  isDone: defaultValue
}))

const initialData = createWithDefaultValues([getNewTodo(), getNewTodo()])
```

#### `createWithDefaultValues`

Resolves default values from template and returns the resolved data.

##### Signature

- `createWithDefaultValues(model, data, externalData?)`
  - Create data of the whole model.
- `createWithDefaultValues(validationContext, data)`
  - Create data of the whole model.
  - External data is deduced from the validation context.
- `createWithDefaultValues(validationContext, path, data)`
  - Create partial data of the model.
  - External data is deduced from the validation context.

##### Parameters

- **model** - The model for which to create data
- **validationContext** - The validation context created from model for which to create data
- **data** - Data that can include default values defined with `withDefaultValues`
- **externalData** - External data for the model.
- **path** - An array that defines a path to data in model, eg. `['todos']`

##### Returns

- The return type is `T` of the **data** (`WithDefaultValues<T>`).
- Default values are resolved using the `defaultValue` annotations in model.
- Rest of the data is untouched.

Example:

```ts
type Todo = {
  title: string
  isDone: boolean
}

const todoForm = model<Todo[]>((todos, { withFields, defaultValue } => [
  withFields(todos, ['title', 'isDone'], (title, isDone) => [
    defaultValue(title, 'New Todo'),
    defaultValue(isDone, false)
  ])
])

const getNewTodo = withDefaultValues<Todo>((defaultValue) => ({
  title: defaultValue,
  isDone: defaultValue
}))

// create new initial data for whole form
// returns: Array<Todo>
const initialData = createWithDefaultValues(
  validationContext,
  [getNewTodo(), getNewTodo()]
)

// create partial data, you can insert returned data to your state or store
// returns: Todo
const newTodo = createWithDefaultValues(
  validationContext,
  ['todos'],
  getNewTodo()
)
```

**Implementation details & limitations**
At the moment the support for creating partial array data is a bit limited. When creating new array items, YAVL always assumes you want to append the data to the array So when doing `createWithDefaultValues(validationContext, [‘todos’], newTodo)`, what happens is that YAVL resolves the default values from `newTodo` as if it was appended to the end of the current todos.

Generally this does not matter, but there are some implications:

- If your default values depend on the position in the array, you might see some undesirable results.
- Currently you can’t use this to create partial data for a whole array, only items of an array. Referring to an array with path, eg. `['todos']`, always assumes that you want to create data at the end of an array. This means you can’t pass `WithDefaultValues<Todo[]>` as the data argument, it always expects `WithDefaultValues<Todo>`
- Creating data inside nested arrays is not supported.

There are plans to improve specifying the path so you can have more control of the position in the array. For now if this limitation is an issue, you can inject the data with default values placeholders in your current model data manually, resolve the full model data, and then pick the relevant parts from the returned data.

## Annotations

You can add any metadata to your model with annotations. Some of the metadata is used by YAVL internally, for example **defaultValue** annotations are used by the `createWithDefaultValues`.

For custom annotations to have some value, you need a way of querying the annotations to use them outside the model definitions. YAVL provides with various different ways to use your annotation data.

Some examples of what you can use annotations for:

- Display an indicator in your UI whether a form field is required or not using **isRequired** annotation (added automatically by the `required` model builder function).
- Reset field(s) to their default values by getting the **defaultValue** annotation for the field.
- Add a **isDisabled** annotation for fields, and render fields as disabled based on it.
- Add possible options for dropdown selects.
- Add min / max limits for range selectors

Annotations are created with [`createAnnotation`](#createAnnotation) and can be added to the model with the [annotate](#annotate) builder function. Annotations are implemented as symbols so they are unique. In order to get a value of an annotation you must have a handle to the annotation symbol created with `createAnnotation`. YAVL adds some annotations automatically when you use [required](#required) or [defaultValue](#defaultValue) builder functions. In order to access this annotation data, YAVL exports an `annotations` object that has these annotaton symbols in it, for example:

```ts
import { annotations } from '@smartly/yavl';

const isFieldRequired = getFieldAnnotation(
  validationContext,
  'path[0].to.field',
  annotations.isRequired
);
```

**NOTE.** At the moment you can’t subscribe to changes in your annotations. This limits the usefulness of annotations in some cases, like wanting to react to annotation change by re-rendering something in UI in React. An API to register to changes in annotations is planned which will allow a callback to be called whenever an annotation is changed for a field or fields. Some convenience React hooks to add automatic lifecycle management will be part of the API.

As a temporary work-around you can pull all the fields with an annotation you’re interested in using `getFieldsWithAnnotations`, and provide that list via eg. React context and then have your UI code check if the field you’re rendering exists in that list. This is obviously not optimal, as it’ll cause a lot of unnecessary re-renders in complex forms.

### Types

- `Annotation<T>`
  - An annotation symbol created with [`createAnnotation`](#createAnnotation).
- `AnnotationData`
  - An object of type `Record<Annotation, any>`, where keys are annotation symbols and values are data for the corresponding annotations.

### Reference

The query annotations API refers to active and inactive annotations. This means whether annotations inside `when` definitions are currently active or not depending on the result of the condition.

YAVL uses the **validation context** to determine whether an annotation is active or inactive. This means that whenever you call `validateModel`, the annotations for the context are updated. You should always call `validateModel` as soon as your data changes in order to get up-to-date data from the query annotations API.

If you have fields with multiple annotations for same key, the last annotation will be used.

#### `createAnnotation`

Returns all annotations for every field in the model.

##### Signature

- `createAnnotation<Type>(name = undefined)`

##### Type parameters

- **Type** - The type of the annotation.

##### Parameters

- **name** - Optional name for the annotation for debugging purposes.

##### Returns

- `Annotation<Type>`, which can be used to add annotations to the model or quer for annotation data.

Example:

```ts
const isDisabled = createAnnotation<boolean>('isDisabled');
```

#### `getAllAnnotations`

Returns all annotations for every field in the model.

##### Signature

- `getAllAnnotations(validationContext, includeInactive = false)`

##### Parameters

- **validationContext** - Validation context created with `createValidationContext`.
- **includeInactive** - Whether to return inactive annotations.
  - If `false` or omitted only returns active annotations.
  - If `true` returns active and inactive annotations.

##### Returns

- `Record<string, AnnotationData>` . The keys are field names, and values are annotation data for the corresponding field. The returned object is flat, so for nested fields, the field names are returned as a string such as `todos[0].title`.

#### `getFieldsWithAnnotations`

Returns fields that match the given annotations.

##### Signature

- `getFieldsWithAnnotations(validationContext, annotations, includeInactive = false)`

##### Parameters

- **validationContext** - Validation context created with `createValidationContext`.
- **annotations** - The annotations to compare against. If multiple annotations are specified, fields must match all of them.
- **includeInactive** - Whether to return inactive annotations.
  - If `false` or omitted only returns active annotations.
  - If `true` returns active and inactive annotations.

##### Returns

- `string[]`- List of fields with matching annotations.

Example:

```ts
// Returns all fields that are required and disabled
const fields = getFieldsWithAnnotations(validationContext, {
  isRequired: true,
  isDisabled: true
});
```

#### `getFieldAnnotations`

Returns all annotations for a field.

##### Signature

- `getFieldAnnotations(model, field)`
- `getFieldAnnotations(validationContext, field)`

##### Parameters

- **model** - Model created with `model`.
- **validationContext** - Validation context created with `createValidationContext`.
- **field** - The field to get annotations for.

##### Returns

- `AnnotationData` - The annotations for the field, includes all annotations.

#### `getFieldAnnotation`

Returns a specific annotation for a field.

##### Signature

- `getFieldAnnotation<Result = any>(model, field, annotation, defaultValue?)`
  - Searches all annotations for the **annotation**.
- `getFieldAnnotation<Result = any>(validationContext, field, annotation, defaultValue?)`
  -     Searches only active annotations for the **annotation**.

##### Type parameters

- **Result** - The type of the annotation, used as return type. Defaults to `any`.

##### Parameters

- **model** - Model created with `model`.
- **validationContext** - Validation context created with `createValidationContext`.
- **field** - The field to get annotation for.
- **annotation** - The annotation name to get.
- **defaultValue** - If annotation is not found, return this instead.

##### Returns

- If annotation is found:
  - The annotation data as `Result`.
- If annotation is not found:
  - Returns **defaultValue** argument if specified, as `Result`.
  - Throws an error otherwise.

#### `getDefaultValue`

Returns default value for a field.

##### Signature

- `getDefaultValue<Result = any>(model, field, annotation, defaultValue?)`
  - Searches all annotations for the default value.
- `getDefaultValue<Result = any>(validationContext, field, annotation, defaultValue?)`
  - Searches only active annotations for the default value.

##### Type parameters

- **Result** - The type of the annotation, used as return type. Defaults to `any`.

##### Parameters

- **model** - Model created with `model`.
- **validationContext** - Validation context created with `createValidationContext`.
- **field** - The field to get default value for.
- **defaultValue** - If default value annotation is not found, return this instead.

##### Returns

- If default value annotation is found:
  - The default value annotation as `Result`.
- If default value annotation is not found:
  - Returns **defaultValue** argument if specified, as `Result`.
  - Throws an error otherwise.

**NOTE.** This is identical to calling `getFieldAnnotation` with `"defaultValue"` annotation name.

## Development

YAVL consists of three major areas and the code is split into folders based on those.

- `builder/` - code related for building the model.
- `validate/` - code related for incremental validation.
- `create/` - code related for resolving default values.

The other stuff, like the query annotations functions and some utility code exists in the root of the source folder, as well as in some sub-folders such as `utils/` and `hooks/`.

Every module in YAVL has a unit test file that lives next to the module. In addition to having unit tests, there are also very comprehensive integration tests in the `tests/` folder.

If you find a bug, the first thing you should do is add an integration test that isolates the case and fails. You can then either attempt to fix the bug yourself, or create a PR and an issue with the failing integration test.

### Technical overview

TODO: copy & update the technical overview, eg. explaining how the validation context and field dependency cache works.

## Planned features

- Model builder to pre-compute dependencies
  - compute(dependencies, computeFn)
  - Reduce dependencies from validations
  - Allows re-using the computations more easily
- A `pick` function to return a ModelContext with picked fields.
  - Consider that you have a function that takes `Partial<T, 'A' | 'B'>`
  - Would allow you to do eg: `when(pick(obj, ['A', 'B']), func, () => [ ... ])`
  - Could be implemented with `compute`:
    - `const pick = (obj, fields) => compute(dependsOn(obj, fields), (obj) => R.pick(fields, obj))`
- Dynamic annotation values
  - At the moment only static annotation values are supported
  - This would allow you to eg. define default values based on external data
- API to register to annotation changes
  - React hook for convenience
  - Trigger re-rendering UI when annotations change
- Asynchronous validations
  - There hasn’t yet been need to run async validations, but surely this is a necessity for some people, so support definitely should be added.
- Make the “undefined” type configurable for model
  - At the moment required/optional narrow down the context type by removing `undefined` from the possible types.
  - However the default `testRequiredFn` also considers `null` as undefined field; should also remove that for the narrowed type
  - In case user specifies their own `testRequiredFn`, they might not want to remove undefined/null at all from the narrowed type; this should hence be configurable
- Allow specifying position in array when creating data with `createWithDefaultValues`
  - Allow creating data properly whose default values depend on position in array.
  - Allow creating data inside nested arrays.
  - Allow creating whole arrays as partial data, not just items.
- MAYBE: Add `array.length` to allow using array length as a dependency
  - Right now if you need to know how many items are in an array, you need to add the whole array as a dependency
  - This means that whenever _anything_ within the array changes, the dependency would cause the validation/condition to re-run
  - Usage example: `dependency(form, 'list', array.length)`
  - Would only trigger re-run when the length of the array changes
- MAYBE: Allow indexing objects and arrays with dynamic data
  - Would allow you to use eg. a field from form data to index external data
  - At the moment you must select the field and the external data separately
  - Changes to unrelated paths in external data trigger unnecessary validations
- MAYBE: Add more array operators such, eg. array.filter
  - Would allow to selectively tell which elements from array are depended on
  - At the moment you need to depend on all the array elements and pick the data you need in the validator
  - Changes to unrelated array elements trigger unnecessary validations
