import notifySubscribers from './validate/notifySubscribers';
import { ModelValidationContext } from './validate/types';
import updateModel from './validate/updateModel';

type TransactionArgs = { rollback: () => void };
type TransactionCb<Result> = (args: TransactionArgs) => Result;

export const transaction = <FormData, ExternalData, ErrorType, Result>(
  context: ModelValidationContext<FormData, ExternalData, ErrorType>,
  cb: TransactionCb<Result>,
): Result => {
  if (context.transactionCounter > 0) {
    /**
     * TODO:
     * Let's only implement this if it is needed, the chances are nobody ever needs it.
     * In case of nested transactions, we would need to keep track of the changed annotations
     * per transaction level, so we can rollback only the deepest level of changes, instead
     * of clearing all of them with context.pendingChangedAnnotations.clear()
     */
    throw new Error('Nested model transactions not supported');
  }

  const dataSnapshot = context.previousData;
  const externalDataSnapshot = context.previousExternalData;

  let isRolledBack = false;

  const rollback = () => {
    isRolledBack = true;
  };

  context.transactionCounter += 1;

  try {
    const result = cb({ rollback });
    return result;
  } catch (error) {
    rollback();
    throw error;
  } finally {
    context.transactionCounter -= 1;

    if (isRolledBack) {
      if (dataSnapshot === undefined) {
        // TODO: let's only add support for this if needed
        throw new Error('Rolling back initial update is not supported');
      }

      updateModel(context, dataSnapshot, externalDataSnapshot);

      // clear the changed annotations so we don't notify the subscribers next time updateModel() is called
      context.pendingChangedAnnotations.clear();
    } else {
      if (context.transactionCounter === 0 && context.pendingChangedAnnotations.size > 0) {
        notifySubscribers(context);
      }
    }
  }
};
