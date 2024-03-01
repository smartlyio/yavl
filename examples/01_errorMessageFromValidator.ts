import { model, validateModel } from '../src';

type MyForm = {
  name: string;
  password: string;
  passwordAgain: string;
};

const isValidPassowrd = (password: string) => {
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

const myModel = model<MyForm>((form, { field, validate, dependency }) => [
  field(form, 'name', (name) => [
    validate(
      name,
      (name) => name.length >= 5,
      'Name must be at least 5 characters'
    )
  ]),

  field(form, 'password', (password) => [
    validate(password, isValidPassowrd),
    validate(
      password,
      dependency(form, 'passwordAgain'),
      (pw1, pw2) => pw1 !== pw2,
      'Passwords do not match'
    )
  ])
]);

const errors = validateModel(myModel, {
  name: 'John',
  password: 'example123',
  passwordAgain: 'invalid'
});

console.log(errors);

/**
 * {
 *   'name': ['Name must be at least 5 characters'],
 *   'password': ['Password must contain at least one lower-case letter, one upper-case letter and one number'],
 *   'passwordAgain': ['Passwords do not match'],
 * }
 */
