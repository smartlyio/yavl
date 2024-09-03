import { valueAnnotation } from '../annotations';
import { ModelContext, SupportedDefinition } from '../types';
import annotate from './annotate';
import compute from './compute';
import { ExtractDependencies } from './dependency';
import passiveDependency from './passiveDependency';

type EffectFn<FieldType, Dependencies> = (value: FieldType, dependencies: Dependencies) => FieldType;

export interface SideEffectFn {
  <FieldType, Dependencies>(
    context: ModelContext<FieldType>,
    dependencies: Dependencies,
    effectFn: EffectFn<FieldType, ExtractDependencies<Dependencies>>,
  ): SupportedDefinition;
}

export const sideEffect: SideEffectFn = (
  context: ModelContext<any>,
  dependencies: any,
  effectFn: EffectFn<any, any>,
): SupportedDefinition => {
  return annotate(
    context,
    valueAnnotation,
    /**
     * Add context as a dependency to the value annotation, this makes sure that if the value
     * is changed manually and not by the computed value, we'll re-evaluate the computed value
     */
    compute({ currentValue: passiveDependency(context), dependencies }, ({ currentValue, dependencies }) =>
      effectFn(currentValue, dependencies),
    ),
  );
};
