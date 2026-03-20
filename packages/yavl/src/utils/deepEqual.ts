export const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) {
    return true;
  }

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (a.constructor !== b.constructor) {
      return false;
    }

    if (Array.isArray(a)) {
      if (a.length !== (b as unknown[]).length) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], (b as unknown[])[i])) {
          return false;
        }
      }
      return true;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) {
      return false;
    }
    for (const key of keysA) {
      if (
        !Object.prototype.hasOwnProperty.call(b, key) ||
        !deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
      ) {
        return false;
      }
    }
    return true;
  }

  // NaN === NaN
  return a !== a && b !== b;
};
