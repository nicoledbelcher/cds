import type { PathCommand, Point, SplitResult } from './types';

/**
 * de Casteljau's algorithm for drawing and splitting bezier curves.
 * Inspired by https://pomax.github.io/bezierinfo/
 *
 * @param points Array of [x,y] points: [start, control1, control2, ..., end]
 *   The original segment to split.
 * @param t Where to split the curve (value between [0, 1])
 * @return An object { left, right } where left is the segment from 0..t and
 *   right is the segment from t..1.
 */
function decasteljau(points: Point[], t: number): SplitResult {
  const left: Point[] = [];
  const right: Point[] = [];

  function decasteljauRecurse(pts: Point[], tVal: number): void {
    if (pts.length === 1) {
      left.push(pts[0]);
      right.push(pts[0]);
    } else {
      const newPoints: Point[] = Array(pts.length - 1);

      for (let i = 0; i < newPoints.length; i++) {
        if (i === 0) {
          left.push(pts[0]);
        }
        if (i === newPoints.length - 1) {
          right.push(pts[i + 1]);
        }

        newPoints[i] = [
          (1 - tVal) * pts[i][0] + tVal * pts[i + 1][0],
          (1 - tVal) * pts[i][1] + tVal * pts[i + 1][1],
        ];
      }

      decasteljauRecurse(newPoints, tVal);
    }
  }

  if (points.length) {
    decasteljauRecurse(points, t);
  }

  return { left, right: right.reverse() };
}

/**
 * Convert segments represented as points back into a command object.
 *
 * @param points Array of [x,y] points: [start, control1, control2, ..., end]
 *   Represents a segment
 * @return A command object representing the segment.
 */
function pointsToCommand(points: Point[]): PathCommand {
  const command: Partial<PathCommand> = {};

  if (points.length === 4) {
    command.x2 = points[2][0];
    command.y2 = points[2][1];
  }
  if (points.length >= 3) {
    command.x1 = points[1][0];
    command.y1 = points[1][1];
  }

  command.x = points[points.length - 1][0];
  command.y = points[points.length - 1][1];

  if (points.length === 4) {
    command.type = 'C';
  } else if (points.length === 3) {
    command.type = 'Q';
  } else {
    command.type = 'L';
  }

  return command as PathCommand;
}

/**
 * Runs de Casteljau's algorithm enough times to produce the desired number of segments.
 *
 * @param points Array of [x,y] points for de Casteljau (the initial segment to split)
 * @param segmentCount Number of segments to split the original into
 * @return Array of segments
 */
function splitCurveAsPoints(points: Point[], segmentCount: number = 2): Point[][] {
  const segments: Point[][] = [];
  let remainingCurve: Point[] = points;
  const tIncrement = 1 / segmentCount;

  for (let i = 0; i < segmentCount - 1; i++) {
    const tRelative = tIncrement / (1 - tIncrement * i);
    const split = decasteljau(remainingCurve, tRelative);
    segments.push(split.left);
    remainingCurve = split.right;
  }

  segments.push(remainingCurve);

  return segments;
}

/**
 * Convert command objects to arrays of points, run de Casteljau's algorithm on it
 * to split into the desired number of segments.
 *
 * @param commandStart The start command object
 * @param commandEnd The end command object
 * @param segmentCount The number of segments to create
 * @return An array of commands representing the segments in sequence
 */
export function splitCurve(
  commandStart: PathCommand,
  commandEnd: PathCommand,
  segmentCount?: number,
): PathCommand[] {
  const points: Point[] = [[commandStart.x!, commandStart.y!]];
  if (commandEnd.x1 != null) {
    points.push([commandEnd.x1, commandEnd.y1!]);
  }
  if (commandEnd.x2 != null) {
    points.push([commandEnd.x2, commandEnd.y2!]);
  }
  points.push([commandEnd.x!, commandEnd.y!]);

  return splitCurveAsPoints(points, segmentCount).map(pointsToCommand);
}
