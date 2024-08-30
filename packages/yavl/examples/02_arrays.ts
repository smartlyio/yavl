import { model, validateModel } from '../src';

type User = {
  name: string;
  password: string;
  passwordAgain: string;
};

type MyForm = {
  users: User[];
};

const isValidPassword = (password: string): boolean => {
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

const myModel = model<MyForm>(
  (form, { field, withFields, array, validate }) => [
    field(form, 'users', (users) => [
      array(users, (user) => [
        field(user, 'name', (name) => [
          validate(
            name,
            (name) => name.length >= 5,
            'Name must be at least 5 characters'
          )
        ]),

        withFields(
          user,
          ['password', 'passwordAgain'],
          ({ password, passwordAgain }) => [
            validate(password, isValidPassword, 'Invalid password'),
            validate(
              password,
              passwordAgain,
              areStringsEqual,
              'Passwords do not match'
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
 * {
 *   'users[0].name': ['Name must be at least 5 characters'],
 *   'users[0].password': ['Passwords do not match'],
 * }
 */

console.log(errors);
