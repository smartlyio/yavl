export const getPathWithoutIndices = (path: string) => path.replace(/\[[^\]]+\]/g, '[]');
