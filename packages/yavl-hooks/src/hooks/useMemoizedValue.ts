import { deepEqual } from '@smartlyio/yavl';
import { useRef } from 'react';

export const useMemoizedValue = <T>(value: T): T => {
  const memoizedValueRef = useRef(value);

  if (value !== memoizedValueRef.current && !deepEqual(value, memoizedValueRef.current)) {
    memoizedValueRef.current = value;
  }

  return value;
};
