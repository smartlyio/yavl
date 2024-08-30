import {
  ValidatorFnWithoutDependencies,
  ValidatorFnWithDependencies
} from '../types';
import { ExtractDependencies } from './dependency';

interface ValidatorFn<FormData, ExternalData, ErrorType> {
  <FieldType>(
    testFn: ValidatorFnWithoutDependencies<
      FieldType,
      FormData,
      ExternalData,
      boolean
    >,
    error:
      | ErrorType
      | ErrorType[]
      | ValidatorFnWithoutDependencies<
          FieldType,
          FormData,
          ExternalData,
          ErrorType
        >
  ): ValidatorFnWithoutDependencies<
    FieldType,
    FormData,
    ExternalData,
    ErrorType | ErrorType[] | undefined
  >;

  <FieldType, Dependencies>(
    testFn: ValidatorFnWithDependencies<
      FieldType,
      Dependencies,
      FormData,
      ExternalData,
      boolean
    >,
    error:
      | ErrorType
      | ErrorType[]
      | ValidatorFnWithDependencies<
          FieldType,
          ExtractDependencies<Dependencies>,
          FormData,
          ExternalData,
          ErrorType
        >
  ): ValidatorFnWithDependencies<
    FieldType,
    ExtractDependencies<Dependencies>,
    FormData,
    ExternalData,
    ErrorType | ErrorType[] | undefined
  >;
}

export type MakeValidatorFn<
  FormData = unknown,
  ExternalData = unknown,
  ErrorType = unknown
> = ValidatorFn<FormData, ExternalData, ErrorType>;

const validator: MakeValidatorFn<any, any, any> = (
  testFn: (...args: any[]) => boolean,
  errorOrErrors: any
): any => {
  return (...args: any[]) => {
    if (testFn(...args)) {
      return undefined;
    } else if (typeof errorOrErrors === 'function') {
      return errorOrErrors(...args);
    } else {
      return errorOrErrors;
    }
  };
};

export default validator;
