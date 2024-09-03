import { useReducer } from 'react';

const useForceUpdate = (): (() => void) => {
  const [, increment] = useReducer((acc: number) => acc + 1, 0);
  return increment;
};

export default useForceUpdate;
