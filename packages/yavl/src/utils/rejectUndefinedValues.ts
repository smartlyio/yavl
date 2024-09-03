const rejectUndefinedValues = <T>(values: (T | undefined)[]): T[] => values.filter(it => it !== undefined) as T[];

export default rejectUndefinedValues;
