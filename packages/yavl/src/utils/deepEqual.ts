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

    if (a instanceof Set) {
      const setB = b as Set<unknown>;
      if (a.size !== setB.size) {
        return false;
      }
      for (const value of a) {
        if (typeof value !== 'object' || value === null) {
          // Primitives: O(1) lookup
          if (!setB.has(value)) {
            return false;
          }
        } else {
          // Objects: O(n) search with deep comparison
          let found = false;
          for (const otherValue of setB) {
            if (deepEqual(value, otherValue)) {
              found = true;
              break;
            }
          }
          if (!found) {
            return false;
          }
        }
      }
      return true;
    }

    if (a instanceof Map) {
      const mapB = b as Map<unknown, unknown>;
      if (a.size !== mapB.size) {
        return false;
      }
      for (const [key, value] of a) {
        if (!mapB.has(key) || !deepEqual(value, mapB.get(key))) {
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
