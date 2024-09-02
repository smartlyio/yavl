import { ModelContext, ExternalModelContext } from '../types';

export interface AsFn {
  <CastType>(field: ModelContext<unknown>): ModelContext<CastType>;

  <CastType>(field: ExternalModelContext<unknown>): ExternalModelContext<CastType>;
}

const as: AsFn = (field: any) => field;

export default as;
