import dependsOn from './dependsOn';
import { ModelContext } from '../types';
import dependency from './dependency';

type Test = {
  field: string;
  nested: {
    field: string;
  };
};

describe('dependsOn', () => {
  const context: ModelContext<Test> = {
    type: 'internal',
    pathToField: [{ type: 'field', name: 'test' }],
  };

  describe('with field names as dependencies', () => {
    const dependsOnContext = dependsOn(context, ['field', 'nested']);

    /**
     * dependsOn contexts should not be marked as passive dependencies.
     * The reason is that builder functions such as pick and filter
     * copy the isPassive information. Eg. if you do:
     *
     * pick(passive(obj), ['childA', 'childB'])
     *
     * The picked object should also be treated as passive. However when
     * doing the same with depenedsOn, we do not want to treat the
     * picked model context as a passive dependency. The passive was used
     * for dependsOn initially only because it was the easiest way to
     * implement the dependsOn, but it had these kind of unwanted
     * side-effects.
     *
     * Instead now the context that has the dependsOn being treated as
     * a passive a dependency is handled by the static cache builder
     * function processDependenciesRecursively
     */
    it('should not return passive dependency', () => {
      expect(dependsOnContext.isPassive).toBeUndefined();
    });

    it('should construct model contexts for the fields for dependsOn', () => {
      expect(dependsOnContext.dependsOn).toEqual([
        {
          type: 'internal',
          pathToField: context.pathToField.concat({
            type: 'field',
            name: 'field',
          }),
        },
        {
          type: 'internal',
          pathToField: context.pathToField.concat({
            type: 'field',
            name: 'nested',
          }),
        },
      ]);
    });
  });

  describe('with model contexts as dependencies', () => {
    const directDependency = dependency(context, 'field');
    const nestedDependency = dependency(context, 'nested', 'field');

    const dependsOnContext = dependsOn(context, [directDependency, nestedDependency]);

    it('should not return passive dependency', () => {
      expect(dependsOnContext.isPassive).toBeUndefined();
    });

    it('should return the dependencies in the dependsOn', () => {
      expect(dependsOnContext.dependsOn).toEqual([directDependency, nestedDependency]);
    });
  });
});
