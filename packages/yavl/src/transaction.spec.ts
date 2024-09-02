jest.mock('./validate/notifySubscribers');
jest.mock('./validate/updateModel');

import { transaction } from './transaction';
import { ModelValidationContext } from './validate/types';
import notifySubscribers from './validate/notifySubscribers';
import { createAnnotation } from './annotations';
import updateModel from './validate/updateModel';

describe('transaction', () => {
  let context: ModelValidationContext<any, any, any>;
  let result: any;

  const dataAtStartOfTransaction = { mock: 'data' };
  const extDataAtStartOfTransaction = { mock: 'ext data' };
  const testAnnotation = createAnnotation<string>('test');

  const makeTestValidationContext = (overwrites?: Partial<ModelValidationContext<any, any, any>>) =>
    ({
      previousData: dataAtStartOfTransaction,
      previousExternalData: extDataAtStartOfTransaction,
      transactionCounter: 0,
      pendingChangedAnnotations: new Map(),
      ...overwrites,
    } as ModelValidationContext<any, any, any>);

  describe('when already in transaction', () => {
    it('should throw an error', () => {
      context = makeTestValidationContext({ transactionCounter: 1 });

      expect(() => transaction(context, () => {})).toThrow('Nested model transactions not supported');
    });
  });

  describe('when not in transaction', () => {
    describe('and when transaction is committed', () => {
      beforeEach(() => {
        const pendingChangedAnnotations = new Map([['field', new Set([testAnnotation])]]);

        context = makeTestValidationContext({
          transactionCounter: 0,
          pendingChangedAnnotations,
        });

        result = transaction(context, () => {
          return 'committed';
        });
      });

      // NOTE. It's important that transactionCounter is 0 here because notifySubscribers checks it
      it('should notify subscribers after transaction counter has been decremented with the changed annotations', () => {
        expect(notifySubscribers).toHaveBeenCalledTimes(1);
        const contextFromCall = jest.mocked(notifySubscribers).mock.calls[0][0];
        expect(contextFromCall.transactionCounter).toBe(0);
        expect(contextFromCall.pendingChangedAnnotations.size).toBe(1);
      });

      it('should not roll back model to previous state', () => {
        expect(updateModel).not.toHaveBeenCalled();
      });

      it('should reset transaction counter to 0', () => {
        expect(context.transactionCounter).toBe(0);
      });

      it('should return the returned value from transaction', () => {
        expect(result).toEqual('committed');
      });
    });

    describe('and when transaction rolled back', () => {
      describe('and when rolling back initial update', () => {
        it('should throw an error', () => {
          context = makeTestValidationContext({
            transactionCounter: 0,
            previousData: undefined,
          });

          expect(() =>
            transaction(context, ({ rollback }) => {
              rollback();
              return 'rolled back';
            }),
          ).toThrow('Rolling back initial update is not supported');
        });
      });

      describe('and when rolling back other updates', () => {
        beforeEach(() => {
          const pendingChangedAnnotations = new Map([['field', new Set([testAnnotation])]]);

          context = makeTestValidationContext({
            transactionCounter: 0,
            pendingChangedAnnotations,
          });

          result = transaction(context, ({ rollback }) => {
            rollback();
            return 'rolled back';
          });
        });

        it('should update model back to the original state', () => {
          expect(updateModel).toHaveBeenCalledTimes(1);
          expect(updateModel).toHaveBeenCalledWith(context, dataAtStartOfTransaction, extDataAtStartOfTransaction);
        });

        it('should not notify subscribers', () => {
          expect(notifySubscribers).not.toHaveBeenCalled();
        });

        it('should clear pending changed annotations', () => {
          expect(context.pendingChangedAnnotations.size).toBe(0);
        });

        it('should reset transaction counter to 0', () => {
          expect(context.transactionCounter).toBe(0);
        });

        it('should return the returned value from transaction', () => {
          expect(result).toEqual('rolled back');
        });
      });
    });

    describe('and callback throws an error', () => {
      let didThrow: boolean;
      beforeEach(() => {
        const pendingChangedAnnotations = new Map([['field', new Set([testAnnotation])]]);

        context = makeTestValidationContext({
          transactionCounter: 0,
          pendingChangedAnnotations,
        });

        try {
          didThrow = false;
          result = transaction(context, () => {
            throw new Error('test');
          });
        } catch {
          didThrow = true;
        }
      });

      it('should update model back to the original state', () => {
        expect(updateModel).toHaveBeenCalledTimes(1);
        expect(updateModel).toHaveBeenCalledWith(context, dataAtStartOfTransaction, extDataAtStartOfTransaction);
      });

      it('should not notify subscribers', () => {
        expect(notifySubscribers).not.toHaveBeenCalled();
      });

      it('should clear pending changed annotations', () => {
        expect(context.pendingChangedAnnotations.size).toBe(0);
      });

      it('should reset transaction counter to 0', () => {
        expect(context.transactionCounter).toBe(0);
      });

      it('should throw', () => {
        expect(didThrow).toBe(true);
      });
    });
  });
});
