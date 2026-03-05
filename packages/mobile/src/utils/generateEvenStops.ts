/**
 * Generates evenly distributed stop positions for the given number of colors.
 * @example generateEvenStops(3) => [0, 0.5, 1]
 */
export const generateEvenStops = (colorCount: number): number[] => {
  if (colorCount <= 1) return [0];
  return Array.from({ length: colorCount }, (_, i) => i / (colorCount - 1));
};
