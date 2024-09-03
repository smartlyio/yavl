import { model, validateModel } from '../src';

type User = {
  email: string;
};

type MyForm = {
  users: User[];
};

const myModel = model<MyForm>((form, { field, array, validate, dependency }) => [
  field(form, 'users', users => [
    array(users, user => [
      field(user, 'email', email => [
        validate(
          email,
          {
            allEmails: dependency(users, array.all, 'email'),
          },
          (email, deps) => deps.allEmails.filter(it => it === email).length === 1,
          'You cannot have duplicate e-mails in the form',
        ),
      ]),
    ]),
  ]),
]);

const errors = validateModel(myModel, {
  users: [
    {
      email: 'john.doe@example.com',
    },
    {
      email: 'jane.doe@example.com',
    },
    {
      email: 'john.doe@example.com',
    },
  ],
});

console.log(errors);

/**
 * {
 *   'users[0].email': ['You cannot have duplicate e-mails in the form'],
 *   'users[2].email': ['You cannot have duplicate e-mails in the form']
 * }
 */
