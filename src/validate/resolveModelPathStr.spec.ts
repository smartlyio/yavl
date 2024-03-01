jest.mock('./resolveModelPath');
jest.mock('../utils/dataPathToStr');

import resolveModelPathStr from './resolveModelPathStr';
import resolveModelPath from './resolveModelPath';
import dataPathToStr from '../utils/dataPathToStr';

describe('resolveModelPathStr', () => {
  const inputPath: any = { mock: 'inputPath' };
  const resolvedPath: any = { mock: 'resolvedPath' };
  const currentIndices: any = { mock: 'currentIndices' };

  let result: string;

  beforeEach(() => {
    jest.mocked(resolveModelPath).mockReturnValue(resolvedPath);
    jest.mocked(dataPathToStr).mockReturnValue('result.path');

    result = resolveModelPathStr(inputPath, currentIndices);
  });

  it('should resolve model path', () => {
    expect(resolveModelPath).toHaveBeenCalledTimes(1);
    expect(resolveModelPath).toHaveBeenCalledWith(inputPath, currentIndices);
  });

  it('should convert resolved path into string', () => {
    expect(dataPathToStr).toHaveBeenCalledTimes(1);
    expect(dataPathToStr).toHaveBeenCalledWith(resolvedPath);
  });

  it('should return converted string', () => {
    expect(result).toEqual('result.path');
  });
});
