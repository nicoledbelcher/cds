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

const COLLINEAR_TOLERANCE = 1e-9;

function isCollinear(points: Point[]): boolean {
  if (points.length <= 2) {
    return true;
  }

  const [startX, startY] = points[0];
  const [endX, endY] = points[points.length - 1];
  const dx = endX - startX;
  const dy = endY - startY;

  for (let i = 1; i < points.length - 1; i++) {
    const [pointX, pointY] = points[i];
    const cross = (pointX - startX) * dy - (pointY - startY) * dx;
    if (Math.abs(cross) > COLLINEAR_TOLERANCE) {
      return false;
    }
  }

  return true;
}

function nextPowerOfTwo(value: number): number {
  let power = 1;
  while (power < value) {
    power *= 2;
  }
  return power;
}

function buildAdaptiveDyadicSplitTs(segmentCount: number): number[] {
  if (segmentCount <= 1) {
    return [];
  }

  const denominator = nextPowerOfTwo(segmentCount);
  if (denominator === segmentCount) {
    return Array.from({ length: segmentCount - 1 }, (_value, index) => (index + 1) / segmentCount);
  }

  const oneStepCount = 2 * segmentCount - denominator;
  if (oneStepCount <= 0) {
    return Array.from({ length: segmentCount - 1 }, (_value, index) => (index + 1) / segmentCount);
  }

  const remainingOneSteps = oneStepCount - 1;
  const leftOneSteps = Math.ceil(remainingOneSteps / 2);
  const rightOneSteps = Math.floor(remainingOneSteps / 2);
  const middleTwoSteps = Math.max(0, segmentCount - 1 - leftOneSteps - rightOneSteps);
  const increments = [
    1,
    ...Array(leftOneSteps).fill(1),
    ...Array(middleTwoSteps).fill(2),
    ...Array(rightOneSteps).fill(1),
  ];

  const splitTs: number[] = [];
  let cumulativeIndex = 0;
  for (let i = 0; i < increments.length - 1; i++) {
    cumulativeIndex += increments[i];
    splitTs.push(cumulativeIndex / denominator);
  }

  return splitTs;
}

function segmentBetweenTs(points: Point[], startT: number, endT: number): Point[] {
  if (startT <= 0) {
    if (endT >= 1) {
      return points;
    }
    return decasteljau(points, endT).left;
  }

  if (endT >= 1) {
    return decasteljau(points, startT).right;
  }

  const splitToEnd = decasteljau(points, endT);
  const relativeStart = startT / endT;
  return decasteljau(splitToEnd.left, relativeStart).right;
}

function splitCurveAsPointsAtTs(points: Point[], splitTs: number[]): Point[][] {
  if (splitTs.length === 0) {
    return [points];
  }

  const segments: Point[][] = [];
  let previousT = 0;

  for (const splitT of splitTs) {
    segments.push(segmentBetweenTs(points, previousT, splitT));
    previousT = splitT;
  }

  segments.push(segmentBetweenTs(points, previousT, 1));
  return segments;
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
  if (segmentCount <= 1) {
    return [points];
  }

  if (points.length === 4 && isCollinear(points)) {
    const splitTs = buildAdaptiveDyadicSplitTs(segmentCount);
    return splitCurveAsPointsAtTs(points, splitTs);
  }

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

function evaluateCurvePoint(points: Point[], t: number): Point {
  let workingPoints = points.slice();

  while (workingPoints.length > 1) {
    const next: Point[] = [];

    for (let i = 0; i < workingPoints.length - 1; i++) {
      next.push([
        (1 - t) * workingPoints[i][0] + t * workingPoints[i + 1][0],
        (1 - t) * workingPoints[i][1] + t * workingPoints[i + 1][1],
      ]);
    }

    workingPoints = next;
  }

  return workingPoints[0];
}

function findRelativeTForTargetX(points: Point[], targetX: number): number {
  const startX = points[0][0];
  const endX = points[points.length - 1][0];
  const minX = Math.min(startX, endX);
  const maxX = Math.max(startX, endX);
  const clampedTargetX = Math.max(minX, Math.min(maxX, targetX));
  const isIncreasing = endX >= startX;
  let lower = 0;
  let upper = 1;

  for (let i = 0; i < 30; i++) {
    const mid = (lower + upper) / 2;
    const x = evaluateCurvePoint(points, mid)[0];

    if (Math.abs(x - clampedTargetX) <= 1e-6) {
      lower = mid;
      upper = mid;
      break;
    }

    const shouldMoveRight = isIncreasing ? x < clampedTargetX : x > clampedTargetX;
    if (shouldMoveRight) {
      lower = mid;
    } else {
      upper = mid;
    }
  }

  const t = (lower + upper) / 2;
  return Math.max(1e-6, Math.min(1 - 1e-6, t));
}

function splitCurveAsPointsToTargetXs(points: Point[], targetXs: number[]): Point[][] {
  if (targetXs.length <= 1) {
    return [points];
  }

  const segments: Point[][] = [];
  let remainingCurve: Point[] = points;

  for (let i = 0; i < targetXs.length - 1; i++) {
    const targetX = targetXs[i];
    const splitT = findRelativeTForTargetX(remainingCurve, targetX);
    const split = decasteljau(remainingCurve, splitT);
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

export function splitCurveAtT(
  commandStart: PathCommand,
  commandEnd: PathCommand,
  t: number,
): { left: PathCommand; right: PathCommand } {
  const points: Point[] = [[commandStart.x!, commandStart.y!]];
  if (commandEnd.x1 != null) {
    points.push([commandEnd.x1, commandEnd.y1!]);
  }
  if (commandEnd.x2 != null) {
    points.push([commandEnd.x2, commandEnd.y2!]);
  }
  points.push([commandEnd.x!, commandEnd.y!]);

  const clampedT = Math.max(0, Math.min(1, t));
  const split = decasteljau(points, clampedT);
  return {
    left: pointsToCommand(split.left),
    right: pointsToCommand(split.right),
  };
}

export function splitCurveToTargetXs(
  commandStart: PathCommand,
  commandEnd: PathCommand,
  targetXs: number[],
): PathCommand[] {
  if (targetXs.length === 0) {
    return [];
  }

  const points: Point[] = [[commandStart.x!, commandStart.y!]];
  if (commandEnd.x1 != null) {
    points.push([commandEnd.x1, commandEnd.y1!]);
  }
  if (commandEnd.x2 != null) {
    points.push([commandEnd.x2, commandEnd.y2!]);
  }
  points.push([commandEnd.x!, commandEnd.y!]);

  return splitCurveAsPointsToTargetXs(points, targetXs).map(pointsToCommand);
}
