import * as R from 'ramda';
import { useRef } from 'react';

export const useMemoizedValue = <T>(value: T): T => {
  const memoizedValueRef = useRef(value);

  if (
    value !== memoizedValueRef.current &&
    !R.equals(value, memoizedValueRef.current)
  ) {
    memoizedValueRef.current = value;
  }

  return value;
};
