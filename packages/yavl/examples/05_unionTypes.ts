import { model, validateModel } from '../src';

type EnabledUser = {
  name: string;
  password: string;
  passwordAgain: string;
  isDisabled: false;
};

type DisabledUser = {
  name: string;
  isDisabled: true;
};

type User = EnabledUser | DisabledUser;

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
const isEnabledUser = (user: User): user is EnabledUser => !user.isDisabled;

const myModel = model<MyForm>((user, { field, when, validate }) => [
  // optimized version:
  // when(dependsOn(user, 'isDisabled'), isEnabledUser, () => [ ... ])
  when(user, isEnabledUser, (enabledUser) => [
    field(enabledUser, 'password', (password) => [
      validate(password, isValidPassword, 'Invalid password')
    ])
  ])
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
