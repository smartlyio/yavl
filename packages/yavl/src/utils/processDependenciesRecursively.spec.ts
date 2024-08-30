import processDependenciesRecursively from './processDependenciesRecursively';
import { ComputedContext, ModelContext } from '../types';

describe('processDependenciesRecursively', () => {
  const cb = jest.fn();
  const testContext: ModelContext<any> = {
    type: 'internal',
    pathToField: [{ type: 'field', name: 'test' }]
  };

  describe('with dependencies being model context', () => {
    describe('without dependsOn dependencies', () => {
      beforeEach(() => {
        processDependenciesRecursively(testContext, cb);
      });

      it('should call callback with the context', () => {
        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb).toHaveBeenCalledWith(testContext);
      });
    });

    describe('with dependsOn dependencies', () => {
      const dependsOnA: ModelContext<any> = {
        type: 'internal',
        pathToField: [{ type: 'field', name: 'depA' }]
      };

      const dependsOnB: ModelContext<any> = {
        type: 'internal',
        pathToField: [{ type: 'field', name: 'depB' }]
      };

      const testContextWithDependsOn: ModelContext<any> = {
        type: 'internal',
        pathToField: [{ type: 'field', name: 'test' }],
        dependsOn: [dependsOnA, dependsOnB]
      };

      beforeEach(() => {
        processDependenciesRecursively(testContextWithDependsOn, cb);
      });

      it('should call callback for each dependsOn context, but not for the context itself', () => {
        expect(cb).toHaveBeenCalledTimes(2);
        expect(cb).toHaveBeenCalledWith(dependsOnA);
        expect(cb).toHaveBeenCalledWith(dependsOnB);
      });
    });
  });

  describe('with dependencies being computed context', () => {
    const testComputedContext: ComputedContext<any> = {
      type: 'computed',
      dependencies: {
        data: testContext,
        list: [testContext, 'test'],
        plainData: 'test'
      },
      computeFn: () => {}
    };

    beforeEach(() => {
      processDependenciesRecursively(testComputedContext, cb);
    });

    it('should call callback for each context inside dependencies of computed context', () => {
      // should call once per the data prop and once for the item in list
      expect(cb).toHaveBeenCalledTimes(2);
      expect(cb).toHaveBeenCalledWith(testContext);
      expect(cb).toHaveBeenCalledWith(testContext);
    });
  });

  describe('with context in dependencies object', () => {
    beforeEach(() => {
      processDependenciesRecursively(
        {
          dep: testContext
        },
        cb
      );
    });

    it('should call callback with the context', () => {
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(testContext);
    });
  });

  describe('with context in dependencies array', () => {
    beforeEach(() => {
      processDependenciesRecursively(['a', testContext, 'b'], cb);
    });

    it('should call callback with the context', () => {
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(testContext);
    });
  });

  describe('with nested contexts', () => {
    beforeEach(() => {
      processDependenciesRecursively(
        {
          nested: {
            dep: testContext,
            array: [{}, { value: testContext }]
          }
        },
        cb
      );
    });

    it('should call callback for each found context', () => {
      expect(cb).toHaveBeenCalledTimes(2);
      expect(cb).toHaveBeenNthCalledWith(1, testContext);
      expect(cb).toHaveBeenNthCalledWith(2, testContext);
    });
  });
});
