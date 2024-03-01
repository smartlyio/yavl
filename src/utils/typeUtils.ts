export const assertUnreachable = (_: never): never => {
  throw new Error('never happens');
};
