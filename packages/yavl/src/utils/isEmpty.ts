const typedArrayConstructors = new Set([
  '[object Uint8ClampedArray]',
  '[object Int8Array]',
  '[object Uint8Array]',
  '[object Int16Array]',
  '[object Uint16Array]',
  '[object Int32Array]',
  '[object Uint32Array]',
  '[object Float32Array]',
  '[object Float64Array]',
  '[object BigInt64Array]',
  '[object BigUint64Array]',
]);

export const isEmpty = (value: unknown) => {
  switch (typeof value) {
    case 'string':
      return value === '';
    case 'object':
      if (value === null) {
        return false;
      } else if (Array.isArray(value)) {
        return value.length === 0;
      } else if (value instanceof Set || value instanceof Map) {
        return value.size === 0;
      } else if (value.constructor === Object) {
        return Object.keys(value).length === 0;
      } else if (typedArrayConstructors.has(Object.prototype.toString.call(value))) {
        return (value as unknown[]).length === 0;
      }
    default:
      return false;
  }
};
