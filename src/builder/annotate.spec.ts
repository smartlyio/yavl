import { createAnnotation } from '../annotations';
import annotate from './annotate';

describe('annotate', () => {
  const context: any = { mock: 'context' };
  const testAnnotation = createAnnotation<string>('test');

  it('should return annotation definition with the given data', () => {
    const value = 'test value';
    const result = annotate(context, testAnnotation, value);

    expect(result).toEqual({
      context,
      type: 'annotation',
      annotation: testAnnotation,
      value
    });
  });
});
