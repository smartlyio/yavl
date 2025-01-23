export const pick = <T extends object, K extends string | number>(keys: readonly K[], obj: T) =>
  Object.fromEntries(
    keys.filter((key): key is K & keyof T => key in obj).map(key => [key, obj[key]]),
  ) as T extends Record<string, unknown> ? Pick<T, `${K}`> : T;
