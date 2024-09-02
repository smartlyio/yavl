import { act, renderHook } from '@testing-library/react-hooks';
import { createAnnotation } from '../annotations';
import model from '../model';
import createValidationContext from '../validate/createValidationContext';
import updateModel from '../validate/updateModel';
import { useFieldsAnnotation } from './useFieldsAnnotation';

describe('useFieldsAnnotation', () => {
  const testAnnotation = createAnnotation<string>('test');

  it('should notify subscriber when array item with annotation is removed', () => {
    type TestModel = {
      items: Array<{
        field: string;
      }>;
    };

    const testModel = model<TestModel>((root, builder) =>
      builder.field(root, 'items', items => [
        builder.array(items, item => [
          builder.field(item, 'field', field => [builder.annotate(field, testAnnotation, 'test')]),
        ]),
      ]),
    );

    const modelContext = createValidationContext(testModel);
    updateModel(modelContext, { items: [{ field: 'a' }, { field: 'b' }] });

    const hook = renderHook(() => useFieldsAnnotation(modelContext, testAnnotation));

    expect(hook.result.current).toEqual({
      'items[0].field': 'test',
      'items[1].field': 'test',
    });

    act(() => {
      updateModel(modelContext, { items: [{ field: 'a' }] });
    });

    expect(hook.result.current).toEqual({
      'items[0].field': 'test',
    });
  });
});
