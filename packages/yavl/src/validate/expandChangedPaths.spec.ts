import { expandChangedPaths } from './processModelChanges';
import { FieldsWithDependencies } from '../types';

describe('expandChangedPaths', () => {
  const fieldsWithDependencies: FieldsWithDependencies = {
    'internal:': { hasDependencies: { computedValues: true, conditions: false, validations: false } },
    'internal:campaigns': { hasDependencies: { computedValues: true, conditions: false, validations: false } },
    'internal:campaigns[]': { hasDependencies: { computedValues: false, conditions: false, validations: true } },
    'internal:campaigns[].name': { hasDependencies: { computedValues: true, conditions: false, validations: true } },
    'internal:campaigns[].budget': { hasDependencies: { computedValues: false, conditions: true, validations: true } },
    'internal:settings': { hasDependencies: { computedValues: false, conditions: false, validations: true } },
    'internal:settings.theme': { hasDependencies: { computedValues: false, conditions: false, validations: true } },
  };

  it('should expand a leaf path to all ancestor prefixes that exist in fieldsWithDependencies', () => {
    const result = expandChangedPaths([['campaigns', 0, 'name']], fieldsWithDependencies, false, 'validations');

    const pathStrings = result.changedFields.map(p => p.join('.'));
    expect(pathStrings).toContain('');
    expect(pathStrings).toContain('campaigns');
    expect(pathStrings).toContain('campaigns.0');
    expect(pathStrings).toContain('campaigns.0.name');
  });

  it('should filter by changesFor when includeFieldsWithoutDependencies is false', () => {
    const result = expandChangedPaths([['campaigns', 0, 'name']], fieldsWithDependencies, false, 'annotations');

    const pathStrings = result.changedFields.map(p => p.join('.'));
    expect(pathStrings).toContain('');
    expect(pathStrings).toContain('campaigns');
    expect(pathStrings).toContain('campaigns.0.name');
    expect(pathStrings).not.toContain('campaigns.0');
  });

  it('should include all fields when includeFieldsWithoutDependencies is true', () => {
    const result = expandChangedPaths([['campaigns', 0, 'name']], fieldsWithDependencies, true, 'annotations');

    const pathStrings = result.changedFields.map(p => p.join('.'));
    expect(pathStrings).toContain('');
    expect(pathStrings).toContain('campaigns');
    expect(pathStrings).toContain('campaigns.0');
    expect(pathStrings).toContain('campaigns.0.name');
  });

  it('should deduplicate when multiple leaf paths share ancestor prefixes', () => {
    const result = expandChangedPaths(
      [
        ['campaigns', 0, 'name'],
        ['campaigns', 0, 'budget'],
      ],
      fieldsWithDependencies,
      true,
      'validations',
    );

    const pathStrings = result.changedFields.map(p => p.join('.'));
    const rootOccurrences = pathStrings.filter(p => p === '').length;
    expect(rootOccurrences).toBe(1);
    expect(pathStrings).toContain('campaigns.0.name');
    expect(pathStrings).toContain('campaigns.0.budget');
  });

  it('should skip paths not in fieldsWithDependencies (except root if registered)', () => {
    const result = expandChangedPaths([['unknown', 'field']], fieldsWithDependencies, true, 'validations');

    const pathStrings = result.changedFields.map(p => p.join('.'));
    expect(pathStrings).not.toContain('unknown');
    expect(pathStrings).not.toContain('unknown.field');
  });

  it('should return no results when even root is not registered', () => {
    const sparseFieldsWithDependencies: FieldsWithDependencies = {
      'internal:campaigns[].name': {
        hasDependencies: { computedValues: true, conditions: false, validations: false },
      },
    };

    const result = expandChangedPaths([['unknown', 'field']], sparseFieldsWithDependencies, true, 'validations');

    expect(result.changedFields).toHaveLength(0);
  });

  it('should return empty arraysWithChangedLength', () => {
    const result = expandChangedPaths([['campaigns', 0, 'name']], fieldsWithDependencies, true, 'validations');

    expect(result.arraysWithChangedLength).toHaveLength(0);
  });

  it('should handle an empty changedPaths array', () => {
    const result = expandChangedPaths([], fieldsWithDependencies, true, 'validations');

    expect(result.changedFields).toHaveLength(0);
    expect(result.arraysWithChangedLength).toHaveLength(0);
  });

  it('should handle paths to fields outside arrays', () => {
    const result = expandChangedPaths([['settings', 'theme']], fieldsWithDependencies, true, 'validations');

    const pathStrings = result.changedFields.map(p => p.join('.'));
    expect(pathStrings).toContain('settings');
    expect(pathStrings).toContain('settings.theme');
  });

  it('should handle nested array paths by stripping all indices for dependency lookup', () => {
    const nestedFieldsWithDependencies: FieldsWithDependencies = {
      'internal:': { hasDependencies: { computedValues: true, conditions: false, validations: false } },
      'internal:campaigns': { hasDependencies: { computedValues: true, conditions: false, validations: false } },
      'internal:campaigns[]': { hasDependencies: { computedValues: false, conditions: false, validations: true } },
      'internal:campaigns[].adGroups': {
        hasDependencies: { computedValues: true, conditions: false, validations: false },
      },
      'internal:campaigns[].adGroups[]': {
        hasDependencies: { computedValues: false, conditions: false, validations: true },
      },
      'internal:campaigns[].adGroups[].name': {
        hasDependencies: { computedValues: true, conditions: false, validations: true },
      },
    };

    const result = expandChangedPaths(
      [['campaigns', 2, 'adGroups', 0, 'name']],
      nestedFieldsWithDependencies,
      true,
      'validations',
    );

    const pathStrings = result.changedFields.map(p => p.join('.'));
    expect(pathStrings).toContain('campaigns');
    expect(pathStrings).toContain('campaigns.2');
    expect(pathStrings).toContain('campaigns.2.adGroups');
    expect(pathStrings).toContain('campaigns.2.adGroups.0');
    expect(pathStrings).toContain('campaigns.2.adGroups.0.name');
  });

  it('should handle a single-segment path', () => {
    const result = expandChangedPaths([['campaigns']], fieldsWithDependencies, true, 'validations');

    const pathStrings = result.changedFields.map(p => p.join('.'));
    expect(pathStrings).toContain('');
    expect(pathStrings).toContain('campaigns');
    expect(pathStrings).toHaveLength(2);
  });
});
