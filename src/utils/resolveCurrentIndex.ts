const resolveCurrentIndex = (
  pathToField: string,
  currentIndices: Record<string, number>
): number => {
  const currentIndex = currentIndices[pathToField];

  if (currentIndex === undefined) {
    throw new Error(`Current index for path ${pathToField} not found`);
  }

  return currentIndex;
};

export default resolveCurrentIndex;
