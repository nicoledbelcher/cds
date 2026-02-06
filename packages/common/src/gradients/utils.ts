import type { GradientDirection } from '../types/Gradient';

/**
 * Maps direction shorthands to CSS angle degrees.
 */
export const directionToAngle: Record<GradientDirection, number> = {
  'to-t': 0,
  'to-r': 90,
  'to-b': 180,
  'to-l': 270,
  'to-tr': 45,
  'to-tl': 315,
  'to-br': 135,
  'to-bl': 225,
};

/**
 * Resolves a gradient direction to an angle in degrees.
 * @param direction - Direction shorthand or angle number
 * @returns Angle in degrees
 */
export function resolveDirection(direction: GradientDirection | number | undefined): number {
  if (direction === undefined) {
    return 180; // Default: 'to-b'
  }
  if (typeof direction === 'number') {
    return direction;
  }
  return directionToAngle[direction];
}
