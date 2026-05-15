import { expandChangedPaths } from './processModelChanges';
import { FieldsWithDependencies } from '../types';

describe('expandChangedPaths', () => {
  const fieldsWithDependencies: FieldsWithDependencies = {
    'internal:': { hasDependencies: { computedValues: true, conditions: false, validations: false } },
    'internal:users': { hasDependencies: { computedValues: true, conditions: false, validations: false } },
    'internal:users[]': { hasDependencies: { computedValues: false, conditions: false, validations: true } },
    'internal:users[].name': { hasDependencies: { computedValues: true, conditions: false, validations: true } },
    'internal:users[].age': { hasDependencies: { computedValues: false, conditions: true, validations: true } },
    'internal:preferences': { hasDependencies: { computedValues: false, conditions: false, validations: true } },
    'internal:preferences.locale': { hasDependencies: { computedValues: false, conditions: false, validations: true } },
  };

  it('should expand a leaf path to all ancestor prefixes that exist in fieldsWithDependencies', () => {
    const result = expandChangedPaths([['users', 0, 'name']], fieldsWithDependencies, false, 'validations');

    const pathStrings = result.changedFields.map(p => p.join('.'));
    expect(pathStrings).toContain('');
    expect(pathStrings).toContain('users');
    expect(pathStrings).toContain('users.0');
    expect(pathStrings).toContain('users.0.name');
  });

  it('should filter by changesFor when includeFieldsWithoutDependencies is false', () => {
    const result = expandChangedPaths([['users', 0, 'name']], fieldsWithDependencies, false, 'annotations');

    const pathStrings = result.changedFields.map(p => p.join('.'));
    expect(pathStrings).toContain('');
    expect(pathStrings).toContain('users');
    expect(pathStrings).toContain('users.0.name');
    expect(pathStrings).not.toContain('users.0');
  });

  it('should include all fields when includeFieldsWithoutDependencies is true', () => {
    const result = expandChangedPaths([['users', 0, 'name']], fieldsWithDependencies, true, 'annotations');

    const pathStrings = result.changedFields.map(p => p.join('.'));
    expect(pathStrings).toContain('');
    expect(pathStrings).toContain('users');
    expect(pathStrings).toContain('users.0');
    expect(pathStrings).toContain('users.0.name');
  });

  it('should deduplicate when multiple leaf paths share ancestor prefixes', () => {
    const result = expandChangedPaths(
      [
        ['users', 0, 'name'],
        ['users', 0, 'age'],
      ],
      fieldsWithDependencies,
      true,
      'validations',
    );

    const pathStrings = result.changedFields.map(p => p.join('.'));
    const rootOccurrences = pathStrings.filter(p => p === '').length;
    expect(rootOccurrences).toBe(1);
    expect(pathStrings).toContain('users.0.name');
    expect(pathStrings).toContain('users.0.age');
  });

  it('should skip paths not in fieldsWithDependencies (except root if registered)', () => {
    const result = expandChangedPaths([['unknown', 'field']], fieldsWithDependencies, true, 'validations');

    const pathStrings = result.changedFields.map(p => p.join('.'));
    expect(pathStrings).not.toContain('unknown');
    expect(pathStrings).not.toContain('unknown.field');
  });

  it('should return no results when even root is not registered', () => {
    const sparseFieldsWithDependencies: FieldsWithDependencies = {
      'internal:users[].name': {
        hasDependencies: { computedValues: true, conditions: false, validations: false },
      },
    };

    const result = expandChangedPaths([['unknown', 'field']], sparseFieldsWithDependencies, true, 'validations');

    expect(result.changedFields).toHaveLength(0);
  });

  it('should return empty arraysWithChangedLength', () => {
    const result = expandChangedPaths([['users', 0, 'name']], fieldsWithDependencies, true, 'validations');

    expect(result.arraysWithChangedLength).toHaveLength(0);
  });

  it('should handle an empty changedPaths array', () => {
    const result = expandChangedPaths([], fieldsWithDependencies, true, 'validations');

    expect(result.changedFields).toHaveLength(0);
    expect(result.arraysWithChangedLength).toHaveLength(0);
  });

  it('should handle paths to fields outside arrays', () => {
    const result = expandChangedPaths([['preferences', 'locale']], fieldsWithDependencies, true, 'validations');

    const pathStrings = result.changedFields.map(p => p.join('.'));
    expect(pathStrings).toContain('preferences');
    expect(pathStrings).toContain('preferences.locale');
  });

  it('should handle nested array paths by stripping all indices for dependency lookup', () => {
    const nestedFieldsWithDependencies: FieldsWithDependencies = {
      'internal:': { hasDependencies: { computedValues: true, conditions: false, validations: false } },
      'internal:teams': { hasDependencies: { computedValues: true, conditions: false, validations: false } },
      'internal:teams[]': { hasDependencies: { computedValues: false, conditions: false, validations: true } },
      'internal:teams[].members': {
        hasDependencies: { computedValues: true, conditions: false, validations: false },
      },
      'internal:teams[].members[]': {
        hasDependencies: { computedValues: false, conditions: false, validations: true },
      },
      'internal:teams[].members[].name': {
        hasDependencies: { computedValues: true, conditions: false, validations: true },
      },
    };

    const result = expandChangedPaths(
      [['teams', 2, 'members', 0, 'name']],
      nestedFieldsWithDependencies,
      true,
      'validations',
    );

    const pathStrings = result.changedFields.map(p => p.join('.'));
    expect(pathStrings).toContain('teams');
    expect(pathStrings).toContain('teams.2');
    expect(pathStrings).toContain('teams.2.members');
    expect(pathStrings).toContain('teams.2.members.0');
    expect(pathStrings).toContain('teams.2.members.0.name');
  });

  it('should handle a single-segment path', () => {
    const result = expandChangedPaths([['users']], fieldsWithDependencies, true, 'validations');

    const pathStrings = result.changedFields.map(p => p.join('.'));
    expect(pathStrings).toContain('');
    expect(pathStrings).toContain('users');
    expect(pathStrings).toHaveLength(2);
  });
});
