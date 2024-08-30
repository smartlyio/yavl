import { ModelContext, SupportedDefinition } from '../types';
import { passive } from './passive';
import validate from './validate';

export interface LogFn<ErrorType> {
  (prefix: string, data: any): SupportedDefinition<ErrorType>;
}

const log: LogFn<any> = (
  prefix: string,
  data: any
): SupportedDefinition<any> => {
  const root: ModelContext<any> = { type: 'internal', pathToField: [] };

  return validate(passive(root), data, (_, resolvedData) => {
    console.log(prefix, resolvedData);
    return undefined;
  });
};

export default log;
