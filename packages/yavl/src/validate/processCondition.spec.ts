jest.mock('./checkParentConditions');
jest.mock('./processModelRecursively');
jest.mock('./findErrorCacheEntry');
jest.mock('./getIsPathActive');

import processCondition from './processCondition';
import checkParentConditions from './checkParentConditions';
import { WhenDefinition } from '../types';
import { ModelValidationCache, ProcessingContext } from './types';
import { processModelRecursively } from './processModelRecursively';
import findErrorCacheEntry from './findErrorCacheEntry';
import createErrorCacheEntry from './createErrorCacheEntry';
import { getMockProcessingContext } from '../../tests/helpers/getMockProcessingContext';
import { getIsPathActive } from './getIsPathActive';

describe('processCondition', () => {
  const testFn = jest.fn();

  let mockProcessingContext: ProcessingContext<any, any, any>;
  let testCacheEntry: ModelValidationCache<any>;

  const mockDependencies: any = { mock: 'mockDependencies' };

  const condition: WhenDefinition<any> = {
    type: 'when',
    dependencies: mockDependencies,
    testFn,
    children: [],
  };

  const parentDefinitions: any = [];

  const mockCurrentIndices: any = {
    mock: 'mockCurrentIndices',
  };

  beforeEach(() => {
    // flush the fieldProcessingCache for each test
    mockProcessingContext = getMockProcessingContext();
    testCacheEntry = createErrorCacheEntry<any>();

    jest.mocked(findErrorCacheEntry).mockReturnValue(testCacheEntry);
  });

  const testProcessCondition = ({
    isNewCondition,
    testResult,
    isInitialValidation = true,
  }: {
    isNewCondition: boolean;
    testResult: boolean;
    isInitialValidation?: boolean;
  }) => {
    mockProcessingContext.isInitialValidation = isInitialValidation;

    jest.mocked(checkParentConditions).mockReturnValue(testResult);
    processCondition(mockProcessingContext, condition, parentDefinitions, isNewCondition, mockCurrentIndices);
  };

  describe('when parent path is inactive', () => {
    beforeEach(() => {
      jest.mocked(getIsPathActive).mockReturnValue(false);
    });

    it('should not process the condition', () => {
      expect(checkParentConditions).not.toHaveBeenCalled();
    });
  });

  describe('when parent path is active', () => {
    beforeEach(() => {
      jest.mocked(getIsPathActive).mockReturnValue(true);
    });

    describe('when processing condition for first time during validation', () => {
      describe('always', () => {
        beforeEach(() => {
          testProcessCondition({ isNewCondition: true, testResult: true });
        });

        it('should check parent conditions and this condition', () => {
          expect(checkParentConditions).toHaveBeenCalledTimes(1);
          expect(checkParentConditions).toHaveBeenCalledWith(
            mockProcessingContext,
            parentDefinitions.concat(condition),
            mockCurrentIndices,
          );
        });
      });

      describe('with isNewCondition = true', () => {
        describe('with condition being true', () => {
          describe('always', () => {
            beforeEach(() => {
              testProcessCondition({ isNewCondition: true, testResult: true });
            });

            it('should process child annotation and conditions', () => {
              expect(processModelRecursively).toHaveBeenCalledTimes(2);
              expect(processModelRecursively).toHaveBeenNthCalledWith(
                1,
                mockProcessingContext,
                'annotations',
                parentDefinitions.concat(condition),
                mockCurrentIndices,
              );
              expect(processModelRecursively).toHaveBeenNthCalledWith(
                2,
                mockProcessingContext,
                'conditions',
                parentDefinitions.concat(condition),
                mockCurrentIndices,
              );
            });
          });

          describe('with isInitialValidation = true', () => {
            beforeEach(() => {
              testProcessCondition({
                isNewCondition: true,
                testResult: true,
                isInitialValidation: true,
              });
            });

            it('should not record anything in unprocessedValidationsForConditons', () => {
              expect(mockProcessingContext.unprocessedValidationsForConditons).toEqual([]);
            });
          });

          describe('with isInitialValidation = false', () => {
            beforeEach(() => {
              testProcessCondition({
                isNewCondition: true,
                testResult: true,
                isInitialValidation: false,
              });
            });

            it('should record the condition in unprocessedValidationsForConditons', () => {
              expect(mockProcessingContext.unprocessedValidationsForConditons).toEqual([
                {
                  pathToCondition: parentDefinitions.concat(condition),
                  indices: mockCurrentIndices,
                },
              ]);
            });
          });
        });

        describe('with condition being false', () => {
          beforeEach(() => {
            testProcessCondition({ isNewCondition: true, testResult: false });
          });

          it('should not recurse model', () => {
            expect(processModelRecursively).toHaveBeenCalledTimes(0);
          });
        });
      });

      describe('with isNewCondition = false', () => {
        describe('with condition being true', () => {
          beforeEach(() => {
            jest.mocked(checkParentConditions).mockReturnValue(true);
          });

          describe('when condition was previously false', () => {
            beforeEach(() => {
              testCacheEntry.isPathActive = false;
            });

            describe('always', () => {
              beforeEach(() => {
                testProcessCondition({
                  isNewCondition: false,
                  testResult: true,
                });
              });

              it('should process child annotation and conditions', () => {
                expect(processModelRecursively).toHaveBeenCalledTimes(2);
                expect(processModelRecursively).toHaveBeenNthCalledWith(
                  1,
                  mockProcessingContext,
                  'annotations',
                  parentDefinitions.concat(condition),
                  mockCurrentIndices,
                );
                expect(processModelRecursively).toHaveBeenNthCalledWith(
                  2,
                  mockProcessingContext,
                  'conditions',
                  parentDefinitions.concat(condition),
                  mockCurrentIndices,
                );
              });
            });

            describe('with isInitialValidation = true', () => {
              beforeEach(() => {
                testProcessCondition({
                  isNewCondition: false,
                  testResult: true,
                  isInitialValidation: true,
                });
              });

              it('should not record anything in unprocessedValidationsForConditons', () => {
                expect(mockProcessingContext.unprocessedValidationsForConditons).toEqual([]);
              });
            });

            describe('with isInitialValidation = false', () => {
              beforeEach(() => {
                testProcessCondition({
                  isNewCondition: false,
                  testResult: true,
                  isInitialValidation: false,
                });
              });

              it('should record the condition in unprocessedValidationsForConditons', () => {
                expect(mockProcessingContext.unprocessedValidationsForConditons).toEqual([
                  {
                    pathToCondition: parentDefinitions.concat(condition),
                    indices: mockCurrentIndices,
                  },
                ]);
              });
            });
          });

          describe('when condition was previously true', () => {
            beforeEach(() => {
              testCacheEntry.isPathActive = true;
              testProcessCondition({ isNewCondition: false, testResult: true });
            });

            it('should not recurse model', () => {
              expect(processModelRecursively).toHaveBeenCalledTimes(0);
            });
          });
        });

        describe('with condition being false', () => {
          beforeEach(() => {
            jest.mocked(checkParentConditions).mockReturnValue(false);
            testFn.mockReturnValue(false);
          });

          describe('when condition was previously false', () => {
            beforeEach(() => {
              testCacheEntry.isPathActive = false;
              testProcessCondition({
                isNewCondition: false,
                testResult: false,
              });
            });

            it('should not recurse model', () => {
              expect(processModelRecursively).toHaveBeenCalledTimes(0);
            });
          });

          describe('when condition was previously true', () => {
            beforeEach(() => {
              testCacheEntry.isPathActive = true;
              testProcessCondition({
                isNewCondition: false,
                testResult: false,
              });
            });

            it('should not recurse model', () => {
              expect(processModelRecursively).toHaveBeenCalledTimes(0);
            });
          });
        });
      });
    });

    describe('when processing condition for second time during validation', () => {
      beforeEach(() => {
        testProcessCondition({ isNewCondition: true, testResult: true });
        testProcessCondition({ isNewCondition: true, testResult: true });
      });

      it('should only process condition once', () => {
        expect(checkParentConditions).toHaveBeenCalledTimes(1);
      });
    });
  });
});
