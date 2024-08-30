import { model, validateModel } from '../src';

type User = {
  name: string;
  password: string;
  passwordAgain: string;
  isDisabled: boolean;
};

type MyForm = User;

const isValidPassword = (password: string) => {
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

const myModel = model<MyForm>((user, { field, when, validate, dependency }) => [
  // optimized version:
  // when(dependency(user, 'isDisabled'), (isDisabled) => !isDisabled, () => [ ... ])
  when(
    user,
    (user) => !user.isDisabled,
    () => [
      field(user, 'name', (name) => [
        validate(
          name,
          (name) => name.length >= 5,
          'Name must be at least 5 characters'
        )
      ]),

      field(user, 'password', (password) => [
        validate(password, isValidPassword, 'Invalid password'),
        validate(
          password,
          dependency(user, 'passwordAgain'),
          (pw1, pw2) => pw1 !== pw2,
          'Passwords do not match'
        )
      ])
    ]
  )
]);

const errors = validateModel(myModel, {
  name: 'John',
  password: 'Example123',
  passwordAgain: 'invalid',
  isDisabled: false
});

console.log(errors);

/**
 * {
 *   'name': ['Name must be at least 5 characters'],
 *   'passwordAgain': ['Passwords do not match'],
 * }
 */
