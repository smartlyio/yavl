import { model, validateModel } from '../src';

type MyForm = {
  name: string;
  password: string;
  passwordAgain: string;
};

const isValidPassowrd = (password: string): boolean => {
  if (password.length < 8 || password.length > 32) {
    return false;
  }
  if (
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    return false;
  }
  return true;
};

const areStringsEqual = (a: string, b: string) => a === b;

const myModel = model<MyForm>((form, { field, validate, dependency }) => [
  field(form, 'name', (name) => [
    validate(
      name,
      (name) => name.length >= 5,
      'Name must be at least 5 characters'
    )
  ]),

  field(form, 'password', (password) => [
    validate(password, isValidPassowrd, 'Invalid password'),
    validate(
      password,
      dependency(form, 'passwordAgain'),
      areStringsEqual,
      'Passwords do not match'
    )
  ])
]);

const errors = validateModel(myModel, {
  name: 'John',
  password: 'example123',
  passwordAgain: 'invalid'
});

/**
 * {
 *   'name': ['Name must be at least 5 characters'],
 *   'password': ['Invalid password', 'Passwords do not match']
 * }
 */

console.log(errors);
