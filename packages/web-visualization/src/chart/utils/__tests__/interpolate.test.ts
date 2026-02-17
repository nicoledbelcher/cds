import { interpolatePath, pathCommandsFromString } from '../interpolate/interpolatePath';
import { getAreaPath, getLinePath } from '../path';
import { getNumericScale } from '../scale';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const CHART_WIDTH = 300;
const CHART_HEIGHT = 200;

/**
 * Creates x and y scales matching a chart configuration.
 *
 * Default: xAxis={{ domain: { min: 0, max: 10 } }}
 *          yAxis={{ domain: { min: 0, max: 100 } }}
 *          chart area = 300 x 200
 */
function createTestScales(
  options: {
    xDomain?: { min: number; max: number };
    yDomain?: { min: number; max: number };
    width?: number;
    height?: number;
  } = {},
) {
  const {
    xDomain = { min: 0, max: 10 },
    yDomain = { min: 0, max: 100 },
    width = CHART_WIDTH,
    height = CHART_HEIGHT,
  } = options;

  const xScale = getNumericScale({
    scaleType: 'linear',
    domain: xDomain,
    range: { min: 0, max: width },
  });

  const yScale = getNumericScale({
    scaleType: 'linear',
    domain: yDomain,
    range: { min: height, max: 0 }, // inverted for SVG
  });

  return { xScale, yScale };
}

/**
 * Creates evenly spaced xData values across the domain for `count` data points.
 *
 * e.g. createEvenXData(5) => [0, 2.5, 5, 7.5, 10]
 *      createEvenXData(6) => [0, 2, 4, 6, 8, 10]
 */
function createEvenXData(count: number, min = 0, max = 10): number[] {
  if (count === 1) return [min];
  return Array.from({ length: count }, (_, i) => min + ((max - min) * i) / (count - 1));
}

type CurveType = 'linear' | 'bump';

/**
 * Generates both a line path and an area path from the same data and curve.
 * Uses even xData spacing so all data fills the full chart width.
 */
function generatePaths(data: number[], curve: CurveType = 'linear', scales = createTestScales()) {
  const xData = createEvenXData(data.length);
  const { xScale, yScale } = scales;

  const line = getLinePath({ data, curve, xScale, yScale, xData });
  const area = getAreaPath({ data, curve, xScale, yScale, xData });

  return { line, area };
}

/**
 * Generates a line path with explicit xData (for time-sliding tests).
 */
function generateLinePathWithXData(
  data: number[],
  xData: number[],
  curve: CurveType = 'linear',
  scales = createTestScales(),
) {
  const { xScale, yScale } = scales;
  return getLinePath({ data, curve, xScale, yScale, xData });
}

/**
 * Generates an area path with explicit xData (for time-sliding tests).
 */
function generateAreaPathWithXData(
  data: number[],
  xData: number[],
  curve: CurveType = 'linear',
  scales = createTestScales(),
) {
  const { xScale, yScale } = scales;
  return getAreaPath({ data, curve, xScale, yScale, xData });
}

// ─────────────────────────────────────────────────────────────────────────────
// PARSING HELPERS
// ─────────────────────────────────────────────────────────────────────────────

type ParsedCommand = {
  type: string;
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
};

/**
 * Parses a path `d` string into an array of command objects.
 * Uses the same parser as the interpolator itself.
 */
function parsePath(d: string): ParsedCommand[] {
  return pathCommandsFromString(d) as ParsedCommand[];
}

/**
 * Extracts all [x, y] endpoint coordinates from a parsed path.
 * Skips commands without x/y (like Z).
 */
function getEndpoints(d: string): Array<{ x: number; y: number }> {
  const commands = parsePath(d);
  return commands
    .filter((cmd) => cmd.x !== undefined && cmd.y !== undefined)
    .map((cmd) => ({ x: cmd.x!, y: cmd.y! }));
}

/**
 * Gets the bounding box (min/max x/y) of all endpoints in a path.
 */
function getBoundingBox(d: string) {
  const points = getEndpoints(d);
  if (points.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };

  return {
    minX: Math.min(...points.map((p) => p.x)),
    maxX: Math.max(...points.map((p) => p.x)),
    minY: Math.min(...points.map((p) => p.y)),
    maxY: Math.max(...points.map((p) => p.y)),
  };
}

/**
 * Extracts the "top edge" of an area path.
 *
 * d3-area paths go forward along the top edge (x increasing) then return
 * along the bottom edge (x decreasing), ending with Z. The top edge is
 * all commands from the start up to and including the command with the
 * maximum endpoint x value (the rightmost point of the top edge).
 */
function extractAreaTopEdge(d: string): string {
  const commands = parsePath(d);

  // Find the index of the first command with the maximum x
  let maxX = -Infinity;
  let maxXIndex = 0;

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    if (cmd.x !== undefined && cmd.x >= maxX) {
      // Use >= so we get the FIRST command at the max x (top edge, not bottom)
      if (cmd.x > maxX) {
        maxX = cmd.x;
        maxXIndex = i;
      }
    }
  }

  // Build the top edge string from commands 0..maxXIndex
  const topCommands = commands.slice(0, maxXIndex + 1);
  return topCommands
    .map((cmd) => {
      if (cmd.type === 'M') return `M${cmd.x},${cmd.y}`;
      if (cmd.type === 'L') return `L${cmd.x},${cmd.y}`;
      if (cmd.type === 'C') return `C${cmd.x1},${cmd.y1},${cmd.x2},${cmd.y2},${cmd.x},${cmd.y}`;
      if (cmd.type === 'Z') return 'Z';
      return '';
    })
    .join('');
}

/**
 * Extracts the top-edge endpoints of an area path (x,y pairs before the return).
 */
function getAreaTopEdgeEndpoints(d: string): Array<{ x: number; y: number }> {
  const topEdge = extractAreaTopEdge(d);
  return getEndpoints(topEdge);
}

/**
 * Checks that endpoint x-values are monotonically non-decreasing.
 * Returns true if all points satisfy x[i] <= x[i+1].
 */
function hasMonotonicX(d: string): boolean {
  const points = getEndpoints(d);
  for (let i = 1; i < points.length; i++) {
    if (points[i].x < points[i - 1].x - 0.01) {
      return false;
    }
  }
  return true;
}

/**
 * Checks whether a path string starts with M and is non-empty.
 */
function isValidPath(d: string): boolean {
  if (!d || d.length === 0) return false;
  return d.startsWith('M');
}

/**
 * Checks that all endpoints in a path fall within the given bounds (with tolerance).
 */
function allPointsInBounds(
  d: string,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  tolerance = 5,
): boolean {
  const points = getEndpoints(d);
  return points.every(
    (p) =>
      p.x >= bounds.minX - tolerance &&
      p.x <= bounds.maxX + tolerance &&
      p.y >= bounds.minY - tolerance &&
      p.y <= bounds.maxY + tolerance,
  );
}

/**
 * Computes the combined bounding box of two paths (the union).
 */
function combinedBounds(pathA: string, pathB: string) {
  const bbA = getBoundingBox(pathA);
  const bbB = getBoundingBox(pathB);
  return {
    minX: Math.min(bbA.minX, bbB.minX),
    maxX: Math.max(bbA.maxX, bbB.maxX),
    minY: Math.min(bbA.minY, bbB.minY),
    maxY: Math.max(bbA.maxY, bbB.maxY),
  };
}

/**
 * Compares two sets of points and returns the max distance between corresponding points.
 * If lengths differ, returns Infinity.
 */
function maxPointDistance(
  pointsA: Array<{ x: number; y: number }>,
  pointsB: Array<{ x: number; y: number }>,
): number {
  if (pointsA.length !== pointsB.length) return Infinity;
  let maxDist = 0;
  for (let i = 0; i < pointsA.length; i++) {
    const dx = pointsA[i].x - pointsB[i].x;
    const dy = pointsA[i].y - pointsB[i].y;
    maxDist = Math.max(maxDist, Math.sqrt(dx * dx + dy * dy));
  }
  return maxDist;
}

/**
 * Runs the interpolator and returns results at t=0, t=0.5, and t=1.
 */
function interpolateAtKeyFrames(pathA: string, pathB: string) {
  const interpolator = interpolatePath(pathA, pathB);
  return {
    at0: interpolator(0),
    at25: interpolator(0.25),
    at50: interpolator(0.5),
    at75: interpolator(0.75),
    at1: interpolator(1),
    interpolator,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST DATA
// ─────────────────────────────────────────────────────────────────────────────

const DATA_5 = [0, 15, 30, 50, 40];
const DATA_6 = [0, 15, 30, 50, 40, 60];
const DATA_3 = [0, 50, 40];
const DATA_2 = [50, 60];
const DATA_8 = [0, 10, 25, 30, 50, 40, 60, 75];

// Time-sliding data: same count, shifted by one position
const SLIDE_BEFORE_Y = [10, 30, 50, 40, 60];
const SLIDE_AFTER_Y = [30, 50, 40, 60, 70];
const SLIDE_BEFORE_X = [0, 2, 4, 6, 8];
const SLIDE_AFTER_X = [2, 4, 6, 8, 10];

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('interpolatePath', () => {
  const scales = createTestScales();

  // ─────────────────────────────────────────────────────────────────────────
  // Group 1: Same point count, different values (linear)
  // ─────────────────────────────────────────────────────────────────────────
  describe('same point count, different values (linear)', () => {
    const dataA = [0, 15, 30, 50, 40];
    const dataB = [10, 25, 20, 60, 30];

    const pathsA = generatePaths(dataA, 'linear', scales);
    const pathsB = generatePaths(dataB, 'linear', scales);

    it('should return pathB at t=1', () => {
      const { at1 } = interpolateAtKeyFrames(pathsA.line, pathsB.line);
      expect(at1).toBe(pathsB.line);
    });

    it('should return a valid path at t=0', () => {
      const { at0 } = interpolateAtKeyFrames(pathsA.line, pathsB.line);
      expect(isValidPath(at0)).toBe(true);
    });

    it('should produce a valid path at t=0.5 with points in combined bounds', () => {
      const { at50 } = interpolateAtKeyFrames(pathsA.line, pathsB.line);
      expect(isValidPath(at50)).toBe(true);

      const bounds = combinedBounds(pathsA.line, pathsB.line);
      expect(allPointsInBounds(at50, bounds)).toBe(true);
    });

    it('should have monotonically increasing x at t=0.5', () => {
      const { at50 } = interpolateAtKeyFrames(pathsA.line, pathsB.line);
      expect(hasMonotonicX(at50)).toBe(true);
    });

    it('should produce midpoint y-values at t=0.5 for linear paths', () => {
      const { at50 } = interpolateAtKeyFrames(pathsA.line, pathsB.line);
      const pointsA = getEndpoints(pathsA.line);
      const pointsB = getEndpoints(pathsB.line);
      const points50 = getEndpoints(at50);

      // For same-length linear paths, t=0.5 should produce exact midpoints
      // The interpolated path may have more points (due to extension), but the
      // first and last should be close to the midpoints
      const firstA = pointsA[0];
      const firstB = pointsB[0];
      const first50 = points50[0];

      expect(first50.y).toBeCloseTo((firstA.y + firstB.y) / 2, 0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Group 2: Adding a data point (linear)
  // ─────────────────────────────────────────────────────────────────────────
  describe('adding a data point (linear)', () => {
    describe('5 → 6 points', () => {
      const pathA = generatePaths(DATA_5, 'linear', scales).line;
      const pathB = generatePaths(DATA_6, 'linear', scales).line;

      it('should return pathB at t=1', () => {
        const { at1 } = interpolateAtKeyFrames(pathA, pathB);
        expect(at1).toBe(pathB);
      });

      it('should produce a valid path at t=0.5', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        expect(isValidPath(at50)).toBe(true);
      });

      it('should have monotonically increasing x at t=0.5', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        expect(hasMonotonicX(at50)).toBe(true);
      });

      it('should keep all points within combined bounding box at t=0.5', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        const bounds = combinedBounds(pathA, pathB);
        expect(allPointsInBounds(at50, bounds)).toBe(true);
      });

      it('should produce smooth progression from t=0 to t=1', () => {
        const { at0, at25, at50, at75 } = interpolateAtKeyFrames(pathA, pathB);
        // All intermediate frames should be valid paths
        [at0, at25, at50, at75].forEach((path) => {
          expect(isValidPath(path)).toBe(true);
        });
      });
    });

    describe('3 → 5 points', () => {
      const pathA = generatePaths(DATA_3, 'linear', scales).line;
      const pathB = generatePaths(DATA_5, 'linear', scales).line;

      it('should produce a valid path at t=0.5 within bounds', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        expect(isValidPath(at50)).toBe(true);
        expect(allPointsInBounds(at50, combinedBounds(pathA, pathB))).toBe(true);
      });

      it('should have monotonically increasing x at t=0.5', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        expect(hasMonotonicX(at50)).toBe(true);
      });
    });

    describe('2 → 6 points (big jump)', () => {
      const pathA = generatePaths(DATA_2, 'linear', scales).line;
      const pathB = generatePaths(DATA_6, 'linear', scales).line;

      it('should produce a valid path at t=0.5 within bounds', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        expect(isValidPath(at50)).toBe(true);
        expect(allPointsInBounds(at50, combinedBounds(pathA, pathB))).toBe(true);
      });

      it('should have monotonically increasing x at t=0.5', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        expect(hasMonotonicX(at50)).toBe(true);
      });
    });

    describe('5 → 8 points (many added)', () => {
      const pathA = generatePaths(DATA_5, 'linear', scales).line;
      const pathB = generatePaths(DATA_8, 'linear', scales).line;

      it('should produce a valid path at t=0.5 within bounds', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        expect(isValidPath(at50)).toBe(true);
        expect(allPointsInBounds(at50, combinedBounds(pathA, pathB))).toBe(true);
      });

      it('should have monotonically increasing x at t=0.5', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        expect(hasMonotonicX(at50)).toBe(true);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Group 3: Removing data points (linear)
  // ─────────────────────────────────────────────────────────────────────────
  describe('removing data points (linear)', () => {
    describe('6 → 5 points', () => {
      const pathA = generatePaths(DATA_6, 'linear', scales).line;
      const pathB = generatePaths(DATA_5, 'linear', scales).line;

      it('should produce a valid path at t=0.5 within bounds', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        expect(isValidPath(at50)).toBe(true);
        expect(allPointsInBounds(at50, combinedBounds(pathA, pathB))).toBe(true);
      });

      it('should have monotonically increasing x at t=0.5', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        expect(hasMonotonicX(at50)).toBe(true);
      });
    });

    describe('6 → 2 points (big reduction)', () => {
      const pathA = generatePaths(DATA_6, 'linear', scales).line;
      const pathB = generatePaths(DATA_2, 'linear', scales).line;

      it('should produce a valid path at t=0.5 within bounds', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        expect(isValidPath(at50)).toBe(true);
        expect(allPointsInBounds(at50, combinedBounds(pathA, pathB))).toBe(true);
      });

      it('should have monotonically increasing x at t=0.5', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        expect(hasMonotonicX(at50)).toBe(true);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Group 4: Adding a data point (bump curve)
  // ─────────────────────────────────────────────────────────────────────────
  describe('adding a data point (bump)', () => {
    describe('5 → 6 points', () => {
      const pathA = generatePaths(DATA_5, 'bump', scales).line;
      const pathB = generatePaths(DATA_6, 'bump', scales).line;

      it('should return pathB at t=1', () => {
        const { at1 } = interpolateAtKeyFrames(pathA, pathB);
        expect(at1).toBe(pathB);
      });

      it('should produce a valid path at t=0.5', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        expect(isValidPath(at50)).toBe(true);
      });

      it('should keep all points within combined bounding box at t=0.5', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        const bounds = combinedBounds(pathA, pathB);
        expect(allPointsInBounds(at50, bounds)).toBe(true);
      });

      it('should have monotonically increasing x endpoints at t=0.5', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        expect(hasMonotonicX(at50)).toBe(true);
      });
    });

    describe('3 → 5 points (bump)', () => {
      const pathA = generatePaths(DATA_3, 'bump', scales).line;
      const pathB = generatePaths(DATA_5, 'bump', scales).line;

      it('should produce a valid path at t=0.5 within bounds', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        expect(isValidPath(at50)).toBe(true);
        expect(allPointsInBounds(at50, combinedBounds(pathA, pathB))).toBe(true);
      });
    });

    describe('2 → 6 points (bump, big jump)', () => {
      const pathA = generatePaths(DATA_2, 'bump', scales).line;
      const pathB = generatePaths(DATA_6, 'bump', scales).line;

      it('should produce a valid path at t=0.5 within bounds', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        expect(isValidPath(at50)).toBe(true);
        expect(allPointsInBounds(at50, combinedBounds(pathA, pathB))).toBe(true);
      });
    });

    describe('5 → 8 points (bump, many added)', () => {
      const pathA = generatePaths(DATA_5, 'bump', scales).line;
      const pathB = generatePaths(DATA_8, 'bump', scales).line;

      it('should produce a valid path at t=0.5 within bounds', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        expect(isValidPath(at50)).toBe(true);
        expect(allPointsInBounds(at50, combinedBounds(pathA, pathB))).toBe(true);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Group 5: Area interpolation
  // ─────────────────────────────────────────────────────────────────────────
  describe('area interpolation', () => {
    describe('adding a data point (linear area, 5 → 6)', () => {
      const areaA = generatePaths(DATA_5, 'linear', scales).area;
      const areaB = generatePaths(DATA_6, 'linear', scales).area;

      it('should return areaB at t=1', () => {
        const { at1 } = interpolateAtKeyFrames(areaA, areaB);
        expect(at1).toBe(areaB);
      });

      it('should produce a valid area path at t=0.5 (starts with M, ends with Z)', () => {
        const { at50 } = interpolateAtKeyFrames(areaA, areaB);
        expect(isValidPath(at50)).toBe(true);
        expect(at50.endsWith('Z')).toBe(true);
      });

      it('should keep all points within combined bounding box at t=0.5', () => {
        const { at50 } = interpolateAtKeyFrames(areaA, areaB);
        const bounds = combinedBounds(areaA, areaB);
        expect(allPointsInBounds(at50, bounds)).toBe(true);
      });
    });

    describe('adding a data point (bump area, 5 → 6)', () => {
      const areaA = generatePaths(DATA_5, 'bump', scales).area;
      const areaB = generatePaths(DATA_6, 'bump', scales).area;

      it('should produce a valid area path at t=0.5', () => {
        const { at50 } = interpolateAtKeyFrames(areaA, areaB);
        expect(isValidPath(at50)).toBe(true);
        expect(at50.endsWith('Z')).toBe(true);
      });

      it('should keep all points within combined bounding box at t=0.5', () => {
        const { at50 } = interpolateAtKeyFrames(areaA, areaB);
        const bounds = combinedBounds(areaA, areaB);
        expect(allPointsInBounds(at50, bounds)).toBe(true);
      });
    });

    describe('big jump (linear area, 2 → 6)', () => {
      const areaA = generatePaths(DATA_2, 'linear', scales).area;
      const areaB = generatePaths(DATA_6, 'linear', scales).area;

      it('should produce a valid area path at t=0.5', () => {
        const { at50 } = interpolateAtKeyFrames(areaA, areaB);
        expect(isValidPath(at50)).toBe(true);
      });
    });

    describe('removing points (linear area, 6 → 5)', () => {
      const areaA = generatePaths(DATA_6, 'linear', scales).area;
      const areaB = generatePaths(DATA_5, 'linear', scales).area;

      it('should produce a valid area path at t=0.5', () => {
        const { at50 } = interpolateAtKeyFrames(areaA, areaB);
        expect(isValidPath(at50)).toBe(true);
        expect(at50.endsWith('Z')).toBe(true);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Group 6: Area top edge must match line (critical coherence test)
  // ─────────────────────────────────────────────────────────────────────────
  describe('area top edge matches line', () => {
    describe('same point count, different values (linear)', () => {
      const dataA = [0, 15, 30, 50, 40];
      const dataB = [10, 25, 20, 60, 30];

      const lineA = generatePaths(dataA, 'linear', scales).line;
      const lineB = generatePaths(dataB, 'linear', scales).line;
      const areaA = generatePaths(dataA, 'linear', scales).area;
      const areaB = generatePaths(dataB, 'linear', scales).area;

      it('should have matching top edges at t=0 (before interpolation)', () => {
        const linePoints = getEndpoints(lineA);
        const areaTopPoints = getAreaTopEdgeEndpoints(areaA);
        const dist = maxPointDistance(linePoints, areaTopPoints);
        expect(dist).toBeLessThan(1);
      });

      it('should have matching top edges at t=1 (after interpolation)', () => {
        const linePoints = getEndpoints(lineB);
        const areaTopPoints = getAreaTopEdgeEndpoints(areaB);
        const dist = maxPointDistance(linePoints, areaTopPoints);
        expect(dist).toBeLessThan(1);
      });

      it('should have matching top edges at t=0.5', () => {
        const lineAt50 = interpolatePath(lineA, lineB)(0.5);
        const areaAt50 = interpolatePath(areaA, areaB)(0.5);

        const linePoints = getEndpoints(lineAt50);
        const areaTopPoints = getAreaTopEdgeEndpoints(areaAt50);

        // The top edge of the area should match the line at the same t value.
        // Allow some tolerance since extend() may split segments differently.
        const dist = maxPointDistance(linePoints, areaTopPoints);
        expect(dist).toBeLessThan(5);
      });
    });

    describe('adding a data point (linear, 5 → 6)', () => {
      const lineA = generatePaths(DATA_5, 'linear', scales).line;
      const lineB = generatePaths(DATA_6, 'linear', scales).line;
      const areaA = generatePaths(DATA_5, 'linear', scales).area;
      const areaB = generatePaths(DATA_6, 'linear', scales).area;

      it('should have matching top edges at t=0.5', () => {
        const lineAt50 = interpolatePath(lineA, lineB)(0.5);
        const areaAt50 = interpolatePath(areaA, areaB)(0.5);

        const linePoints = getEndpoints(lineAt50);
        const areaTopPoints = getAreaTopEdgeEndpoints(areaAt50);

        const dist = maxPointDistance(linePoints, areaTopPoints);
        expect(dist).toBeLessThan(5);
      });
    });

    describe('adding a data point (bump, 5 → 6)', () => {
      const lineA = generatePaths(DATA_5, 'bump', scales).line;
      const lineB = generatePaths(DATA_6, 'bump', scales).line;
      const areaA = generatePaths(DATA_5, 'bump', scales).area;
      const areaB = generatePaths(DATA_6, 'bump', scales).area;

      it('should have matching top edges at t=0.5', () => {
        const lineAt50 = interpolatePath(lineA, lineB)(0.5);
        const areaAt50 = interpolatePath(areaA, areaB)(0.5);

        const linePoints = getEndpoints(lineAt50);
        const areaTopPoints = getAreaTopEdgeEndpoints(areaAt50);

        const dist = maxPointDistance(linePoints, areaTopPoints);
        expect(dist).toBeLessThan(5);
      });
    });

    describe('same point count, different values (bump)', () => {
      const dataA = [0, 15, 30, 50, 40];
      const dataB = [10, 25, 20, 60, 30];

      const lineA = generatePaths(dataA, 'bump', scales).line;
      const lineB = generatePaths(dataB, 'bump', scales).line;
      const areaA = generatePaths(dataA, 'bump', scales).area;
      const areaB = generatePaths(dataB, 'bump', scales).area;

      it('should have matching top edges at t=0.5', () => {
        const lineAt50 = interpolatePath(lineA, lineB)(0.5);
        const areaAt50 = interpolatePath(areaA, areaB)(0.5);

        const linePoints = getEndpoints(lineAt50);
        const areaTopPoints = getAreaTopEdgeEndpoints(areaAt50);

        const dist = maxPointDistance(linePoints, areaTopPoints);
        expect(dist).toBeLessThan(5);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Group 7: Time period sliding
  // ─────────────────────────────────────────────────────────────────────────
  describe('time period sliding', () => {
    describe('line sliding (bump)', () => {
      const pathA = generateLinePathWithXData(SLIDE_BEFORE_Y, SLIDE_BEFORE_X, 'bump', scales);
      const pathB = generateLinePathWithXData(SLIDE_AFTER_Y, SLIDE_AFTER_X, 'bump', scales);

      it('should produce a valid path at t=0.5', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        expect(isValidPath(at50)).toBe(true);
      });

      it('should slide x-values: first x at t=0.5 should be between pathA and pathB first x', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        const pointsA = getEndpoints(pathA);
        const pointsB = getEndpoints(pathB);
        const points50 = getEndpoints(at50);

        const firstXA = pointsA[0].x;
        const firstXB = pointsB[0].x;
        const firstX50 = points50[0].x;

        const minFirstX = Math.min(firstXA, firstXB);
        const maxFirstX = Math.max(firstXA, firstXB);
        expect(firstX50).toBeGreaterThanOrEqual(minFirstX - 1);
        expect(firstX50).toBeLessThanOrEqual(maxFirstX + 1);
      });

      it('should keep all points within combined bounding box at t=0.5', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        const bounds = combinedBounds(pathA, pathB);
        expect(allPointsInBounds(at50, bounds)).toBe(true);
      });
    });

    describe('line sliding (linear)', () => {
      const pathA = generateLinePathWithXData(SLIDE_BEFORE_Y, SLIDE_BEFORE_X, 'linear', scales);
      const pathB = generateLinePathWithXData(SLIDE_AFTER_Y, SLIDE_AFTER_X, 'linear', scales);

      it('should produce a valid path at t=0.5', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        expect(isValidPath(at50)).toBe(true);
      });

      it('should have monotonically increasing x at t=0.5', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        expect(hasMonotonicX(at50)).toBe(true);
      });

      it('should slide smoothly: midpoint x-values between start and end', () => {
        const { at50 } = interpolateAtKeyFrames(pathA, pathB);
        const pointsA = getEndpoints(pathA);
        const pointsB = getEndpoints(pathB);
        const points50 = getEndpoints(at50);

        // The last x at t=0.5 should be between pathA's last x and pathB's last x
        const lastXA = pointsA[pointsA.length - 1].x;
        const lastXB = pointsB[pointsB.length - 1].x;
        const lastX50 = points50[points50.length - 1].x;

        expect(lastX50).toBeGreaterThanOrEqual(Math.min(lastXA, lastXB) - 1);
        expect(lastX50).toBeLessThanOrEqual(Math.max(lastXA, lastXB) + 1);
      });
    });

    describe('area sliding (bump)', () => {
      const areaA = generateAreaPathWithXData(SLIDE_BEFORE_Y, SLIDE_BEFORE_X, 'bump', scales);
      const areaB = generateAreaPathWithXData(SLIDE_AFTER_Y, SLIDE_AFTER_X, 'bump', scales);

      it('should produce a valid area path at t=0.5', () => {
        const { at50 } = interpolateAtKeyFrames(areaA, areaB);
        expect(isValidPath(at50)).toBe(true);
        expect(at50.endsWith('Z')).toBe(true);
      });

      it('should keep all points within combined bounding box at t=0.5', () => {
        const { at50 } = interpolateAtKeyFrames(areaA, areaB);
        const bounds = combinedBounds(areaA, areaB);
        expect(allPointsInBounds(at50, bounds)).toBe(true);
      });
    });

    describe('area top edge matches line during slide (bump)', () => {
      const lineA = generateLinePathWithXData(SLIDE_BEFORE_Y, SLIDE_BEFORE_X, 'bump', scales);
      const lineB = generateLinePathWithXData(SLIDE_AFTER_Y, SLIDE_AFTER_X, 'bump', scales);
      const areaA = generateAreaPathWithXData(SLIDE_BEFORE_Y, SLIDE_BEFORE_X, 'bump', scales);
      const areaB = generateAreaPathWithXData(SLIDE_AFTER_Y, SLIDE_AFTER_X, 'bump', scales);

      it('should have matching top edges at t=0.5', () => {
        const lineAt50 = interpolatePath(lineA, lineB)(0.5);
        const areaAt50 = interpolatePath(areaA, areaB)(0.5);

        const linePoints = getEndpoints(lineAt50);
        const areaTopPoints = getAreaTopEdgeEndpoints(areaAt50);

        const dist = maxPointDistance(linePoints, areaTopPoints);
        expect(dist).toBeLessThan(5);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Group 8: Edge cases
  // ─────────────────────────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('should handle empty string to valid path', () => {
      const pathB = generatePaths(DATA_5, 'linear', scales).line;
      const interpolator = interpolatePath('', pathB);

      expect(interpolator(1)).toBe(pathB);
      expect(isValidPath(interpolator(0.5))).toBe(true);
    });

    it('should handle valid path to empty string', () => {
      const pathA = generatePaths(DATA_5, 'linear', scales).line;
      const interpolator = interpolatePath(pathA, '');

      expect(interpolator(1)).toBe('');
      expect(isValidPath(interpolator(0.5))).toBe(true);
    });

    it('should handle null inputs', () => {
      const pathB = generatePaths(DATA_5, 'linear', scales).line;

      const interpolator1 = interpolatePath(null, pathB);
      expect(interpolator1(1)).toBe(pathB);

      const interpolator2 = interpolatePath(pathB, null);
      expect(interpolator2(1)).toBe('');
    });

    it('should handle same path to same path', () => {
      const path = generatePaths(DATA_5, 'linear', scales).line;
      const { at50 } = interpolateAtKeyFrames(path, path);

      // Interpolating between identical paths should return the same shape
      expect(isValidPath(at50)).toBe(true);

      const originalPoints = getEndpoints(path);
      const midPoints = getEndpoints(at50);
      // Should be very close to the original (may have extra segments but same shape)
      if (originalPoints.length === midPoints.length) {
        const dist = maxPointDistance(originalPoints, midPoints);
        expect(dist).toBeLessThan(1);
      }
    });

    it('should handle single data point to multi-point', () => {
      const pathA = generatePaths([50], 'linear', scales).line;
      const pathB = generatePaths(DATA_5, 'linear', scales).line;
      const { at50 } = interpolateAtKeyFrames(pathA, pathB);

      expect(isValidPath(at50)).toBe(true);
    });

    it('should handle single data point area to multi-point area', () => {
      const areaA = generatePaths([50], 'linear', scales).area;
      const areaB = generatePaths(DATA_5, 'linear', scales).area;
      const { at50 } = interpolateAtKeyFrames(areaA, areaB);

      expect(isValidPath(at50)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Group 9: Comprehensive progression checks
  // ─────────────────────────────────────────────────────────────────────────
  describe('smooth progression', () => {
    it('should smoothly progress for 5 → 6 line (bump) across many t values', () => {
      const pathA = generatePaths(DATA_5, 'bump', scales).line;
      const pathB = generatePaths(DATA_6, 'bump', scales).line;
      const interpolator = interpolatePath(pathA, pathB);

      const tValues = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
      const bounds = combinedBounds(pathA, pathB);

      for (const t of tValues) {
        const path = interpolator(t);
        expect(isValidPath(path)).toBe(true);
        if (t > 0 && t < 1) {
          expect(allPointsInBounds(path, bounds, 10)).toBe(true);
        }
      }
    });

    it('should smoothly progress for 2 → 8 line (bump) across many t values', () => {
      const pathA = generatePaths(DATA_2, 'bump', scales).line;
      const pathB = generatePaths(DATA_8, 'bump', scales).line;
      const interpolator = interpolatePath(pathA, pathB);

      const tValues = [0, 0.25, 0.5, 0.75, 1.0];
      const bounds = combinedBounds(pathA, pathB);

      for (const t of tValues) {
        const path = interpolator(t);
        expect(isValidPath(path)).toBe(true);
        if (t > 0 && t < 1) {
          expect(allPointsInBounds(path, bounds, 10)).toBe(true);
        }
      }
    });

    it('should smoothly progress for area 5 → 6 (bump) across many t values', () => {
      const areaA = generatePaths(DATA_5, 'bump', scales).area;
      const areaB = generatePaths(DATA_6, 'bump', scales).area;
      const interpolator = interpolatePath(areaA, areaB);

      const tValues = [0, 0.25, 0.5, 0.75, 1.0];
      const bounds = combinedBounds(areaA, areaB);

      for (const t of tValues) {
        const path = interpolator(t);
        expect(isValidPath(path)).toBe(true);
        if (t > 0 && t < 1) {
          expect(allPointsInBounds(path, bounds, 10)).toBe(true);
        }
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Group 10: STRICT area/line coherence (tight tolerance)
  // ─────────────────────────────────────────────────────────────────────────
  describe('strict area/line coherence (< 1px tolerance)', () => {
    describe('same point count, linear', () => {
      const dataA = [0, 15, 30, 50, 40];
      const dataB = [10, 25, 20, 60, 30];
      const lineA = generatePaths(dataA, 'linear', scales).line;
      const lineB = generatePaths(dataB, 'linear', scales).line;
      const areaA = generatePaths(dataA, 'linear', scales).area;
      const areaB = generatePaths(dataB, 'linear', scales).area;

      it('should have < 1px distance between area top edge and line at t=0.5', () => {
        const lineAt50 = interpolatePath(lineA, lineB)(0.5);
        const areaAt50 = interpolatePath(areaA, areaB)(0.5);

        const linePoints = getEndpoints(lineAt50);
        const areaTopPoints = getAreaTopEdgeEndpoints(areaAt50);
        const dist = maxPointDistance(linePoints, areaTopPoints);
        expect(dist).toBeLessThan(1);
      });

      it('should have same number of endpoint commands for line and area top edge at t=0.5', () => {
        const lineAt50 = interpolatePath(lineA, lineB)(0.5);
        const areaAt50 = interpolatePath(areaA, areaB)(0.5);

        const linePoints = getEndpoints(lineAt50);
        const areaTopPoints = getAreaTopEdgeEndpoints(areaAt50);
        expect(linePoints.length).toBe(areaTopPoints.length);
      });
    });

    describe('same point count, bump', () => {
      const dataA = [0, 15, 30, 50, 40];
      const dataB = [10, 25, 20, 60, 30];
      const lineA = generatePaths(dataA, 'bump', scales).line;
      const lineB = generatePaths(dataB, 'bump', scales).line;
      const areaA = generatePaths(dataA, 'bump', scales).area;
      const areaB = generatePaths(dataB, 'bump', scales).area;

      it('should have < 1px distance between area top edge and line at t=0.5', () => {
        const lineAt50 = interpolatePath(lineA, lineB)(0.5);
        const areaAt50 = interpolatePath(areaA, areaB)(0.5);

        const linePoints = getEndpoints(lineAt50);
        const areaTopPoints = getAreaTopEdgeEndpoints(areaAt50);
        const dist = maxPointDistance(linePoints, areaTopPoints);
        expect(dist).toBeLessThan(1);
      });

      it('should have same number of endpoint commands for line and area top edge at t=0.5', () => {
        const lineAt50 = interpolatePath(lineA, lineB)(0.5);
        const areaAt50 = interpolatePath(areaA, areaB)(0.5);

        const linePoints = getEndpoints(lineAt50);
        const areaTopPoints = getAreaTopEdgeEndpoints(areaAt50);
        expect(linePoints.length).toBe(areaTopPoints.length);
      });
    });

    describe('adding point (linear, 5 → 6)', () => {
      const lineA = generatePaths(DATA_5, 'linear', scales).line;
      const lineB = generatePaths(DATA_6, 'linear', scales).line;
      const areaA = generatePaths(DATA_5, 'linear', scales).area;
      const areaB = generatePaths(DATA_6, 'linear', scales).area;

      it('should have < 1px distance between area top edge and line at t=0.5', () => {
        const lineAt50 = interpolatePath(lineA, lineB)(0.5);
        const areaAt50 = interpolatePath(areaA, areaB)(0.5);

        const linePoints = getEndpoints(lineAt50);
        const areaTopPoints = getAreaTopEdgeEndpoints(areaAt50);
        const dist = maxPointDistance(linePoints, areaTopPoints);
        expect(dist).toBeLessThan(1);
      });

      it('should have same number of endpoint commands at t=0.5', () => {
        const lineAt50 = interpolatePath(lineA, lineB)(0.5);
        const areaAt50 = interpolatePath(areaA, areaB)(0.5);

        const linePoints = getEndpoints(lineAt50);
        const areaTopPoints = getAreaTopEdgeEndpoints(areaAt50);
        expect(linePoints.length).toBe(areaTopPoints.length);
      });
    });

    describe('adding point (bump, 5 → 6)', () => {
      const lineA = generatePaths(DATA_5, 'bump', scales).line;
      const lineB = generatePaths(DATA_6, 'bump', scales).line;
      const areaA = generatePaths(DATA_5, 'bump', scales).area;
      const areaB = generatePaths(DATA_6, 'bump', scales).area;

      it('should have < 1px distance between area top edge and line at t=0.5', () => {
        const lineAt50 = interpolatePath(lineA, lineB)(0.5);
        const areaAt50 = interpolatePath(areaA, areaB)(0.5);

        const linePoints = getEndpoints(lineAt50);
        const areaTopPoints = getAreaTopEdgeEndpoints(areaAt50);
        const dist = maxPointDistance(linePoints, areaTopPoints);
        expect(dist).toBeLessThan(1);
      });
    });

    describe('adding point (bump, 3 → 5)', () => {
      const lineA = generatePaths(DATA_3, 'bump', scales).line;
      const lineB = generatePaths(DATA_5, 'bump', scales).line;
      const areaA = generatePaths(DATA_3, 'bump', scales).area;
      const areaB = generatePaths(DATA_5, 'bump', scales).area;

      it('should have < 1px distance between area top edge and line at t=0.5', () => {
        const lineAt50 = interpolatePath(lineA, lineB)(0.5);
        const areaAt50 = interpolatePath(areaA, areaB)(0.5);

        const linePoints = getEndpoints(lineAt50);
        const areaTopPoints = getAreaTopEdgeEndpoints(areaAt50);
        const dist = maxPointDistance(linePoints, areaTopPoints);
        expect(dist).toBeLessThan(1);
      });
    });

    describe('big jump (bump, 2 → 6)', () => {
      const lineA = generatePaths(DATA_2, 'bump', scales).line;
      const lineB = generatePaths(DATA_6, 'bump', scales).line;
      const areaA = generatePaths(DATA_2, 'bump', scales).area;
      const areaB = generatePaths(DATA_6, 'bump', scales).area;

      it('should have < 1px distance between area top edge and line at t=0.5', () => {
        const lineAt50 = interpolatePath(lineA, lineB)(0.5);
        const areaAt50 = interpolatePath(areaA, areaB)(0.5);

        const linePoints = getEndpoints(lineAt50);
        const areaTopPoints = getAreaTopEdgeEndpoints(areaAt50);
        const dist = maxPointDistance(linePoints, areaTopPoints);
        expect(dist).toBeLessThan(1);
      });
    });

    describe('big jump (linear, 2 → 6)', () => {
      const lineA = generatePaths(DATA_2, 'linear', scales).line;
      const lineB = generatePaths(DATA_6, 'linear', scales).line;
      const areaA = generatePaths(DATA_2, 'linear', scales).area;
      const areaB = generatePaths(DATA_6, 'linear', scales).area;

      it('should have < 1px distance between area top edge and line at t=0.5', () => {
        const lineAt50 = interpolatePath(lineA, lineB)(0.5);
        const areaAt50 = interpolatePath(areaA, areaB)(0.5);

        const linePoints = getEndpoints(lineAt50);
        const areaTopPoints = getAreaTopEdgeEndpoints(areaAt50);
        const dist = maxPointDistance(linePoints, areaTopPoints);
        expect(dist).toBeLessThan(1);
      });
    });

    describe('big jump (bump, 2 → 8)', () => {
      const lineA = generatePaths(DATA_2, 'bump', scales).line;
      const lineB = generatePaths(DATA_8, 'bump', scales).line;
      const areaA = generatePaths(DATA_2, 'bump', scales).area;
      const areaB = generatePaths(DATA_8, 'bump', scales).area;

      it('should have < 1px distance between area top edge and line at t=0.5', () => {
        const lineAt50 = interpolatePath(lineA, lineB)(0.5);
        const areaAt50 = interpolatePath(areaA, areaB)(0.5);

        const linePoints = getEndpoints(lineAt50);
        const areaTopPoints = getAreaTopEdgeEndpoints(areaAt50);
        const dist = maxPointDistance(linePoints, areaTopPoints);
        expect(dist).toBeLessThan(1);
      });
    });

    describe('moderate jump (bump, 3 → 6)', () => {
      const lineA = generatePaths(DATA_3, 'bump', scales).line;
      const lineB = generatePaths(DATA_6, 'bump', scales).line;
      const areaA = generatePaths(DATA_3, 'bump', scales).area;
      const areaB = generatePaths(DATA_6, 'bump', scales).area;

      it('should have < 1px distance between area top edge and line at t=0.5', () => {
        const lineAt50 = interpolatePath(lineA, lineB)(0.5);
        const areaAt50 = interpolatePath(areaA, areaB)(0.5);

        const linePoints = getEndpoints(lineAt50);
        const areaTopPoints = getAreaTopEdgeEndpoints(areaAt50);
        const dist = maxPointDistance(linePoints, areaTopPoints);
        expect(dist).toBeLessThan(1);
      });
    });

    describe('slide (bump)', () => {
      const lineA = generateLinePathWithXData(SLIDE_BEFORE_Y, SLIDE_BEFORE_X, 'bump', scales);
      const lineB = generateLinePathWithXData(SLIDE_AFTER_Y, SLIDE_AFTER_X, 'bump', scales);
      const areaA = generateAreaPathWithXData(SLIDE_BEFORE_Y, SLIDE_BEFORE_X, 'bump', scales);
      const areaB = generateAreaPathWithXData(SLIDE_AFTER_Y, SLIDE_AFTER_X, 'bump', scales);

      it('should have < 1px distance between area top edge and line at t=0.5', () => {
        const lineAt50 = interpolatePath(lineA, lineB)(0.5);
        const areaAt50 = interpolatePath(areaA, areaB)(0.5);

        const linePoints = getEndpoints(lineAt50);
        const areaTopPoints = getAreaTopEdgeEndpoints(areaAt50);
        const dist = maxPointDistance(linePoints, areaTopPoints);
        expect(dist).toBeLessThan(1);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Group 11: Midpoint precision for same-count linear paths
  // ─────────────────────────────────────────────────────────────────────────
  describe('midpoint precision (same count, linear)', () => {
    const dataA = [0, 15, 30, 50, 40];
    const dataB = [10, 25, 20, 60, 30];
    const pathA = generatePaths(dataA, 'linear', scales).line;
    const pathB = generatePaths(dataB, 'linear', scales).line;

    it('should produce exact midpoint values at t=0.5 for matching-length linear paths', () => {
      const at50 = interpolatePath(pathA, pathB)(0.5);
      const pointsA = getEndpoints(pathA);
      const pointsB = getEndpoints(pathB);
      const points50 = getEndpoints(at50);

      // Same count: should produce exactly the same number of endpoints
      expect(points50.length).toBe(pointsA.length);

      for (let i = 0; i < pointsA.length; i++) {
        const expectedX = (pointsA[i].x + pointsB[i].x) / 2;
        const expectedY = (pointsA[i].y + pointsB[i].y) / 2;
        expect(points50[i].x).toBeCloseTo(expectedX, 1);
        expect(points50[i].y).toBeCloseTo(expectedY, 1);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Group 12: No x-backtracking at intermediate t values
  // ─────────────────────────────────────────────────────────────────────────
  describe('no x-backtracking during interpolation', () => {
    const tValues = [0.1, 0.25, 0.5, 0.75, 0.9];

    it('line 5→6 (bump): no x-backtracking at any t', () => {
      const pathA = generatePaths(DATA_5, 'bump', scales).line;
      const pathB = generatePaths(DATA_6, 'bump', scales).line;
      const interpolator = interpolatePath(pathA, pathB);

      for (const t of tValues) {
        const path = interpolator(t);
        expect(hasMonotonicX(path)).toBe(true);
      }
    });

    it('line 2→6 (bump): no x-backtracking at any t', () => {
      const pathA = generatePaths(DATA_2, 'bump', scales).line;
      const pathB = generatePaths(DATA_6, 'bump', scales).line;
      const interpolator = interpolatePath(pathA, pathB);

      for (const t of tValues) {
        const path = interpolator(t);
        expect(hasMonotonicX(path)).toBe(true);
      }
    });

    it('line 3→5 (bump): no x-backtracking at any t', () => {
      const pathA = generatePaths(DATA_3, 'bump', scales).line;
      const pathB = generatePaths(DATA_5, 'bump', scales).line;
      const interpolator = interpolatePath(pathA, pathB);

      for (const t of tValues) {
        const path = interpolator(t);
        expect(hasMonotonicX(path)).toBe(true);
      }
    });

    it('line sliding (bump): no x-backtracking at any t', () => {
      const pathA = generateLinePathWithXData(SLIDE_BEFORE_Y, SLIDE_BEFORE_X, 'bump', scales);
      const pathB = generateLinePathWithXData(SLIDE_AFTER_Y, SLIDE_AFTER_X, 'bump', scales);
      const interpolator = interpolatePath(pathA, pathB);

      for (const t of tValues) {
        const path = interpolator(t);
        expect(hasMonotonicX(path)).toBe(true);
      }
    });

    it('line 5→8 (bump): no x-backtracking at any t', () => {
      const pathA = generatePaths(DATA_5, 'bump', scales).line;
      const pathB = generatePaths(DATA_8, 'bump', scales).line;
      const interpolator = interpolatePath(pathA, pathB);

      for (const t of tValues) {
        const path = interpolator(t);
        expect(hasMonotonicX(path)).toBe(true);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Group 13: Interpolated path should span full chart width
  // (new points shouldn't cause the path to shrink or leave gaps)
  // ─────────────────────────────────────────────────────────────────────────
  describe('path should span full chart width during interpolation', () => {
    it('line 5→6 (linear): path at t=0.5 should span from x≈0 to x≈300', () => {
      const pathA = generatePaths(DATA_5, 'linear', scales).line;
      const pathB = generatePaths(DATA_6, 'linear', scales).line;
      const at50 = interpolatePath(pathA, pathB)(0.5);
      const bb = getBoundingBox(at50);

      expect(bb.minX).toBeLessThanOrEqual(1);
      expect(bb.maxX).toBeGreaterThanOrEqual(299);
    });

    it('line 5→6 (bump): path at t=0.5 should span from x≈0 to x≈300', () => {
      const pathA = generatePaths(DATA_5, 'bump', scales).line;
      const pathB = generatePaths(DATA_6, 'bump', scales).line;
      const at50 = interpolatePath(pathA, pathB)(0.5);
      const bb = getBoundingBox(at50);

      expect(bb.minX).toBeLessThanOrEqual(1);
      expect(bb.maxX).toBeGreaterThanOrEqual(299);
    });

    it('line 2→6 (bump): path at t=0.5 should span from x≈0 to x≈300', () => {
      const pathA = generatePaths(DATA_2, 'bump', scales).line;
      const pathB = generatePaths(DATA_6, 'bump', scales).line;
      const at50 = interpolatePath(pathA, pathB)(0.5);
      const bb = getBoundingBox(at50);

      expect(bb.minX).toBeLessThanOrEqual(1);
      expect(bb.maxX).toBeGreaterThanOrEqual(299);
    });

    it('area 5→6 (bump): path at t=0.5 should span from x≈0 to x≈300', () => {
      const areaA = generatePaths(DATA_5, 'bump', scales).area;
      const areaB = generatePaths(DATA_6, 'bump', scales).area;
      const at50 = interpolatePath(areaA, areaB)(0.5);
      const bb = getBoundingBox(at50);

      expect(bb.minX).toBeLessThanOrEqual(1);
      expect(bb.maxX).toBeGreaterThanOrEqual(299);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Group 14: Strict coherence across ALL t values (not just 0.5)
  // ─────────────────────────────────────────────────────────────────────────
  describe('area/line coherence across all t values', () => {
    it('5→6 (bump): area top edge should match line within 1px at t=0.1, 0.25, 0.5, 0.75, 0.9', () => {
      const lineA = generatePaths(DATA_5, 'bump', scales).line;
      const lineB = generatePaths(DATA_6, 'bump', scales).line;
      const areaA = generatePaths(DATA_5, 'bump', scales).area;
      const areaB = generatePaths(DATA_6, 'bump', scales).area;
      const lineInterp = interpolatePath(lineA, lineB);
      const areaInterp = interpolatePath(areaA, areaB);

      const tValues = [0.1, 0.25, 0.5, 0.75, 0.9];
      for (const t of tValues) {
        const linePoints = getEndpoints(lineInterp(t));
        const areaTopPoints = getAreaTopEdgeEndpoints(areaInterp(t));
        const dist = maxPointDistance(linePoints, areaTopPoints);
        expect(dist).toBeLessThan(1);
      }
    });

    it('sliding (bump): area top edge should match line within 1px at multiple t values', () => {
      const lineA = generateLinePathWithXData(SLIDE_BEFORE_Y, SLIDE_BEFORE_X, 'bump', scales);
      const lineB = generateLinePathWithXData(SLIDE_AFTER_Y, SLIDE_AFTER_X, 'bump', scales);
      const areaA = generateAreaPathWithXData(SLIDE_BEFORE_Y, SLIDE_BEFORE_X, 'bump', scales);
      const areaB = generateAreaPathWithXData(SLIDE_AFTER_Y, SLIDE_AFTER_X, 'bump', scales);
      const lineInterp = interpolatePath(lineA, lineB);
      const areaInterp = interpolatePath(areaA, areaB);

      const tValues = [0.1, 0.25, 0.5, 0.75, 0.9];
      for (const t of tValues) {
        const linePoints = getEndpoints(lineInterp(t));
        const areaTopPoints = getAreaTopEdgeEndpoints(areaInterp(t));
        const dist = maxPointDistance(linePoints, areaTopPoints);
        expect(dist).toBeLessThan(1);
      }
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Standalone helper tests
// ─────────────────────────────────────────────────────────────────────────────

describe('test helpers', () => {
  const scales = createTestScales();

  describe('createEvenXData', () => {
    it('should create evenly spaced values', () => {
      expect(createEvenXData(5)).toEqual([0, 2.5, 5, 7.5, 10]);
      expect(createEvenXData(6)).toEqual([0, 2, 4, 6, 8, 10]);
      expect(createEvenXData(2)).toEqual([0, 10]);
      expect(createEvenXData(1)).toEqual([0]);
    });
  });

  describe('generatePaths', () => {
    it('should generate non-empty line and area paths for valid data', () => {
      const { line, area } = generatePaths(DATA_5, 'linear', scales);
      expect(line.length).toBeGreaterThan(0);
      expect(area.length).toBeGreaterThan(0);
      expect(line.startsWith('M')).toBe(true);
      expect(area.startsWith('M')).toBe(true);
    });

    it('should generate different paths for different data', () => {
      const paths5 = generatePaths(DATA_5, 'linear', scales);
      const paths6 = generatePaths(DATA_6, 'linear', scales);
      expect(paths5.line).not.toBe(paths6.line);
      expect(paths5.area).not.toBe(paths6.area);
    });

    it('should generate different paths for different curves', () => {
      const linearPaths = generatePaths(DATA_5, 'linear', scales);
      const bumpPaths = generatePaths(DATA_5, 'bump', scales);
      expect(linearPaths.line).not.toBe(bumpPaths.line);
    });
  });

  describe('extractAreaTopEdge', () => {
    it('should extract top edge that matches corresponding line (linear)', () => {
      const { line, area } = generatePaths(DATA_5, 'linear', scales);
      const linePoints = getEndpoints(line);
      const areaTopPoints = getAreaTopEdgeEndpoints(area);

      // Before interpolation, the area top edge should exactly match the line
      expect(linePoints.length).toBe(areaTopPoints.length);
      const dist = maxPointDistance(linePoints, areaTopPoints);
      expect(dist).toBeLessThan(0.01);
    });

    it('should extract top edge that matches corresponding line (bump)', () => {
      const { line, area } = generatePaths(DATA_5, 'bump', scales);
      const linePoints = getEndpoints(line);
      const areaTopPoints = getAreaTopEdgeEndpoints(area);

      expect(linePoints.length).toBe(areaTopPoints.length);
      const dist = maxPointDistance(linePoints, areaTopPoints);
      expect(dist).toBeLessThan(0.01);
    });
  });

  describe('getBoundingBox', () => {
    it('should compute correct bounding box for known linear path', () => {
      const path = generatePaths([0, 50, 100], 'linear', scales).line;
      const bb = getBoundingBox(path);

      // y-scale is inverted: y=0 maps to 200, y=100 maps to 0
      // So data [0, 50, 100] gives y-values [200, 100, 0]
      expect(bb.minX).toBeCloseTo(0, 0);
      expect(bb.maxX).toBeCloseTo(300, 0);
      expect(bb.minY).toBeCloseTo(0, 0);
      expect(bb.maxY).toBeCloseTo(200, 0);
    });
  });
});

type InterpolationTestCase = {
  name: string;
  description: string;
  start: string;
  end: string;
  interpolated: string;
};

const newTests: InterpolationTestCase[] = [
  {
    name: 'slide data',
    description: 'adding new data point and removing last properly morphs via slide',
    start:
      'M0,180C30,180,30,140,60,140C90,140,90,100,120,100C150,100,150,60,180,60C210,60,210,20,240,20C270,20,270,60,300,60',
    end: 'M0,140C30,140,30,100,60,100C90,100,90,60,120,60C150,60,150,20,180,20C210,20,210,60,240,60C270,60,270,40,300,40',
    // interpolated = 0.5 (50%) interpolated value
    interpolated:
      'M0,160C7.5,150,15,140,30,140C60,140,60,100,90,100C120,100,120,60,150,60C180,60,180,20,210,20C240,20,240,60,270,60C285,60,292.5,55,300,50',
  },
  {
    name: 'time change',
    description: 'changing data completely unrelated should shift up and down',
    start:
      'M16,168.8C34.038,168.8,34.038,150.56,52.077,150.56C70.115,150.56,70.115,139.92,88.154,139.92C106.192,139.92,106.192,115.6,124.231,115.6C142.269,115.6,142.269,35.04,160.308,35.04C178.346,35.04,178.346,115.6,196.385,115.6C214.423,115.6,214.423,150.56,232.462,150.56C250.5,150.56,250.5,104.96,268.538,104.96C286.577,104.96,286.577,152.08,304.615,152.08C322.654,152.08,322.654,177.92,340.692,177.92C358.731,177.92,358.731,80.64,376.769,80.64C394.808,80.64,394.808,153.6,412.846,153.6C430.885,153.6,430.885,152.08,448.923,152.08C466.962,152.08,466.962,95.84,485,95.84',
    end: 'M16,124.72C30.656,124.72,30.656,168.8,45.313,168.8C59.969,168.8,59.969,109.52,74.625,109.52C89.281,109.52,89.281,138.4,103.938,138.4C118.594,138.4,118.594,168.8,133.25,168.8C147.906,168.8,147.906,124.72,162.563,124.72C177.219,124.72,177.219,153.6,191.875,153.6C206.531,153.6,206.531,111.04,221.188,111.04C235.844,111.04,235.844,138.4,250.5,138.4C265.156,138.4,265.156,182.48,279.813,182.48C294.469,182.48,294.469,109.52,309.125,109.52C323.781,109.52,323.781,33.52,338.438,33.52C353.094,33.52,353.094,153.6,367.75,153.6C382.406,153.6,382.406,92.8,397.063,92.8C411.719,92.8,411.719,138.4,426.375,138.4C441.031,138.4,441.031,161.2,455.688,161.2C470.344,161.2,470.344,155.12,485,155.12',
    interpolated:
      'M16,146.76C32.347,146.76,32.347,159.68,48.695,159.68C65.042,159.68,65.042,124.72,81.39,124.72C97.737,124.72,97.737,127,114.084,127C125.922,127,128.177,132.13,137.76,122.06C147.342,111.99,149.597,79.88,161.436,79.88C173.273,79.88,175.528,104.39,185.111,114.46C194.693,124.53,196.948,113.32,208.787,113.32C225.134,113.32,225.134,144.48,241.481,144.48C257.828,144.48,257.828,143.72,274.176,143.72C290.523,143.72,290.523,130.8,306.87,130.8C323.218,130.8,323.218,105.72,339.565,105.72C351.403,105.72,353.658,153.6,363.24,141.44C372.823,129.28,375.078,86.72,386.916,86.72C403.264,86.72,403.264,146,419.611,146C435.958,146,435.958,156.64,452.306,156.64C468.653,156.64,468.653,125.48,485,125.48',
  },
  {
    name: 'simple to complex area time change',
    description: 'changing from a short time period to long causes a lot of changes',
    start: 'M16,134.5C410.5,134.5,410.5,134.5,805,134.5L805,209C410.5,209,410.5,209,16,209Z',
    end: 'M16,100.276C17.375,100.276,17.375,107.398,18.749,107.398C20.124,107.398,20.124,108.674,21.498,108.674C22.873,108.674,22.873,113.348,24.247,113.348C25.622,113.348,25.622,111.01,26.997,111.01C28.371,111.01,28.371,120.186,29.746,120.186C31.12,120.186,31.12,113.957,32.495,113.957C33.869,113.957,33.869,117.679,35.244,117.679C36.618,117.679,36.618,114.666,37.993,114.666C39.368,114.666,39.368,101.137,40.742,101.137C42.117,101.137,42.117,115.585,43.491,115.585C44.866,115.585,44.866,112.837,46.24,112.837C47.615,112.837,47.615,117.047,48.99,117.047C50.364,117.047,50.364,120.922,51.739,120.922C53.113,120.922,53.113,113.524,54.488,113.524C55.862,113.524,55.862,116.367,57.237,116.367C58.611,116.367,58.611,107.229,59.986,107.229C61.361,107.229,61.361,102.62,62.735,102.62C64.11,102.62,64.11,106.563,65.484,106.563C66.859,106.563,66.859,93.865,68.233,93.865C69.608,93.865,69.608,95.054,70.983,95.054C72.357,95.054,72.357,89.791,73.732,89.791C75.106,89.791,75.106,96.564,76.481,96.564C77.855,96.564,77.855,83.782,79.23,83.782C80.605,83.782,80.605,80.881,81.979,80.881C83.354,80.881,83.354,85.304,84.728,85.304C86.103,85.304,86.103,86.218,87.477,86.218C88.852,86.218,88.852,86.028,90.226,86.028C91.601,86.028,91.601,91.674,92.976,91.674C94.35,91.674,94.35,87.74,95.725,87.74C97.099,87.74,97.099,76.374,98.474,76.374C99.848,76.374,99.848,77.692,101.223,77.692C102.598,77.692,102.598,81.094,103.972,81.094C105.347,81.094,105.347,83.888,106.721,83.888C108.096,83.888,108.096,74.74,109.47,74.74C110.845,74.74,110.845,70.347,112.22,70.347C113.594,70.347,113.594,75.851,114.969,75.851C116.343,75.851,116.343,66.159,117.718,66.159C119.092,66.159,119.092,65.878,120.467,65.878C121.841,65.878,121.841,67.522,123.216,67.522C124.591,67.522,124.591,68.664,125.965,68.664C127.34,68.664,127.34,68.226,128.714,68.226C130.089,68.226,130.089,72.523,131.463,72.523C132.838,72.523,132.838,72.978,134.213,72.978C135.587,72.978,135.587,72.215,136.962,72.215C138.336,72.215,138.336,77.069,139.711,77.069C141.085,77.069,141.085,84.564,142.46,84.564C143.834,84.564,143.834,92.679,145.209,92.679C146.584,92.679,146.584,90.074,147.958,90.074C149.333,90.074,149.333,93.915,150.707,93.915C152.082,93.915,152.082,83.662,153.456,83.662C154.831,83.662,154.831,81.341,156.206,81.341C157.58,81.341,157.58,76.42,158.955,76.42C160.329,76.42,160.329,88.68,161.704,88.68C163.078,88.68,163.078,84.411,164.453,84.411C165.828,84.411,165.828,81.734,167.202,81.734C168.577,81.734,168.577,81.103,169.951,81.103C171.326,81.103,171.326,76.797,172.7,76.797C174.075,76.797,174.075,72.989,175.449,72.989C176.824,72.989,176.824,77.636,178.199,77.636C179.573,77.636,179.573,76.642,180.948,76.642C182.322,76.642,182.322,80.851,183.697,80.851C185.071,80.851,185.071,104.474,186.446,104.474C187.821,104.474,187.821,109.468,189.195,109.468C190.57,109.468,190.57,124.223,191.944,124.223C193.319,124.223,193.319,121.791,194.693,121.791C196.068,121.791,196.068,108.698,197.443,108.698C198.817,108.698,198.817,108.782,200.192,108.782C201.566,108.782,201.566,94.561,202.941,94.561C204.315,94.561,204.315,94.095,205.69,94.095C207.064,94.095,207.064,96.256,208.439,96.256C209.814,96.256,209.814,106.493,211.188,106.493C212.563,106.493,212.563,111.141,213.937,111.141C215.312,111.141,215.312,117.754,216.686,117.754C218.061,117.754,218.061,106.333,219.436,106.333C220.81,106.333,220.81,104.377,222.185,104.377C223.559,104.377,223.559,96.785,224.934,96.785C226.308,96.785,226.308,91.61,227.683,91.61C229.057,91.61,229.057,88.373,230.432,88.373C231.807,88.373,231.807,86.392,233.181,86.392C234.556,86.392,234.556,90.45,235.93,90.45C237.305,90.45,237.305,85.135,238.679,85.135C240.054,85.135,240.054,85.53,241.429,85.53C242.803,85.53,242.803,92.857,244.178,92.857C245.552,92.857,245.552,92.18,246.927,92.18C248.301,92.18,248.301,90.174,249.676,90.174C251.051,90.174,251.051,90.161,252.425,90.161C253.8,90.161,253.8,85.875,255.174,85.875C256.549,85.875,256.549,83.96,257.923,83.96C259.298,83.96,259.298,83.801,260.672,83.801C262.047,83.801,262.047,83.865,263.422,83.865C264.796,83.865,264.796,85.279,266.171,85.279C267.545,85.279,267.545,95.247,268.92,95.247C270.294,95.247,270.294,99.159,271.669,99.159C273.044,99.159,273.044,106.676,274.418,106.676C275.793,106.676,275.793,99.687,277.167,99.687C278.542,99.687,278.542,91.874,279.916,91.874C281.291,91.874,281.291,98.709,282.666,98.709C284.04,98.709,284.04,96.052,285.415,96.052C286.789,96.052,286.789,83.2,288.164,83.2C289.538,83.2,289.538,84.595,290.913,84.595C292.287,84.595,292.287,66.797,293.662,66.797C295.037,66.797,295.037,74.979,296.411,74.979C297.786,74.979,297.786,61.266,299.16,61.266C300.535,61.266,300.535,69.436,301.909,69.436C303.284,69.436,303.284,76.457,304.659,76.457C306.033,76.457,306.033,81.224,307.408,81.224C308.782,81.224,308.782,81.329,310.157,81.329C311.531,81.329,311.531,83.339,312.906,83.339C314.28,83.339,314.28,93.544,315.655,93.544C317.03,93.544,317.03,88.914,318.404,88.914C319.779,88.914,319.779,89.106,321.153,89.106C322.528,89.106,322.528,93.979,323.902,93.979C325.277,93.979,325.277,96.917,326.652,96.917C328.026,96.917,328.026,97.982,329.401,97.982C330.775,97.982,330.775,82.844,332.15,82.844C333.524,82.844,333.524,87.64,334.899,87.64C336.274,87.64,336.274,80.254,337.648,80.254C339.023,80.254,339.023,80.377,340.397,80.377C341.772,80.377,341.772,81.027,343.146,81.027C344.521,81.027,344.521,89.155,345.895,89.155C347.27,89.155,347.27,112.275,348.645,112.275C350.019,112.275,350.019,109.014,351.394,109.014C352.768,109.014,352.768,119.023,354.143,119.023C355.517,119.023,355.517,122.018,356.892,122.018C358.267,122.018,358.267,109.55,359.641,109.55C361.016,109.55,361.016,113.275,362.39,113.275C363.765,113.275,363.765,117.663,365.139,117.663C366.514,117.663,366.514,114.972,367.889,114.972C369.263,114.972,369.263,108.373,370.638,108.373C372.012,108.373,372.012,103.74,373.387,103.74C374.761,103.74,374.761,108.432,376.136,108.432C377.51,108.432,377.51,118.746,378.885,118.746C380.26,118.746,380.26,119.681,381.634,119.681C383.009,119.681,383.009,137.204,384.383,137.204C385.758,137.204,385.758,145.82,387.132,145.82C388.507,145.82,388.507,152.715,389.882,152.715C391.256,152.715,391.256,143.33,392.631,143.33C394.005,143.33,394.005,153.841,395.38,153.841C396.754,153.841,396.754,175.752,398.129,175.752C399.503,175.752,399.503,193.552,400.878,193.552C402.253,193.552,402.253,206.989,403.627,206.989C405.002,206.989,405.002,199.827,406.376,199.827C407.751,199.827,407.751,193.46,409.125,193.46C410.5,193.46,410.5,192.544,411.875,192.544C413.249,192.544,413.249,164.31,414.624,164.31C415.998,164.31,415.998,155.7,417.373,155.7C418.747,155.7,418.747,143.842,420.122,143.842C421.497,143.842,421.497,154.95,422.871,154.95C424.246,154.95,424.246,155.877,425.62,155.877C426.995,155.877,426.995,165.093,428.369,165.093C429.744,165.093,429.744,176.767,431.118,176.767C432.493,176.767,432.493,174.703,433.868,174.703C435.242,174.703,435.242,155.224,436.617,155.224C437.991,155.224,437.991,138.225,439.366,138.225C440.74,138.225,440.74,148.872,442.115,148.872C443.49,148.872,443.49,152.121,444.864,152.121C446.239,152.121,446.239,153.148,447.613,153.148C448.988,153.148,448.988,159.595,450.362,159.595C451.737,159.595,451.737,143.115,453.111,143.115C454.486,143.115,454.486,138.355,455.861,138.355C457.235,138.355,457.235,128.056,458.61,128.056C459.984,128.056,459.984,111.122,461.359,111.122C462.733,111.122,462.733,105.204,464.108,105.204C465.483,105.204,465.483,99.492,466.857,99.492C468.232,99.492,468.232,101.656,469.606,101.656C470.981,101.656,470.981,103.384,472.355,103.384C473.73,103.384,473.73,96.287,475.105,96.287C476.479,96.287,476.479,93.405,477.854,93.405C479.228,93.405,479.228,92.726,480.603,92.726C481.977,92.726,481.977,97.251,483.352,97.251C484.726,97.251,484.726,94.228,486.101,94.228C487.476,94.228,487.476,97.25,488.85,97.25C490.225,97.25,490.225,103.275,491.599,103.275C492.974,103.275,492.974,102.618,494.348,102.618C495.723,102.618,495.723,101.993,497.098,101.993C498.472,101.993,498.472,94.162,499.847,94.162C501.221,94.162,501.221,98.365,502.596,98.365C503.97,98.365,503.97,101.213,505.345,101.213C506.72,101.213,506.72,104.549,508.094,104.549C509.469,104.549,509.469,105.376,510.843,105.376C512.218,105.376,512.218,121.462,513.592,121.462C514.967,121.462,514.967,119.194,516.341,119.194C517.716,119.194,517.716,142.102,519.091,142.102C520.465,142.102,520.465,159.384,521.84,159.384C523.214,159.384,523.214,155.733,524.589,155.733C525.963,155.733,525.963,143.47,527.338,143.47C528.713,143.47,528.713,152.327,530.087,152.327C531.462,152.327,531.462,143.853,532.836,143.853C534.211,143.853,534.211,128.485,535.585,128.485C536.96,128.485,536.96,135.947,538.334,135.947C539.709,135.947,539.709,122.736,541.084,122.736C542.458,122.736,542.458,120.296,543.833,120.296C545.207,120.296,545.207,117.09,546.582,117.09C547.956,117.09,547.956,113.957,549.331,113.957C550.706,113.957,550.706,112.844,552.08,112.844C553.455,112.844,553.455,117.442,554.829,117.442C556.204,117.442,556.204,130.026,557.578,130.026C558.953,130.026,558.953,147.339,560.328,147.339C561.702,147.339,561.702,132.833,563.077,132.833C564.451,132.833,564.451,127.678,565.826,127.678C567.2,127.678,567.2,121.849,568.575,121.849C569.949,121.849,569.949,119.456,571.324,119.456C572.699,119.456,572.699,118.239,574.073,118.239C575.448,118.239,575.448,125.708,576.822,125.708C578.197,125.708,578.197,124.942,579.571,124.942C580.946,124.942,580.946,126.774,582.321,126.774C583.695,126.774,583.695,136.809,585.07,136.809C586.444,136.809,586.444,146.069,587.819,146.069C589.193,146.069,589.193,128.037,590.568,128.037C591.943,128.037,591.943,120.453,593.317,120.453C594.692,120.453,594.692,116.147,596.066,116.147C597.441,116.147,597.441,122.234,598.815,122.234C600.19,122.234,600.19,105.445,601.564,105.445C602.939,105.445,602.939,102.53,604.314,102.53C605.688,102.53,605.688,102.545,607.063,102.545C608.437,102.545,608.437,101.899,609.812,101.899C611.186,101.899,611.186,110.5,612.561,110.5C613.936,110.5,613.936,117.417,615.31,117.417C616.685,117.417,616.685,123.085,618.059,123.085C619.434,123.085,619.434,103.232,620.808,103.232C622.183,103.232,622.183,107.991,623.557,107.991C624.932,107.991,624.932,98.645,626.307,98.645C627.681,98.645,627.681,109.543,629.056,109.543C630.43,109.543,630.43,116.699,631.805,116.699C633.179,116.699,633.179,116.298,634.554,116.298C635.929,116.298,635.929,106.6,637.303,106.6C638.678,106.6,638.678,105.981,640.052,105.981C641.427,105.981,641.427,94.437,642.801,94.437C644.176,94.437,644.176,104.363,645.551,104.363C646.925,104.363,646.925,84.16,648.3,84.16C649.674,84.16,649.674,76.179,651.049,76.179C652.423,76.179,652.423,84.602,653.798,84.602C655.172,84.602,655.172,101.896,656.547,101.896C657.922,101.896,657.922,99.494,659.296,99.494C660.671,99.494,660.671,102.819,662.045,102.819C663.42,102.819,663.42,91.56,664.794,91.56C666.169,91.56,666.169,98.02,667.544,98.02C668.918,98.02,668.918,104.269,670.293,104.269C671.667,104.269,671.667,96.135,673.042,96.135C674.416,96.135,674.416,83.526,675.791,83.526C677.166,83.526,677.166,94.393,678.54,94.393C679.915,94.393,679.915,98.529,681.289,98.529C682.664,98.529,682.664,123.411,684.038,123.411C685.413,123.411,685.413,133.536,686.787,133.536C688.162,133.536,688.162,122.45,689.537,122.45C690.911,122.45,690.911,136.709,692.286,136.709C693.66,136.709,693.66,139.679,695.035,139.679C696.409,139.679,696.409,133.128,697.784,133.128C699.159,133.128,699.159,139.953,700.533,139.953C701.908,139.953,701.908,152.808,703.282,152.808C704.657,152.808,704.657,134.072,706.031,134.072C707.406,134.072,707.406,132.615,708.78,132.615C710.155,132.615,710.155,124.977,711.53,124.977C712.904,124.977,712.904,123.884,714.279,123.884C715.653,123.884,715.653,123.949,717.028,123.949C718.402,123.949,718.402,129.693,719.777,129.693C721.152,129.693,721.152,138.615,722.526,138.615C723.901,138.615,723.901,155.607,725.275,155.607C726.65,155.607,726.65,156.791,728.024,156.791C729.399,156.791,729.399,161.754,730.774,161.754C732.148,161.754,732.148,148.972,733.523,148.972C734.897,148.972,734.897,130.173,736.272,130.173C737.646,130.173,737.646,132.174,739.021,132.174C740.395,132.174,740.395,127.795,741.77,127.795C743.145,127.795,743.145,129.053,744.519,129.053C745.894,129.053,745.894,123.779,747.268,123.779C748.643,123.779,748.643,117.277,750.017,117.277C751.392,117.277,751.392,120.747,752.767,120.747C754.141,120.747,754.141,109.813,755.516,109.813C756.89,109.813,756.89,123.299,758.265,123.299C759.639,123.299,759.639,128.109,761.014,128.109C762.389,128.109,762.389,121.284,763.763,121.284C765.138,121.284,765.138,113.294,766.512,113.294C767.887,113.294,767.887,118.941,769.261,118.941C770.636,118.941,770.636,115.035,772.01,115.035C773.385,115.035,773.385,123.289,774.76,123.289C776.134,123.289,776.134,124.571,777.509,124.571C778.883,124.571,778.883,118.161,780.258,118.161C781.632,118.161,781.632,123.96,783.007,123.96C784.382,123.96,784.382,120.028,785.756,120.028C787.131,120.028,787.131,107.315,788.505,107.315C789.88,107.315,789.88,112.086,791.254,112.086C792.629,112.086,792.629,119.223,794.003,119.223C795.378,119.223,795.378,115.805,796.753,115.805C798.127,115.805,798.127,114.871,799.502,114.871C800.876,114.871,800.876,105.534,802.251,105.534C803.625,105.534,803.625,101.274,805,101.274L805,3770.1C803.625,3770.1,803.625,3770.1,802.251,3770.1C800.876,3770.1,800.876,3770.1,799.502,3770.1C798.127,3770.1,798.127,3770.1,796.753,3770.1C795.378,3770.1,795.378,3770.1,794.003,3770.1C792.629,3770.1,792.629,3770.1,791.254,3770.1C789.88,3770.1,789.88,3770.1,788.505,3770.1C787.131,3770.1,787.131,3770.1,785.756,3770.1C784.382,3770.1,784.382,3770.1,783.007,3770.1C781.632,3770.1,781.632,3770.1,780.258,3770.1C778.883,3770.1,778.883,3770.1,777.509,3770.1C776.134,3770.1,776.134,3770.1,774.76,3770.1C773.385,3770.1,773.385,3770.1,772.01,3770.1C770.636,3770.1,770.636,3770.1,769.261,3770.1C767.887,3770.1,767.887,3770.1,766.512,3770.1C765.138,3770.1,765.138,3770.1,763.763,3770.1C762.389,3770.1,762.389,3770.1,761.014,3770.1C759.639,3770.1,759.639,3770.1,758.265,3770.1C756.89,3770.1,756.89,3770.1,755.516,3770.1C754.141,3770.1,754.141,3770.1,752.767,3770.1C751.392,3770.1,751.392,3770.1,750.017,3770.1C748.643,3770.1,748.643,3770.1,747.268,3770.1C745.894,3770.1,745.894,3770.1,744.519,3770.1C743.145,3770.1,743.145,3770.1,741.77,3770.1C740.395,3770.1,740.395,3770.1,739.021,3770.1C737.646,3770.1,737.646,3770.1,736.272,3770.1C734.897,3770.1,734.897,3770.1,733.523,3770.1C732.148,3770.1,732.148,3770.1,730.774,3770.1C729.399,3770.1,729.399,3770.1,728.024,3770.1C726.65,3770.1,726.65,3770.1,725.275,3770.1C723.901,3770.1,723.901,3770.1,722.526,3770.1C721.152,3770.1,721.152,3770.1,719.777,3770.1C718.402,3770.1,718.402,3770.1,717.028,3770.1C715.653,3770.1,715.653,3770.1,714.279,3770.1C712.904,3770.1,712.904,3770.1,711.53,3770.1C710.155,3770.1,710.155,3770.1,708.78,3770.1C707.406,3770.1,707.406,3770.1,706.031,3770.1C704.657,3770.1,704.657,3770.1,703.282,3770.1C701.908,3770.1,701.908,3770.1,700.533,3770.1C699.159,3770.1,699.159,3770.1,697.784,3770.1C696.409,3770.1,696.409,3770.1,695.035,3770.1C693.66,3770.1,693.66,3770.1,692.286,3770.1C690.911,3770.1,690.911,3770.1,689.537,3770.1C688.162,3770.1,688.162,3770.1,686.787,3770.1C685.413,3770.1,685.413,3770.1,684.038,3770.1C682.664,3770.1,682.664,3770.1,681.289,3770.1C679.915,3770.1,679.915,3770.1,678.54,3770.1C677.166,3770.1,677.166,3770.1,675.791,3770.1C674.416,3770.1,674.416,3770.1,673.042,3770.1C671.667,3770.1,671.667,3770.1,670.293,3770.1C668.918,3770.1,668.918,3770.1,667.544,3770.1C666.169,3770.1,666.169,3770.1,664.794,3770.1C663.42,3770.1,663.42,3770.1,662.045,3770.1C660.671,3770.1,660.671,3770.1,659.296,3770.1C657.922,3770.1,657.922,3770.1,656.547,3770.1C655.172,3770.1,655.172,3770.1,653.798,3770.1C652.423,3770.1,652.423,3770.1,651.049,3770.1C649.674,3770.1,649.674,3770.1,648.3,3770.1C646.925,3770.1,646.925,3770.1,645.551,3770.1C644.176,3770.1,644.176,3770.1,642.801,3770.1C641.427,3770.1,641.427,3770.1,640.052,3770.1C638.678,3770.1,638.678,3770.1,637.303,3770.1C635.929,3770.1,635.929,3770.1,634.554,3770.1C633.179,3770.1,633.179,3770.1,631.805,3770.1C630.43,3770.1,630.43,3770.1,629.056,3770.1C627.681,3770.1,627.681,3770.1,626.307,3770.1C624.932,3770.1,624.932,3770.1,623.557,3770.1C622.183,3770.1,622.183,3770.1,620.808,3770.1C619.434,3770.1,619.434,3770.1,618.059,3770.1C616.685,3770.1,616.685,3770.1,615.31,3770.1C613.936,3770.1,613.936,3770.1,612.561,3770.1C611.186,3770.1,611.186,3770.1,609.812,3770.1C608.437,3770.1,608.437,3770.1,607.063,3770.1C605.688,3770.1,605.688,3770.1,604.314,3770.1C602.939,3770.1,602.939,3770.1,601.564,3770.1C600.19,3770.1,600.19,3770.1,598.815,3770.1C597.441,3770.1,597.441,3770.1,596.066,3770.1C594.692,3770.1,594.692,3770.1,593.317,3770.1C591.943,3770.1,591.943,3770.1,590.568,3770.1C589.193,3770.1,589.193,3770.1,587.819,3770.1C586.444,3770.1,586.444,3770.1,585.07,3770.1C583.695,3770.1,583.695,3770.1,582.321,3770.1C580.946,3770.1,580.946,3770.1,579.571,3770.1C578.197,3770.1,578.197,3770.1,576.822,3770.1C575.448,3770.1,575.448,3770.1,574.073,3770.1C572.699,3770.1,572.699,3770.1,571.324,3770.1C569.949,3770.1,569.949,3770.1,568.575,3770.1C567.2,3770.1,567.2,3770.1,565.826,3770.1C564.451,3770.1,564.451,3770.1,563.077,3770.1C561.702,3770.1,561.702,3770.1,560.328,3770.1C558.953,3770.1,558.953,3770.1,557.578,3770.1C556.204,3770.1,556.204,3770.1,554.829,3770.1C553.455,3770.1,553.455,3770.1,552.08,3770.1C550.706,3770.1,550.706,3770.1,549.331,3770.1C547.956,3770.1,547.956,3770.1,546.582,3770.1C545.207,3770.1,545.207,3770.1,543.833,3770.1C542.458,3770.1,542.458,3770.1,541.084,3770.1C539.709,3770.1,539.709,3770.1,538.334,3770.1C536.96,3770.1,536.96,3770.1,535.585,3770.1C534.211,3770.1,534.211,3770.1,532.836,3770.1C531.462,3770.1,531.462,3770.1,530.087,3770.1C528.713,3770.1,528.713,3770.1,527.338,3770.1C525.963,3770.1,525.963,3770.1,524.589,3770.1C523.214,3770.1,523.214,3770.1,521.84,3770.1C520.465,3770.1,520.465,3770.1,519.091,3770.1C517.716,3770.1,517.716,3770.1,516.341,3770.1C514.967,3770.1,514.967,3770.1,513.592,3770.1C512.218,3770.1,512.218,3770.1,510.843,3770.1C509.469,3770.1,509.469,3770.1,508.094,3770.1C506.72,3770.1,506.72,3770.1,505.345,3770.1C503.97,3770.1,503.97,3770.1,502.596,3770.1C501.221,3770.1,501.221,3770.1,499.847,3770.1C498.472,3770.1,498.472,3770.1,497.098,3770.1C495.723,3770.1,495.723,3770.1,494.348,3770.1C492.974,3770.1,492.974,3770.1,491.599,3770.1C490.225,3770.1,490.225,3770.1,488.85,3770.1C487.476,3770.1,487.476,3770.1,486.101,3770.1C484.726,3770.1,484.726,3770.1,483.352,3770.1C481.977,3770.1,481.977,3770.1,480.603,3770.1C479.228,3770.1,479.228,3770.1,477.854,3770.1C476.479,3770.1,476.479,3770.1,475.105,3770.1C473.73,3770.1,473.73,3770.1,472.355,3770.1C470.981,3770.1,470.981,3770.1,469.606,3770.1C468.232,3770.1,468.232,3770.1,466.857,3770.1C465.483,3770.1,465.483,3770.1,464.108,3770.1C462.733,3770.1,462.733,3770.1,461.359,3770.1C459.984,3770.1,459.984,3770.1,458.61,3770.1C457.235,3770.1,457.235,3770.1,455.861,3770.1C454.486,3770.1,454.486,3770.1,453.111,3770.1C451.737,3770.1,451.737,3770.1,450.362,3770.1C448.988,3770.1,448.988,3770.1,447.613,3770.1C446.239,3770.1,446.239,3770.1,444.864,3770.1C443.49,3770.1,443.49,3770.1,442.115,3770.1C440.74,3770.1,440.74,3770.1,439.366,3770.1C437.991,3770.1,437.991,3770.1,436.617,3770.1C435.242,3770.1,435.242,3770.1,433.868,3770.1C432.493,3770.1,432.493,3770.1,431.118,3770.1C429.744,3770.1,429.744,3770.1,428.369,3770.1C426.995,3770.1,426.995,3770.1,425.62,3770.1C424.246,3770.1,424.246,3770.1,422.871,3770.1C421.497,3770.1,421.497,3770.1,420.122,3770.1C418.747,3770.1,418.747,3770.1,417.373,3770.1C415.998,3770.1,415.998,3770.1,414.624,3770.1C413.249,3770.1,413.249,3770.1,411.875,3770.1C410.5,3770.1,410.5,3770.1,409.125,3770.1C407.751,3770.1,407.751,3770.1,406.376,3770.1C405.002,3770.1,405.002,3770.1,403.627,3770.1C402.253,3770.1,402.253,3770.1,400.878,3770.1C399.503,3770.1,399.503,3770.1,398.129,3770.1C396.754,3770.1,396.754,3770.1,395.38,3770.1C394.005,3770.1,394.005,3770.1,392.631,3770.1C391.256,3770.1,391.256,3770.1,389.882,3770.1C388.507,3770.1,388.507,3770.1,387.132,3770.1C385.758,3770.1,385.758,3770.1,384.383,3770.1C383.009,3770.1,383.009,3770.1,381.634,3770.1C380.26,3770.1,380.26,3770.1,378.885,3770.1C377.51,3770.1,377.51,3770.1,376.136,3770.1C374.761,3770.1,374.761,3770.1,373.387,3770.1C372.012,3770.1,372.012,3770.1,370.638,3770.1C369.263,3770.1,369.263,3770.1,367.889,3770.1C366.514,3770.1,366.514,3770.1,365.139,3770.1C363.765,3770.1,363.765,3770.1,362.39,3770.1C361.016,3770.1,361.016,3770.1,359.641,3770.1C358.267,3770.1,358.267,3770.1,356.892,3770.1C355.517,3770.1,355.517,3770.1,354.143,3770.1C352.768,3770.1,352.768,3770.1,351.394,3770.1C350.019,3770.1,350.019,3770.1,348.645,3770.1C347.27,3770.1,347.27,3770.1,345.895,3770.1C344.521,3770.1,344.521,3770.1,343.146,3770.1C341.772,3770.1,341.772,3770.1,340.397,3770.1C339.023,3770.1,339.023,3770.1,337.648,3770.1C336.274,3770.1,336.274,3770.1,334.899,3770.1C333.524,3770.1,333.524,3770.1,332.15,3770.1C330.775,3770.1,330.775,3770.1,329.401,3770.1C328.026,3770.1,328.026,3770.1,326.652,3770.1C325.277,3770.1,325.277,3770.1,323.902,3770.1C322.528,3770.1,322.528,3770.1,321.153,3770.1C319.779,3770.1,319.779,3770.1,318.404,3770.1C317.03,3770.1,317.03,3770.1,315.655,3770.1C314.28,3770.1,314.28,3770.1,312.906,3770.1C311.531,3770.1,311.531,3770.1,310.157,3770.1C308.782,3770.1,308.782,3770.1,307.408,3770.1C306.033,3770.1,306.033,3770.1,304.659,3770.1C303.284,3770.1,303.284,3770.1,301.909,3770.1C300.535,3770.1,300.535,3770.1,299.16,3770.1C297.786,3770.1,297.786,3770.1,296.411,3770.1C295.037,3770.1,295.037,3770.1,293.662,3770.1C292.287,3770.1,292.287,3770.1,290.913,3770.1C289.538,3770.1,289.538,3770.1,288.164,3770.1C286.789,3770.1,286.789,3770.1,285.415,3770.1C284.04,3770.1,284.04,3770.1,282.666,3770.1C281.291,3770.1,281.291,3770.1,279.916,3770.1C278.542,3770.1,278.542,3770.1,277.167,3770.1C275.793,3770.1,275.793,3770.1,274.418,3770.1C273.044,3770.1,273.044,3770.1,271.669,3770.1C270.294,3770.1,270.294,3770.1,268.92,3770.1C267.545,3770.1,267.545,3770.1,266.171,3770.1C264.796,3770.1,264.796,3770.1,263.422,3770.1C262.047,3770.1,262.047,3770.1,260.672,3770.1C259.298,3770.1,259.298,3770.1,257.923,3770.1C256.549,3770.1,256.549,3770.1,255.174,3770.1C253.8,3770.1,253.8,3770.1,252.425,3770.1C251.051,3770.1,251.051,3770.1,249.676,3770.1C248.301,3770.1,248.301,3770.1,246.927,3770.1C245.552,3770.1,245.552,3770.1,244.178,3770.1C242.803,3770.1,242.803,3770.1,241.429,3770.1C240.054,3770.1,240.054,3770.1,238.679,3770.1C237.305,3770.1,237.305,3770.1,235.93,3770.1C234.556,3770.1,234.556,3770.1,233.181,3770.1C231.807,3770.1,231.807,3770.1,230.432,3770.1C229.057,3770.1,229.057,3770.1,227.683,3770.1C226.308,3770.1,226.308,3770.1,224.934,3770.1C223.559,3770.1,223.559,3770.1,222.185,3770.1C220.81,3770.1,220.81,3770.1,219.436,3770.1C218.061,3770.1,218.061,3770.1,216.686,3770.1C215.312,3770.1,215.312,3770.1,213.937,3770.1C212.563,3770.1,212.563,3770.1,211.188,3770.1C209.814,3770.1,209.814,3770.1,208.439,3770.1C207.064,3770.1,207.064,3770.1,205.69,3770.1C204.315,3770.1,204.315,3770.1,202.941,3770.1C201.566,3770.1,201.566,3770.1,200.192,3770.1C198.817,3770.1,198.817,3770.1,197.443,3770.1C196.068,3770.1,196.068,3770.1,194.693,3770.1C193.319,3770.1,193.319,3770.1,191.944,3770.1C190.57,3770.1,190.57,3770.1,189.195,3770.1C187.821,3770.1,187.821,3770.1,186.446,3770.1C185.071,3770.1,185.071,3770.1,183.697,3770.1C182.322,3770.1,182.322,3770.1,180.948,3770.1C179.573,3770.1,179.573,3770.1,178.199,3770.1C176.824,3770.1,176.824,3770.1,175.449,3770.1C174.075,3770.1,174.075,3770.1,172.7,3770.1C171.326,3770.1,171.326,3770.1,169.951,3770.1C168.577,3770.1,168.577,3770.1,167.202,3770.1C165.828,3770.1,165.828,3770.1,164.453,3770.1C163.078,3770.1,163.078,3770.1,161.704,3770.1C160.329,3770.1,160.329,3770.1,158.955,3770.1C157.58,3770.1,157.58,3770.1,156.206,3770.1C154.831,3770.1,154.831,3770.1,153.456,3770.1C152.082,3770.1,152.082,3770.1,150.707,3770.1C149.333,3770.1,149.333,3770.1,147.958,3770.1C146.584,3770.1,146.584,3770.1,145.209,3770.1C143.834,3770.1,143.834,3770.1,142.46,3770.1C141.085,3770.1,141.085,3770.1,139.711,3770.1C138.336,3770.1,138.336,3770.1,136.962,3770.1C135.587,3770.1,135.587,3770.1,134.213,3770.1C132.838,3770.1,132.838,3770.1,131.463,3770.1C130.089,3770.1,130.089,3770.1,128.714,3770.1C127.34,3770.1,127.34,3770.1,125.965,3770.1C124.591,3770.1,124.591,3770.1,123.216,3770.1C121.841,3770.1,121.841,3770.1,120.467,3770.1C119.092,3770.1,119.092,3770.1,117.718,3770.1C116.343,3770.1,116.343,3770.1,114.969,3770.1C113.594,3770.1,113.594,3770.1,112.22,3770.1C110.845,3770.1,110.845,3770.1,109.47,3770.1C108.096,3770.1,108.096,3770.1,106.721,3770.1C105.347,3770.1,105.347,3770.1,103.972,3770.1C102.598,3770.1,102.598,3770.1,101.223,3770.1C99.848,3770.1,99.848,3770.1,98.474,3770.1C97.099,3770.1,97.099,3770.1,95.725,3770.1C94.35,3770.1,94.35,3770.1,92.976,3770.1C91.601,3770.1,91.601,3770.1,90.226,3770.1C88.852,3770.1,88.852,3770.1,87.477,3770.1C86.103,3770.1,86.103,3770.1,84.728,3770.1C83.354,3770.1,83.354,3770.1,81.979,3770.1C80.605,3770.1,80.605,3770.1,79.23,3770.1C77.855,3770.1,77.855,3770.1,76.481,3770.1C75.106,3770.1,75.106,3770.1,73.732,3770.1C72.357,3770.1,72.357,3770.1,70.983,3770.1C69.608,3770.1,69.608,3770.1,68.233,3770.1C66.859,3770.1,66.859,3770.1,65.484,3770.1C64.11,3770.1,64.11,3770.1,62.735,3770.1C61.361,3770.1,61.361,3770.1,59.986,3770.1C58.611,3770.1,58.611,3770.1,57.237,3770.1C55.862,3770.1,55.862,3770.1,54.488,3770.1C53.113,3770.1,53.113,3770.1,51.739,3770.1C50.364,3770.1,50.364,3770.1,48.99,3770.1C47.615,3770.1,47.615,3770.1,46.24,3770.1C44.866,3770.1,44.866,3770.1,43.491,3770.1C42.117,3770.1,42.117,3770.1,40.742,3770.1C39.368,3770.1,39.368,3770.1,37.993,3770.1C36.618,3770.1,36.618,3770.1,35.244,3770.1C33.869,3770.1,33.869,3770.1,32.495,3770.1C31.12,3770.1,31.12,3770.1,29.746,3770.1C28.371,3770.1,28.371,3770.1,26.997,3770.1C25.622,3770.1,25.622,3770.1,24.247,3770.1C22.873,3770.1,22.873,3770.1,21.498,3770.1C20.124,3770.1,20.124,3770.1,18.749,3770.1C17.375,3770.1,17.375,3770.1,16,3770.1Z',
    interpolated:
      'M16,117.388C17.073,117.388,17.457,120.949,18.528,120.949C19.599,120.949,19.982,121.587,21.052,121.587C22.121,121.587,22.503,123.924,23.571,123.924C24.639,123.924,25.019,122.755,26.086,122.755C27.152,122.755,27.53,127.343,28.596,127.343C29.661,127.343,30.038,124.229,31.101,124.229C32.165,124.229,32.54,126.09,33.603,126.09C34.665,126.09,35.039,124.583,36.1,124.583C37.161,124.583,37.533,117.819,38.592,117.819C39.652,117.819,40.023,125.042,41.08,125.042C42.138,125.042,42.508,123.669,43.564,123.669C44.621,123.669,44.989,125.774,46.044,125.774C47.099,125.774,47.466,127.711,48.519,127.711C49.573,127.711,49.938,124.012,50.99,124.012C52.042,124.012,52.406,125.434,53.457,125.434C54.507,125.434,54.87,120.864,55.919,120.864C56.969,120.864,57.33,118.56,58.378,118.56C59.426,118.56,59.785,120.532,60.831,120.532C61.878,120.532,62.237,114.183,63.281,114.183C64.326,114.183,64.683,114.777,65.727,114.777C66.771,114.777,67.126,112.146,68.169,112.146C69.211,112.146,69.565,115.532,70.606,115.532C71.647,115.532,71.999,109.141,73.039,109.141C74.079,109.141,74.43,107.691,75.468,107.691C76.507,107.691,76.857,109.902,77.893,109.902C78.93,109.902,79.279,110.359,80.314,110.359C81.35,110.359,81.697,110.264,82.731,110.264C83.765,110.264,84.111,113.087,85.144,113.087C86.177,113.087,86.521,111.12,87.553,111.12C88.584,111.12,88.927,105.437,89.958,105.437C90.987,105.437,91.329,106.096,92.358,106.096C93.387,106.096,93.728,107.797,94.755,107.797C96.123,107.797,96.8,109.194,98.162,109.194C99.525,109.194,100.197,104.62,101.554,104.62C102.911,104.62,103.578,102.423,104.931,102.423C106.282,102.423,106.944,105.176,108.291,105.176C109.638,105.176,110.295,100.33,111.637,100.33C112.978,100.33,113.63,100.189,114.967,100.189C116.304,100.189,116.951,101.011,118.283,101.011C119.615,101.011,120.257,101.582,121.583,101.582C122.91,101.582,123.547,101.363,124.869,101.363C126.191,101.363,126.824,103.512,128.141,103.512C129.458,103.512,130.085,103.739,131.398,103.739C132.71,103.739,133.333,103.358,134.641,103.358C135.948,103.358,136.566,105.785,137.869,105.785C139.172,105.785,139.786,109.532,141.084,109.532C142.382,109.532,142.991,113.59,144.285,113.59C145.579,113.59,146.183,112.287,147.472,112.287C148.762,112.287,149.361,114.208,150.646,114.208C151.931,114.208,152.526,109.081,153.806,109.081C155.087,109.081,155.677,107.921,156.953,107.921C158.229,107.921,158.816,105.46,160.087,105.46C161.359,105.46,161.941,111.59,163.208,111.59C164.475,111.59,165.053,109.456,166.316,109.456C167.579,109.456,168.153,108.117,169.412,108.117C170.671,108.117,171.24,107.802,172.494,107.802C173.749,107.802,174.314,105.649,175.565,105.649C176.815,105.649,177.377,103.745,178.623,103.745C179.869,103.745,180.427,106.068,181.669,106.068C182.911,106.068,183.464,105.571,184.703,105.571C185.941,105.571,186.491,107.676,187.725,107.676C188.96,107.676,189.505,119.487,190.736,119.487C191.967,119.487,192.508,121.984,193.734,121.984C194.962,121.984,195.499,129.362,196.722,129.362C197.945,129.362,198.479,128.146,199.698,128.146C200.917,128.146,201.448,121.599,202.663,121.599C203.879,121.599,204.405,121.641,205.617,121.641C206.829,121.641,207.352,114.531,208.561,114.531C209.769,114.531,210.288,114.298,211.493,114.298C212.697,114.298,213.213,115.378,214.415,115.378C215.616,115.378,216.128,120.497,217.326,120.497C218.524,120.497,219.033,122.821,220.227,122.821C221.422,122.821,221.927,126.127,223.118,126.127C224.309,126.127,224.811,120.417,225.999,120.417C227.187,120.417,227.686,119.439,228.87,119.439C230.055,119.439,230.55,115.643,231.732,115.643C232.913,115.643,233.405,113.055,234.583,113.055C235.761,113.055,236.25,111.437,237.426,111.437C238.601,111.437,239.087,110.446,240.258,110.446C241.431,110.446,241.914,112.475,243.082,112.475C244.251,112.475,244.731,109.818,245.897,109.818C247.063,109.818,247.54,110.015,248.703,110.015C249.866,110.015,250.34,113.679,251.5,113.679C252.66,113.679,253.131,113.34,254.289,113.34C255.446,113.34,255.914,112.337,257.069,112.337C258.223,112.337,258.689,112.331,259.84,112.331C260.992,112.331,261.455,110.188,262.604,110.188C263.753,110.188,264.213,109.23,265.359,109.23C266.506,109.23,266.964,109.151,268.107,109.151C269.251,109.151,269.706,109.183,270.847,109.183C271.988,109.183,272.441,109.89,273.579,109.89C274.718,109.89,275.168,114.874,276.304,114.874C277.44,114.874,277.888,116.83,279.021,116.83C280.155,116.83,280.601,120.588,281.732,120.588C282.863,120.588,283.306,117.094,284.435,117.094C285.564,117.094,286.005,113.187,287.131,113.187C288.258,113.187,288.696,116.605,289.821,116.605C290.945,116.605,291.381,115.276,292.504,115.276C293.626,115.276,294.06,108.85,295.18,108.85C296.3,108.85,296.732,109.548,297.85,109.548C298.968,109.548,299.397,100.649,300.514,100.649C301.63,100.649,302.058,104.739,303.171,104.739C304.286,104.739,304.711,97.883,305.823,97.883C306.935,97.883,307.359,101.968,308.469,101.968C309.58,101.968,310.001,105.479,311.11,105.479C312.218,105.479,312.638,107.862,313.745,107.862C314.851,107.862,315.269,107.915,316.374,107.915C317.479,107.915,317.895,108.92,318.999,108.92C320.101,108.92,320.516,114.022,321.618,114.022C322.719,114.022,323.132,111.707,324.232,111.707C325.332,111.707,325.743,111.803,326.841,111.803C327.94,111.803,328.35,114.239,329.446,114.239C330.543,114.239,330.952,115.709,332.047,115.709C333.142,115.709,333.549,116.241,334.643,116.241C335.736,116.241,336.142,108.672,337.234,108.672C338.326,108.672,338.731,111.07,339.822,111.07C340.913,111.07,341.316,107.377,342.406,107.377C343.496,107.377,343.897,107.439,344.985,107.439C346.074,107.439,346.475,107.764,347.562,107.764C348.649,107.764,349.048,111.828,350.134,111.828C351.22,111.828,351.619,123.388,352.704,123.388C353.789,123.388,354.186,121.757,355.27,121.757C356.353,121.757,356.75,126.762,357.833,126.762C358.915,126.762,359.31,128.259,360.393,128.259C361.475,128.259,361.869,122.025,362.95,122.025C364.031,122.025,364.424,123.888,365.504,123.888C366.585,123.888,366.977,126.082,368.056,126.082C369.136,126.082,369.527,124.736,370.606,124.736C371.684,124.736,372.075,121.437,373.153,121.437C374.231,121.437,374.621,119.12,375.698,119.12C376.775,119.12,377.165,121.466,378.241,121.466C379.318,121.466,379.707,126.623,380.783,126.623C381.859,126.623,382.247,127.09,383.322,127.09C384.398,127.09,384.786,135.852,385.86,135.852C386.935,135.852,387.323,140.16,388.397,140.16C389.472,140.16,389.859,143.608,390.933,143.608C392.007,143.608,392.393,138.915,393.467,138.915C394.541,138.915,394.927,144.171,396,144.171C397.073,144.171,397.459,155.126,398.533,155.126C399.606,155.126,399.991,164.026,401.064,164.026C402.138,164.026,402.523,170.745,403.596,170.745C404.669,170.745,405.054,167.164,406.126,167.164C407.199,167.164,407.584,163.98,408.657,163.98C409.729,163.98,410.115,163.522,411.188,163.522C412.26,163.522,412.645,149.405,413.718,149.405C414.79,149.405,415.175,145.1,416.248,145.1C417.321,145.1,417.706,139.171,418.779,139.171C419.852,139.171,420.237,144.725,421.31,144.725C422.383,144.725,422.769,145.189,423.842,145.189C424.915,145.189,425.301,149.796,426.374,149.796C427.448,149.796,427.834,155.634,428.907,155.634C429.981,155.634,430.368,154.602,431.442,154.602C432.516,154.602,432.903,144.862,433.977,144.862C435.052,144.862,435.439,136.363,436.514,136.363C437.589,136.363,437.977,141.686,439.052,141.686C440.128,141.686,440.516,143.311,441.592,143.311C442.668,143.311,443.057,143.824,444.133,143.824C445.21,143.824,445.599,147.048,446.676,147.048C447.754,147.048,448.144,138.808,449.221,138.808C450.299,138.808,450.69,136.428,451.769,136.428C452.847,136.428,453.239,131.278,454.318,131.278C455.398,131.278,455.79,122.811,456.87,122.811C457.95,122.811,458.344,119.852,459.425,119.852C460.506,119.852,460.9,116.996,461.982,116.996C463.064,116.996,463.459,118.078,464.542,118.078C465.625,118.078,466.021,118.942,467.105,118.942C468.189,118.942,468.586,115.394,469.671,115.394C470.756,115.394,471.154,113.953,472.24,113.953C473.326,113.953,473.725,113.613,474.813,113.613C475.9,113.613,476.3,115.876,477.389,115.876C478.477,115.876,478.879,114.364,479.969,114.364C481.059,114.364,481.462,115.875,482.553,115.875C483.644,115.875,484.048,118.888,485.14,118.888C486.233,118.888,486.638,118.559,487.732,118.559C488.826,118.559,489.233,118.247,490.328,118.247C491.423,118.247,491.832,114.331,492.928,114.331C494.025,114.331,494.435,116.433,495.533,116.433C496.631,116.433,497.043,117.857,498.143,117.857C499.243,117.857,499.656,119.525,500.757,119.525C501.858,119.525,502.273,119.938,503.376,119.938C504.479,119.938,504.896,127.981,506,127.981C507.105,127.981,507.523,126.847,508.63,126.847C509.736,126.847,510.157,138.301,511.265,138.301C512.373,138.301,512.795,146.942,513.905,146.942C515.015,146.942,515.439,145.117,516.551,145.117C517.663,145.117,518.089,138.985,519.203,138.985C520.317,138.985,520.745,143.414,521.861,143.414C522.977,143.414,523.407,139.177,524.525,139.177C525.643,139.177,526.075,131.493,527.194,131.493C528.315,131.493,528.749,135.224,529.871,135.224C530.993,135.224,531.429,128.618,532.554,128.618C533.678,128.618,534.117,127.398,535.244,127.398C536.37,127.398,536.811,125.795,537.94,125.795C539.068,125.795,539.511,124.229,540.643,124.229C541.774,124.229,542.22,123.672,543.353,123.672C544.487,123.672,544.935,125.971,546.07,125.971C547.207,125.971,547.657,132.263,548.795,132.263C549.934,132.263,550.386,140.92,551.528,140.92C552.669,140.92,553.124,133.666,554.268,133.666C555.411,133.666,555.869,131.089,557.015,131.089C558.161,131.089,558.621,128.175,559.771,128.175C560.919,128.175,561.382,126.978,562.534,126.978C563.686,126.978,564.152,126.37,565.306,126.37C566.46,126.37,566.929,130.104,568.086,130.104C569.243,130.104,569.714,129.721,570.874,129.721C572.034,129.721,572.509,130.637,573.672,130.637C574.834,130.637,575.312,135.654,576.478,135.654C577.643,135.654,578.123,140.284,579.292,140.284C580.461,140.284,580.944,131.269,582.116,131.269C583.288,131.269,583.774,127.477,584.949,127.477C586.124,127.477,586.613,125.324,587.791,125.324C588.969,125.324,589.462,128.367,590.643,128.367C591.824,128.367,592.32,119.973,593.504,119.973C594.689,119.973,595.188,118.515,596.376,118.515C597.563,118.515,598.065,118.523,599.257,118.523C600.447,118.523,600.953,118.2,602.147,118.2C603.342,118.2,603.85,122.5,605.048,122.5C606.247,122.5,606.759,125.959,607.96,125.959C609.161,125.959,609.677,128.792,610.882,128.792C612.087,128.792,612.606,118.866,613.814,118.866C615.023,118.866,615.545,121.246,616.757,121.246C617.969,121.246,618.496,116.572,619.712,116.572C620.927,116.572,621.457,122.022,622.677,122.022C623.896,122.022,624.429,125.6,625.653,125.6C626.875,125.6,627.413,125.399,628.64,125.399C629.867,125.399,630.408,120.55,631.639,120.55C632.87,120.55,633.415,120.241,634.649,120.241C635.884,120.241,636.433,114.469,637.671,114.469C638.91,114.469,639.463,119.432,640.706,119.432C641.948,119.432,642.505,109.33,643.752,109.33C644.998,109.33,645.559,105.34,646.81,105.34C648.06,105.34,648.625,109.551,649.88,109.551C651.135,109.551,651.704,118.198,652.963,118.198C654.222,118.198,654.796,116.997,656.058,116.997C657.322,116.997,657.899,118.66,659.166,118.66C660.434,118.66,661.016,113.03,662.287,113.03C663.559,113.03,664.145,116.26,665.422,116.26C666.697,116.26,667.288,119.385,668.568,119.385C669.849,119.385,670.444,115.318,671.729,115.318C673.013,115.318,673.613,109.013,674.902,109.013C676.192,109.013,676.796,114.447,678.09,114.447C679.384,114.447,679.992,116.515,681.29,116.515C682.589,116.515,683.202,128.956,684.505,128.956C685.808,128.956,686.426,134.018,687.734,134.018C689.042,134.018,689.664,128.475,690.977,128.475C692.289,128.475,692.917,135.605,694.234,135.605C695.551,135.605,696.183,137.09,697.505,137.09C698.827,137.09,699.464,133.814,700.791,133.814C702.118,133.814,702.76,137.227,704.092,137.227C705.424,137.227,706.071,143.654,707.407,143.654C708.744,143.654,709.396,134.286,710.738,134.286C712.08,134.286,712.737,133.558,714.083,133.558C715.43,133.558,716.092,129.738,717.444,129.738C718.796,129.738,719.463,129.192,720.82,129.192C722.177,129.192,722.85,129.225,724.212,129.225C725.574,129.225,726.252,132.097,727.619,132.097C728.987,132.097,729.67,136.558,731.042,136.558C732.073,136.558,732.416,145.054,733.447,145.054C734.479,145.054,734.823,145.646,735.856,145.646C736.889,145.646,737.235,148.127,738.269,148.127C739.303,148.127,739.65,141.736,740.686,141.736C741.721,141.736,742.07,132.337,743.107,132.337C744.143,132.337,744.493,133.337,745.532,133.337C746.57,133.337,746.921,131.148,747.961,131.148C749.001,131.148,749.353,131.777,750.394,131.777C751.435,131.777,751.789,129.14,752.831,129.14C753.874,129.14,754.229,125.889,755.273,125.889C756.317,125.889,756.674,127.624,757.719,127.624C758.763,127.624,759.122,122.157,760.169,122.157C761.215,122.157,761.574,128.899,762.622,128.899C763.67,128.899,764.031,131.305,765.081,131.305C766.13,131.305,766.493,127.892,767.543,127.892C768.594,127.892,768.958,123.897,770.01,123.897C771.062,123.897,771.427,126.721,772.481,126.721C773.534,126.721,773.901,124.768,774.956,124.768C776.011,124.768,776.379,128.895,777.436,128.895C778.492,128.895,778.862,129.536,779.92,129.536C780.977,129.536,781.348,126.331,782.408,126.331C783.467,126.331,783.839,129.23,784.9,129.23C785.961,129.23,786.335,127.264,787.397,127.264C788.46,127.264,788.835,120.908,789.899,120.908C790.962,120.908,791.339,123.293,792.404,123.293C793.47,123.293,793.848,126.862,794.914,126.862C795.981,126.862,796.361,125.153,797.429,125.153C798.497,125.153,798.879,124.685,799.948,124.685C801.018,124.685,801.401,120.017,802.472,120.017C803.543,120.017,803.927,117.887,805,117.887C805,741.775,805,1365.662,805,1989.55C803.927,1989.55,803.543,1989.55,802.472,1989.55C801.401,1989.55,801.018,1989.55,799.948,1989.55C798.879,1989.55,798.497,1989.55,797.429,1989.55C796.361,1989.55,795.981,1989.55,794.914,1989.55C793.848,1989.55,793.47,1989.55,792.404,1989.55C791.339,1989.55,790.962,1989.55,789.899,1989.55C788.835,1989.55,788.46,1989.55,787.397,1989.55C786.335,1989.55,785.961,1989.55,784.9,1989.55C783.839,1989.55,783.467,1989.55,782.408,1989.55C781.348,1989.55,780.977,1989.55,779.92,1989.55C778.862,1989.55,778.492,1989.55,777.436,1989.55C776.379,1989.55,776.011,1989.55,774.956,1989.55C773.901,1989.55,773.534,1989.55,772.481,1989.55C771.427,1989.55,771.062,1989.55,770.01,1989.55C768.958,1989.55,768.594,1989.55,767.543,1989.55C766.493,1989.55,766.13,1989.55,765.081,1989.55C764.031,1989.55,763.67,1989.55,762.622,1989.55C761.574,1989.55,761.215,1989.55,760.169,1989.55C759.122,1989.55,758.763,1989.55,757.719,1989.55C756.674,1989.55,756.317,1989.55,755.273,1989.55C754.229,1989.55,753.874,1989.55,752.831,1989.55C751.789,1989.55,751.435,1989.55,750.394,1989.55C749.353,1989.55,749.001,1989.55,747.961,1989.55C746.921,1989.55,746.57,1989.55,745.532,1989.55C744.493,1989.55,744.143,1989.55,743.107,1989.55C742.07,1989.55,741.721,1989.55,740.686,1989.55C739.65,1989.55,739.303,1989.55,738.269,1989.55C737.235,1989.55,736.889,1989.55,735.856,1989.55C734.823,1989.55,734.479,1989.55,733.447,1989.55C732.416,1989.55,732.073,1989.55,731.042,1989.55C730.013,1989.55,729.671,1989.55,728.642,1989.55C727.613,1989.55,727.272,1989.55,726.245,1989.55C724.877,1989.55,724.2,1989.55,722.838,1989.55C721.475,1989.55,720.803,1989.55,719.446,1989.55C718.089,1989.55,717.422,1989.55,716.069,1989.55C714.718,1989.55,714.056,1989.55,712.709,1989.55C711.362,1989.55,710.705,1989.55,709.363,1989.55C708.022,1989.55,707.37,1989.55,706.033,1989.55C704.696,1989.55,704.049,1989.55,702.717,1989.55C701.385,1989.55,700.743,1989.55,699.417,1989.55C698.09,1989.55,697.453,1989.55,696.131,1989.55C694.809,1989.55,694.176,1989.55,692.859,1989.55C691.542,1989.55,690.915,1989.55,689.602,1989.55C688.29,1989.55,687.667,1989.55,686.359,1989.55C685.052,1989.55,684.434,1989.55,683.131,1989.55C681.828,1989.55,681.214,1989.55,679.916,1989.55C678.618,1989.55,678.009,1989.55,676.715,1989.55C675.421,1989.55,674.817,1989.55,673.528,1989.55C672.238,1989.55,671.639,1989.55,670.354,1989.55C669.069,1989.55,668.474,1989.55,667.194,1989.55C665.913,1989.55,665.323,1989.55,664.047,1989.55C662.771,1989.55,662.184,1989.55,660.913,1989.55C659.641,1989.55,659.059,1989.55,657.792,1989.55C656.525,1989.55,655.947,1989.55,654.684,1989.55C653.421,1989.55,652.847,1989.55,651.588,1989.55C650.329,1989.55,649.76,1989.55,648.506,1989.55C647.251,1989.55,646.686,1989.55,645.435,1989.55C644.185,1989.55,643.623,1989.55,642.377,1989.55C641.131,1989.55,640.573,1989.55,639.331,1989.55C638.089,1989.55,637.536,1989.55,636.297,1989.55C635.059,1989.55,634.509,1989.55,633.275,1989.55C632.04,1989.55,631.495,1989.55,630.264,1989.55C629.033,1989.55,628.492,1989.55,627.266,1989.55C626.038,1989.55,625.501,1989.55,624.278,1989.55C623.055,1989.55,622.521,1989.55,621.302,1989.55C620.083,1989.55,619.552,1989.55,618.337,1989.55C617.121,1989.55,616.595,1989.55,615.383,1989.55C614.171,1989.55,613.648,1989.55,612.439,1989.55C611.231,1989.55,610.712,1989.55,609.507,1989.55C608.303,1989.55,607.787,1989.55,606.585,1989.55C605.384,1989.55,604.872,1989.55,603.674,1989.55C602.476,1989.55,601.967,1989.55,600.773,1989.55C599.578,1989.55,599.073,1989.55,597.882,1989.55C596.691,1989.55,596.189,1989.55,595.001,1989.55C593.813,1989.55,593.314,1989.55,592.13,1989.55C590.945,1989.55,590.45,1989.55,589.268,1989.55C588.087,1989.55,587.595,1989.55,586.417,1989.55C585.239,1989.55,584.75,1989.55,583.574,1989.55C582.399,1989.55,581.913,1989.55,580.742,1989.55C579.569,1989.55,579.086,1989.55,577.918,1989.55C576.749,1989.55,576.269,1989.55,575.103,1989.55C573.937,1989.55,573.46,1989.55,572.297,1989.55C571.134,1989.55,570.66,1989.55,569.5,1989.55C568.34,1989.55,567.869,1989.55,566.711,1989.55C565.554,1989.55,565.086,1989.55,563.931,1989.55C562.777,1989.55,562.311,1989.55,561.16,1989.55C560.008,1989.55,559.545,1989.55,558.396,1989.55C557.247,1989.55,556.787,1989.55,555.641,1989.55C554.494,1989.55,554.036,1989.55,552.893,1989.55C551.749,1989.55,551.294,1989.55,550.153,1989.55C549.012,1989.55,548.559,1989.55,547.421,1989.55C546.282,1989.55,545.832,1989.55,544.696,1989.55C543.56,1989.55,543.112,1989.55,541.979,1989.55C540.845,1989.55,540.399,1989.55,539.268,1989.55C538.137,1989.55,537.694,1989.55,536.565,1989.55C535.436,1989.55,534.995,1989.55,533.869,1989.55C532.742,1989.55,532.304,1989.55,531.179,1989.55C530.055,1989.55,529.619,1989.55,528.496,1989.55C527.374,1989.55,526.94,1989.55,525.82,1989.55C524.7,1989.55,524.268,1989.55,523.15,1989.55C522.032,1989.55,521.603,1989.55,520.486,1989.55C519.37,1989.55,518.942,1989.55,517.829,1989.55C516.714,1989.55,516.289,1989.55,515.177,1989.55C514.065,1989.55,513.641,1989.55,512.531,1989.55C511.42,1989.55,510.999,1989.55,509.89,1989.55C508.782,1989.55,508.362,1989.55,507.255,1989.55C506.149,1989.55,505.731,1989.55,504.626,1989.55C503.521,1989.55,503.105,1989.55,502.001,1989.55C500.899,1989.55,500.484,1989.55,499.382,1989.55C498.281,1989.55,497.868,1989.55,496.768,1989.55C495.668,1989.55,495.257,1989.55,494.159,1989.55C493.06,1989.55,492.65,1989.55,491.554,1989.55C490.457,1989.55,490.048,1989.55,488.953,1989.55C487.858,1989.55,487.451,1989.55,486.357,1989.55C485.264,1989.55,484.858,1989.55,483.766,1989.55C482.674,1989.55,482.269,1989.55,481.178,1989.55C480.087,1989.55,479.684,1989.55,478.594,1989.55C477.504,1989.55,477.103,1989.55,476.015,1989.55C474.926,1989.55,474.525,1989.55,473.438,1989.55C472.351,1989.55,471.952,1989.55,470.866,1989.55C469.78,1989.55,469.381,1989.55,468.296,1989.55C467.211,1989.55,466.814,1989.55,465.73,1989.55C464.647,1989.55,464.25,1989.55,463.167,1989.55C462.085,1989.55,461.69,1989.55,460.607,1989.55C459.525,1989.55,459.131,1989.55,458.05,1989.55C456.969,1989.55,456.576,1989.55,455.496,1989.55C454.415,1989.55,454.023,1989.55,452.944,1989.55C451.864,1989.55,451.473,1989.55,450.394,1989.55C449.316,1989.55,448.925,1989.55,447.847,1989.55C446.769,1989.55,446.379,1989.55,445.302,1989.55C444.225,1989.55,443.835,1989.55,442.759,1989.55C441.682,1989.55,441.293,1989.55,440.217,1989.55C439.141,1989.55,438.753,1989.55,437.678,1989.55C436.602,1989.55,436.214,1989.55,435.14,1989.55C434.065,1989.55,433.677,1989.55,432.603,1989.55C431.528,1989.55,431.141,1989.55,430.067,1989.55C428.993,1989.55,428.607,1989.55,427.533,1989.55C426.459,1989.55,426.073,1989.55,425,1989.55C423.927,1989.55,423.541,1989.55,422.467,1989.55C421.394,1989.55,421.009,1989.55,419.936,1989.55C418.862,1989.55,418.477,1989.55,417.404,1989.55C416.331,1989.55,415.946,1989.55,414.874,1989.55C413.801,1989.55,413.416,1989.55,412.343,1989.55C411.271,1989.55,410.885,1989.55,409.813,1989.55C408.74,1989.55,408.355,1989.55,407.282,1989.55C406.21,1989.55,405.825,1989.55,404.752,1989.55C403.679,1989.55,403.294,1989.55,402.221,1989.55C401.148,1989.55,400.763,1989.55,399.69,1989.55C398.617,1989.55,398.231,1989.55,397.158,1989.55C396.085,1989.55,395.699,1989.55,394.626,1989.55C393.552,1989.55,393.166,1989.55,392.093,1989.55C391.019,1989.55,390.632,1989.55,389.558,1989.55C388.484,1989.55,388.097,1989.55,387.023,1989.55C385.948,1989.55,385.561,1989.55,384.486,1989.55C383.411,1989.55,383.023,1989.55,381.948,1989.55C380.872,1989.55,380.484,1989.55,379.408,1989.55C378.332,1989.55,377.943,1989.55,376.867,1989.55C375.79,1989.55,375.401,1989.55,374.324,1989.55C373.246,1989.55,372.856,1989.55,371.779,1989.55C370.701,1989.55,370.31,1989.55,369.231,1989.55C368.153,1989.55,367.761,1989.55,366.682,1989.55C365.602,1989.55,365.21,1989.55,364.13,1989.55C363.05,1989.55,362.656,1989.55,361.575,1989.55C360.494,1989.55,360.1,1989.55,359.018,1989.55C357.936,1989.55,357.541,1989.55,356.458,1989.55C355.375,1989.55,354.979,1989.55,353.895,1989.55C352.811,1989.55,352.414,1989.55,351.329,1989.55C350.244,1989.55,349.846,1989.55,348.76,1989.55C347.674,1989.55,347.275,1989.55,346.187,1989.55C345.1,1989.55,344.7,1989.55,343.611,1989.55C342.523,1989.55,342.121,1989.55,341.031,1989.55C339.941,1989.55,339.538,1989.55,338.447,1989.55C337.356,1989.55,336.952,1989.55,335.86,1989.55C334.767,1989.55,334.362,1989.55,333.268,1989.55C332.174,1989.55,331.767,1989.55,330.672,1989.55C329.577,1989.55,329.168,1989.55,328.072,1989.55C326.975,1989.55,326.565,1989.55,325.467,1989.55C324.369,1989.55,323.957,1989.55,322.857,1989.55C321.757,1989.55,321.344,1989.55,320.243,1989.55C319.142,1989.55,318.727,1989.55,317.624,1989.55C316.521,1989.55,316.104,1989.55,315,1989.55C313.895,1989.55,313.477,1989.55,312.37,1989.55C311.264,1989.55,310.843,1989.55,309.735,1989.55C308.627,1989.55,308.205,1989.55,307.095,1989.55C305.985,1989.55,305.561,1989.55,304.449,1989.55C303.337,1989.55,302.911,1989.55,301.797,1989.55C300.683,1989.55,300.255,1989.55,299.139,1989.55C298.023,1989.55,297.593,1989.55,296.475,1989.55C295.357,1989.55,294.925,1989.55,293.806,1989.55C292.685,1989.55,292.251,1989.55,291.129,1989.55C290.007,1989.55,289.571,1989.55,288.446,1989.55C287.322,1989.55,286.883,1989.55,285.756,1989.55C284.63,1989.55,284.189,1989.55,283.06,1989.55C281.932,1989.55,281.489,1989.55,280.357,1989.55C279.226,1989.55,278.78,1989.55,277.647,1989.55C276.513,1989.55,276.065,1989.55,274.93,1989.55C273.793,1989.55,273.343,1989.55,272.205,1989.55C271.066,1989.55,270.614,1989.55,269.472,1989.55C268.331,1989.55,267.876,1989.55,266.732,1989.55C265.589,1989.55,265.131,1989.55,263.985,1989.55C262.839,1989.55,262.379,1989.55,261.229,1989.55C260.081,1989.55,259.618,1989.55,258.466,1989.55C257.314,1989.55,256.848,1989.55,255.694,1989.55C254.54,1989.55,254.071,1989.55,252.914,1989.55C251.757,1989.55,251.286,1989.55,250.126,1989.55C248.966,1989.55,248.491,1989.55,247.328,1989.55C246.166,1989.55,245.688,1989.55,244.522,1989.55C243.357,1989.55,242.877,1989.55,241.708,1989.55C240.539,1989.55,240.056,1989.55,238.884,1989.55C237.712,1989.55,237.226,1989.55,236.051,1989.55C234.876,1989.55,234.387,1989.55,233.209,1989.55C232.031,1989.55,231.538,1989.55,230.357,1989.55C229.176,1989.55,228.68,1989.55,227.496,1989.55C226.311,1989.55,225.812,1989.55,224.624,1989.55C223.437,1989.55,222.935,1989.55,221.743,1989.55C220.553,1989.55,220.047,1989.55,218.853,1989.55C217.658,1989.55,217.15,1989.55,215.952,1989.55C214.753,1989.55,214.241,1989.55,213.04,1989.55C211.839,1989.55,211.323,1989.55,210.118,1989.55C208.913,1989.55,208.394,1989.55,207.186,1989.55C205.977,1989.55,205.455,1989.55,204.243,1989.55C203.031,1989.55,202.504,1989.55,201.288,1989.55C200.073,1989.55,199.543,1989.55,198.323,1989.55C197.104,1989.55,196.571,1989.55,195.347,1989.55C194.125,1989.55,193.587,1989.55,192.36,1989.55C191.133,1989.55,190.592,1989.55,189.361,1989.55C188.13,1989.55,187.585,1989.55,186.351,1989.55C185.116,1989.55,184.567,1989.55,183.329,1989.55C182.09,1989.55,181.537,1989.55,180.294,1989.55C179.052,1989.55,178.495,1989.55,177.248,1989.55C176.002,1989.55,175.441,1989.55,174.19,1989.55C172.94,1989.55,172.375,1989.55,171.12,1989.55C169.865,1989.55,169.296,1989.55,168.037,1989.55C166.778,1989.55,166.204,1989.55,164.942,1989.55C163.678,1989.55,163.101,1989.55,161.834,1989.55C160.566,1989.55,159.984,1989.55,158.713,1989.55C157.441,1989.55,156.855,1989.55,155.578,1989.55C154.303,1989.55,153.712,1989.55,152.432,1989.55C151.151,1989.55,150.556,1989.55,149.271,1989.55C147.987,1989.55,147.387,1989.55,146.098,1989.55C144.808,1989.55,144.204,1989.55,142.91,1989.55C141.616,1989.55,141.008,1989.55,139.71,1989.55C138.411,1989.55,137.798,1989.55,136.495,1989.55C135.192,1989.55,134.574,1989.55,133.266,1989.55C131.958,1989.55,131.336,1989.55,130.023,1989.55C128.711,1989.55,128.083,1989.55,126.766,1989.55C125.449,1989.55,124.817,1989.55,123.495,1989.55C122.173,1989.55,121.536,1989.55,120.209,1989.55C118.882,1989.55,118.24,1989.55,116.908,1989.55C115.576,1989.55,114.929,1989.55,113.593,1989.55C112.256,1989.55,111.604,1989.55,110.262,1989.55C108.92,1989.55,108.263,1989.55,106.917,1989.55C105.57,1989.55,104.908,1989.55,103.556,1989.55C102.204,1989.55,101.537,1989.55,100.18,1989.55C98.823,1989.55,98.15,1989.55,96.788,1989.55C95.426,1989.55,94.748,1989.55,93.381,1989.55C92.013,1989.55,91.33,1989.55,89.958,1989.55C88.927,1989.55,88.584,1989.55,87.553,1989.55C86.521,1989.55,86.177,1989.55,85.144,1989.55C84.111,1989.55,83.765,1989.55,82.731,1989.55C81.697,1989.55,81.35,1989.55,80.314,1989.55C79.279,1989.55,78.93,1989.55,77.893,1989.55C76.857,1989.55,76.507,1989.55,75.468,1989.55C74.43,1989.55,74.079,1989.55,73.039,1989.55C71.999,1989.55,71.647,1989.55,70.606,1989.55C69.565,1989.55,69.211,1989.55,68.169,1989.55C67.126,1989.55,66.771,1989.55,65.727,1989.55C64.683,1989.55,64.326,1989.55,63.281,1989.55C62.237,1989.55,61.878,1989.55,60.831,1989.55C59.785,1989.55,59.426,1989.55,58.378,1989.55C57.33,1989.55,56.969,1989.55,55.919,1989.55C54.87,1989.55,54.507,1989.55,53.457,1989.55C52.406,1989.55,52.042,1989.55,50.99,1989.55C49.938,1989.55,49.573,1989.55,48.519,1989.55C47.466,1989.55,47.099,1989.55,46.044,1989.55C44.989,1989.55,44.621,1989.55,43.564,1989.55C42.508,1989.55,42.138,1989.55,41.08,1989.55C40.023,1989.55,39.652,1989.55,38.592,1989.55C37.533,1989.55,37.161,1989.55,36.1,1989.55C35.039,1989.55,34.665,1989.55,33.603,1989.55C32.54,1989.55,32.165,1989.55,31.101,1989.55C30.038,1989.55,29.661,1989.55,28.596,1989.55C27.53,1989.55,27.152,1989.55,26.086,1989.55C25.019,1989.55,24.639,1989.55,23.571,1989.55C22.503,1989.55,22.121,1989.55,21.052,1989.55C19.982,1989.55,19.599,1989.55,18.528,1989.55C17.457,1989.55,17.073,1989.55,16,1989.55C16,1365.496,16,741.442,16,117.388Z',
  },
  {
    name: 'simple to complex line time change',
    description: 'changing from a short time period to long causes a lot of changes',
    start: 'M16,134.5C410.5,134.5,410.5,134.5,805,134.5',
    end: 'M16,100.276C17.375,100.276,17.375,107.398,18.749,107.398C20.124,107.398,20.124,108.674,21.498,108.674C22.873,108.674,22.873,113.348,24.247,113.348C25.622,113.348,25.622,111.01,26.997,111.01C28.371,111.01,28.371,120.186,29.746,120.186C31.12,120.186,31.12,113.957,32.495,113.957C33.869,113.957,33.869,117.679,35.244,117.679C36.618,117.679,36.618,114.666,37.993,114.666C39.368,114.666,39.368,101.137,40.742,101.137C42.117,101.137,42.117,115.585,43.491,115.585C44.866,115.585,44.866,112.837,46.24,112.837C47.615,112.837,47.615,117.047,48.99,117.047C50.364,117.047,50.364,120.922,51.739,120.922C53.113,120.922,53.113,113.524,54.488,113.524C55.862,113.524,55.862,116.367,57.237,116.367C58.611,116.367,58.611,107.229,59.986,107.229C61.361,107.229,61.361,102.62,62.735,102.62C64.11,102.62,64.11,106.563,65.484,106.563C66.859,106.563,66.859,93.865,68.233,93.865C69.608,93.865,69.608,95.054,70.983,95.054C72.357,95.054,72.357,89.791,73.732,89.791C75.106,89.791,75.106,96.564,76.481,96.564C77.855,96.564,77.855,83.782,79.23,83.782C80.605,83.782,80.605,80.881,81.979,80.881C83.354,80.881,83.354,85.304,84.728,85.304C86.103,85.304,86.103,86.218,87.477,86.218C88.852,86.218,88.852,86.028,90.226,86.028C91.601,86.028,91.601,91.674,92.976,91.674C94.35,91.674,94.35,87.74,95.725,87.74C97.099,87.74,97.099,76.374,98.474,76.374C99.848,76.374,99.848,77.692,101.223,77.692C102.598,77.692,102.598,81.094,103.972,81.094C105.347,81.094,105.347,83.888,106.721,83.888C108.096,83.888,108.096,74.74,109.47,74.74C110.845,74.74,110.845,70.347,112.22,70.347C113.594,70.347,113.594,75.851,114.969,75.851C116.343,75.851,116.343,66.159,117.718,66.159C119.092,66.159,119.092,65.878,120.467,65.878C121.841,65.878,121.841,67.522,123.216,67.522C124.591,67.522,124.591,68.664,125.965,68.664C127.34,68.664,127.34,68.226,128.714,68.226C130.089,68.226,130.089,72.523,131.463,72.523C132.838,72.523,132.838,72.978,134.213,72.978C135.587,72.978,135.587,72.215,136.962,72.215C138.336,72.215,138.336,77.069,139.711,77.069C141.085,77.069,141.085,84.564,142.46,84.564C143.834,84.564,143.834,92.679,145.209,92.679C146.584,92.679,146.584,90.074,147.958,90.074C149.333,90.074,149.333,93.915,150.707,93.915C152.082,93.915,152.082,83.662,153.456,83.662C154.831,83.662,154.831,81.341,156.206,81.341C157.58,81.341,157.58,76.42,158.955,76.42C160.329,76.42,160.329,88.68,161.704,88.68C163.078,88.68,163.078,84.411,164.453,84.411C165.828,84.411,165.828,81.734,167.202,81.734C168.577,81.734,168.577,81.103,169.951,81.103C171.326,81.103,171.326,76.797,172.7,76.797C174.075,76.797,174.075,72.989,175.449,72.989C176.824,72.989,176.824,77.636,178.199,77.636C179.573,77.636,179.573,76.642,180.948,76.642C182.322,76.642,182.322,80.851,183.697,80.851C185.071,80.851,185.071,104.474,186.446,104.474C187.821,104.474,187.821,109.468,189.195,109.468C190.57,109.468,190.57,124.223,191.944,124.223C193.319,124.223,193.319,121.791,194.693,121.791C196.068,121.791,196.068,108.698,197.443,108.698C198.817,108.698,198.817,108.782,200.192,108.782C201.566,108.782,201.566,94.561,202.941,94.561C204.315,94.561,204.315,94.095,205.69,94.095C207.064,94.095,207.064,96.256,208.439,96.256C209.814,96.256,209.814,106.493,211.188,106.493C212.563,106.493,212.563,111.141,213.937,111.141C215.312,111.141,215.312,117.754,216.686,117.754C218.061,117.754,218.061,106.333,219.436,106.333C220.81,106.333,220.81,104.377,222.185,104.377C223.559,104.377,223.559,96.785,224.934,96.785C226.308,96.785,226.308,91.61,227.683,91.61C229.057,91.61,229.057,88.373,230.432,88.373C231.807,88.373,231.807,86.392,233.181,86.392C234.556,86.392,234.556,90.45,235.93,90.45C237.305,90.45,237.305,85.135,238.679,85.135C240.054,85.135,240.054,85.53,241.429,85.53C242.803,85.53,242.803,92.857,244.178,92.857C245.552,92.857,245.552,92.18,246.927,92.18C248.301,92.18,248.301,90.174,249.676,90.174C251.051,90.174,251.051,90.161,252.425,90.161C253.8,90.161,253.8,85.875,255.174,85.875C256.549,85.875,256.549,83.96,257.923,83.96C259.298,83.96,259.298,83.801,260.672,83.801C262.047,83.801,262.047,83.865,263.422,83.865C264.796,83.865,264.796,85.279,266.171,85.279C267.545,85.279,267.545,95.247,268.92,95.247C270.294,95.247,270.294,99.159,271.669,99.159C273.044,99.159,273.044,106.676,274.418,106.676C275.793,106.676,275.793,99.687,277.167,99.687C278.542,99.687,278.542,91.874,279.916,91.874C281.291,91.874,281.291,98.709,282.666,98.709C284.04,98.709,284.04,96.052,285.415,96.052C286.789,96.052,286.789,83.2,288.164,83.2C289.538,83.2,289.538,84.595,290.913,84.595C292.287,84.595,292.287,66.797,293.662,66.797C295.037,66.797,295.037,74.979,296.411,74.979C297.786,74.979,297.786,61.266,299.16,61.266C300.535,61.266,300.535,69.436,301.909,69.436C303.284,69.436,303.284,76.457,304.659,76.457C306.033,76.457,306.033,81.224,307.408,81.224C308.782,81.224,308.782,81.329,310.157,81.329C311.531,81.329,311.531,83.339,312.906,83.339C314.28,83.339,314.28,93.544,315.655,93.544C317.03,93.544,317.03,88.914,318.404,88.914C319.779,88.914,319.779,89.106,321.153,89.106C322.528,89.106,322.528,93.979,323.902,93.979C325.277,93.979,325.277,96.917,326.652,96.917C328.026,96.917,328.026,97.982,329.401,97.982C330.775,97.982,330.775,82.844,332.15,82.844C333.524,82.844,333.524,87.64,334.899,87.64C336.274,87.64,336.274,80.254,337.648,80.254C339.023,80.254,339.023,80.377,340.397,80.377C341.772,80.377,341.772,81.027,343.146,81.027C344.521,81.027,344.521,89.155,345.895,89.155C347.27,89.155,347.27,112.275,348.645,112.275C350.019,112.275,350.019,109.014,351.394,109.014C352.768,109.014,352.768,119.023,354.143,119.023C355.517,119.023,355.517,122.018,356.892,122.018C358.267,122.018,358.267,109.55,359.641,109.55C361.016,109.55,361.016,113.275,362.39,113.275C363.765,113.275,363.765,117.663,365.139,117.663C366.514,117.663,366.514,114.972,367.889,114.972C369.263,114.972,369.263,108.373,370.638,108.373C372.012,108.373,372.012,103.74,373.387,103.74C374.761,103.74,374.761,108.432,376.136,108.432C377.51,108.432,377.51,118.746,378.885,118.746C380.26,118.746,380.26,119.681,381.634,119.681C383.009,119.681,383.009,137.204,384.383,137.204C385.758,137.204,385.758,145.82,387.132,145.82C388.507,145.82,388.507,152.715,389.882,152.715C391.256,152.715,391.256,143.33,392.631,143.33C394.005,143.33,394.005,153.841,395.38,153.841C396.754,153.841,396.754,175.752,398.129,175.752C399.503,175.752,399.503,193.552,400.878,193.552C402.253,193.552,402.253,206.989,403.627,206.989C405.002,206.989,405.002,199.827,406.376,199.827C407.751,199.827,407.751,193.46,409.125,193.46C410.5,193.46,410.5,192.544,411.875,192.544C413.249,192.544,413.249,164.31,414.624,164.31C415.998,164.31,415.998,155.7,417.373,155.7C418.747,155.7,418.747,143.842,420.122,143.842C421.497,143.842,421.497,154.95,422.871,154.95C424.246,154.95,424.246,155.877,425.62,155.877C426.995,155.877,426.995,165.093,428.369,165.093C429.744,165.093,429.744,176.767,431.118,176.767C432.493,176.767,432.493,174.703,433.868,174.703C435.242,174.703,435.242,155.224,436.617,155.224C437.991,155.224,437.991,138.225,439.366,138.225C440.74,138.225,440.74,148.872,442.115,148.872C443.49,148.872,443.49,152.121,444.864,152.121C446.239,152.121,446.239,153.148,447.613,153.148C448.988,153.148,448.988,159.595,450.362,159.595C451.737,159.595,451.737,143.115,453.111,143.115C454.486,143.115,454.486,138.355,455.861,138.355C457.235,138.355,457.235,128.056,458.61,128.056C459.984,128.056,459.984,111.122,461.359,111.122C462.733,111.122,462.733,105.204,464.108,105.204C465.483,105.204,465.483,99.492,466.857,99.492C468.232,99.492,468.232,101.656,469.606,101.656C470.981,101.656,470.981,103.384,472.355,103.384C473.73,103.384,473.73,96.287,475.105,96.287C476.479,96.287,476.479,93.405,477.854,93.405C479.228,93.405,479.228,92.726,480.603,92.726C481.977,92.726,481.977,97.251,483.352,97.251C484.726,97.251,484.726,94.228,486.101,94.228C487.476,94.228,487.476,97.25,488.85,97.25C490.225,97.25,490.225,103.275,491.599,103.275C492.974,103.275,492.974,102.618,494.348,102.618C495.723,102.618,495.723,101.993,497.098,101.993C498.472,101.993,498.472,94.162,499.847,94.162C501.221,94.162,501.221,98.365,502.596,98.365C503.97,98.365,503.97,101.213,505.345,101.213C506.72,101.213,506.72,104.549,508.094,104.549C509.469,104.549,509.469,105.376,510.843,105.376C512.218,105.376,512.218,121.462,513.592,121.462C514.967,121.462,514.967,119.194,516.341,119.194C517.716,119.194,517.716,142.102,519.091,142.102C520.465,142.102,520.465,159.384,521.84,159.384C523.214,159.384,523.214,155.733,524.589,155.733C525.963,155.733,525.963,143.47,527.338,143.47C528.713,143.47,528.713,152.327,530.087,152.327C531.462,152.327,531.462,143.853,532.836,143.853C534.211,143.853,534.211,128.485,535.585,128.485C536.96,128.485,536.96,135.947,538.334,135.947C539.709,135.947,539.709,122.736,541.084,122.736C542.458,122.736,542.458,120.296,543.833,120.296C545.207,120.296,545.207,117.09,546.582,117.09C547.956,117.09,547.956,113.957,549.331,113.957C550.706,113.957,550.706,112.844,552.08,112.844C553.455,112.844,553.455,117.442,554.829,117.442C556.204,117.442,556.204,130.026,557.578,130.026C558.953,130.026,558.953,147.339,560.328,147.339C561.702,147.339,561.702,132.833,563.077,132.833C564.451,132.833,564.451,127.678,565.826,127.678C567.2,127.678,567.2,121.849,568.575,121.849C569.949,121.849,569.949,119.456,571.324,119.456C572.699,119.456,572.699,118.239,574.073,118.239C575.448,118.239,575.448,125.708,576.822,125.708C578.197,125.708,578.197,124.942,579.571,124.942C580.946,124.942,580.946,126.774,582.321,126.774C583.695,126.774,583.695,136.809,585.07,136.809C586.444,136.809,586.444,146.069,587.819,146.069C589.193,146.069,589.193,128.037,590.568,128.037C591.943,128.037,591.943,120.453,593.317,120.453C594.692,120.453,594.692,116.147,596.066,116.147C597.441,116.147,597.441,122.234,598.815,122.234C600.19,122.234,600.19,105.445,601.564,105.445C602.939,105.445,602.939,102.53,604.314,102.53C605.688,102.53,605.688,102.545,607.063,102.545C608.437,102.545,608.437,101.899,609.812,101.899C611.186,101.899,611.186,110.5,612.561,110.5C613.936,110.5,613.936,117.417,615.31,117.417C616.685,117.417,616.685,123.085,618.059,123.085C619.434,123.085,619.434,103.232,620.808,103.232C622.183,103.232,622.183,107.991,623.557,107.991C624.932,107.991,624.932,98.645,626.307,98.645C627.681,98.645,627.681,109.543,629.056,109.543C630.43,109.543,630.43,116.699,631.805,116.699C633.179,116.699,633.179,116.298,634.554,116.298C635.929,116.298,635.929,106.6,637.303,106.6C638.678,106.6,638.678,105.981,640.052,105.981C641.427,105.981,641.427,94.437,642.801,94.437C644.176,94.437,644.176,104.363,645.551,104.363C646.925,104.363,646.925,84.16,648.3,84.16C649.674,84.16,649.674,76.179,651.049,76.179C652.423,76.179,652.423,84.602,653.798,84.602C655.172,84.602,655.172,101.896,656.547,101.896C657.922,101.896,657.922,99.494,659.296,99.494C660.671,99.494,660.671,102.819,662.045,102.819C663.42,102.819,663.42,91.56,664.794,91.56C666.169,91.56,666.169,98.02,667.544,98.02C668.918,98.02,668.918,104.269,670.293,104.269C671.667,104.269,671.667,96.135,673.042,96.135C674.416,96.135,674.416,83.526,675.791,83.526C677.166,83.526,677.166,94.393,678.54,94.393C679.915,94.393,679.915,98.529,681.289,98.529C682.664,98.529,682.664,123.411,684.038,123.411C685.413,123.411,685.413,133.536,686.787,133.536C688.162,133.536,688.162,122.45,689.537,122.45C690.911,122.45,690.911,136.709,692.286,136.709C693.66,136.709,693.66,139.679,695.035,139.679C696.409,139.679,696.409,133.128,697.784,133.128C699.159,133.128,699.159,139.953,700.533,139.953C701.908,139.953,701.908,152.808,703.282,152.808C704.657,152.808,704.657,134.072,706.031,134.072C707.406,134.072,707.406,132.615,708.78,132.615C710.155,132.615,710.155,124.977,711.53,124.977C712.904,124.977,712.904,123.884,714.279,123.884C715.653,123.884,715.653,123.949,717.028,123.949C718.402,123.949,718.402,129.693,719.777,129.693C721.152,129.693,721.152,138.615,722.526,138.615C723.901,138.615,723.901,155.607,725.275,155.607C726.65,155.607,726.65,156.791,728.024,156.791C729.399,156.791,729.399,161.754,730.774,161.754C732.148,161.754,732.148,148.972,733.523,148.972C734.897,148.972,734.897,130.173,736.272,130.173C737.646,130.173,737.646,132.174,739.021,132.174C740.395,132.174,740.395,127.795,741.77,127.795C743.145,127.795,743.145,129.053,744.519,129.053C745.894,129.053,745.894,123.779,747.268,123.779C748.643,123.779,748.643,117.277,750.017,117.277C751.392,117.277,751.392,120.747,752.767,120.747C754.141,120.747,754.141,109.813,755.516,109.813C756.89,109.813,756.89,123.299,758.265,123.299C759.639,123.299,759.639,128.109,761.014,128.109C762.389,128.109,762.389,121.284,763.763,121.284C765.138,121.284,765.138,113.294,766.512,113.294C767.887,113.294,767.887,118.941,769.261,118.941C770.636,118.941,770.636,115.035,772.01,115.035C773.385,115.035,773.385,123.289,774.76,123.289C776.134,123.289,776.134,124.571,777.509,124.571C778.883,124.571,778.883,118.161,780.258,118.161C781.632,118.161,781.632,123.96,783.007,123.96C784.382,123.96,784.382,120.028,785.756,120.028C787.131,120.028,787.131,107.315,788.505,107.315C789.88,107.315,789.88,112.086,791.254,112.086C792.629,112.086,792.629,119.223,794.003,119.223C795.378,119.223,795.378,115.805,796.753,115.805C798.127,115.805,798.127,114.871,799.502,114.871C800.876,114.871,800.876,105.534,802.251,105.534C803.625,105.534,803.625,101.274,805,101.274',
    interpolated:
      'M16,117.388C17.073,117.388,17.457,120.949,18.528,120.949C19.599,120.949,19.982,121.587,21.052,121.587C22.121,121.587,22.503,123.924,23.571,123.924C24.639,123.924,25.019,122.755,26.086,122.755C27.152,122.755,27.53,127.343,28.596,127.343C29.661,127.343,30.038,124.229,31.101,124.229C32.165,124.229,32.54,126.09,33.603,126.09C34.665,126.09,35.039,124.583,36.1,124.583C37.161,124.583,37.533,117.819,38.592,117.819C39.652,117.819,40.023,125.042,41.08,125.042C42.138,125.042,42.508,123.669,43.564,123.669C44.621,123.669,44.989,125.774,46.044,125.774C47.099,125.774,47.466,127.711,48.519,127.711C49.573,127.711,49.938,124.012,50.99,124.012C52.042,124.012,52.406,125.434,53.457,125.434C54.507,125.434,54.87,120.864,55.919,120.864C56.969,120.864,57.33,118.56,58.378,118.56C59.426,118.56,59.785,120.532,60.831,120.532C61.878,120.532,62.237,114.183,63.281,114.183C64.326,114.183,64.683,114.777,65.727,114.777C66.771,114.777,67.126,112.146,68.169,112.146C69.211,112.146,69.565,115.532,70.606,115.532C71.647,115.532,71.999,109.141,73.039,109.141C74.079,109.141,74.43,107.691,75.468,107.691C76.507,107.691,76.857,109.902,77.893,109.902C78.93,109.902,79.279,110.359,80.314,110.359C81.35,110.359,81.697,110.264,82.731,110.264C83.765,110.264,84.111,113.087,85.144,113.087C86.177,113.087,86.521,111.12,87.553,111.12C88.584,111.12,88.927,105.437,89.958,105.437C90.987,105.437,91.329,106.096,92.358,106.096C93.387,106.096,93.728,107.797,94.755,107.797C96.123,107.797,96.8,109.194,98.162,109.194C99.525,109.194,100.197,104.62,101.554,104.62C102.911,104.62,103.578,102.423,104.931,102.423C106.282,102.423,106.944,105.176,108.291,105.176C109.638,105.176,110.295,100.33,111.637,100.33C112.978,100.33,113.63,100.189,114.967,100.189C116.304,100.189,116.951,101.011,118.283,101.011C119.615,101.011,120.257,101.582,121.583,101.582C122.91,101.582,123.547,101.363,124.869,101.363C126.191,101.363,126.824,103.512,128.141,103.512C129.458,103.512,130.085,103.739,131.398,103.739C132.71,103.739,133.333,103.358,134.641,103.358C135.948,103.358,136.566,105.785,137.869,105.785C139.172,105.785,139.786,109.532,141.084,109.532C142.382,109.532,142.991,113.59,144.285,113.59C145.579,113.59,146.183,112.287,147.472,112.287C148.762,112.287,149.361,114.208,150.646,114.208C151.931,114.208,152.526,109.081,153.806,109.081C155.087,109.081,155.677,107.921,156.953,107.921C158.229,107.921,158.816,105.46,160.087,105.46C161.359,105.46,161.941,111.59,163.208,111.59C164.475,111.59,165.053,109.456,166.316,109.456C167.579,109.456,168.153,108.117,169.412,108.117C170.671,108.117,171.24,107.802,172.494,107.802C173.749,107.802,174.314,105.649,175.565,105.649C176.815,105.649,177.377,103.745,178.623,103.745C179.869,103.745,180.427,106.068,181.669,106.068C182.911,106.068,183.464,105.571,184.703,105.571C185.941,105.571,186.491,107.676,187.725,107.676C188.96,107.676,189.505,119.487,190.736,119.487C191.967,119.487,192.508,121.984,193.734,121.984C194.962,121.984,195.499,129.362,196.722,129.362C197.945,129.362,198.479,128.146,199.698,128.146C200.917,128.146,201.448,121.599,202.663,121.599C203.879,121.599,204.405,121.641,205.617,121.641C206.829,121.641,207.352,114.531,208.561,114.531C209.769,114.531,210.288,114.298,211.493,114.298C212.697,114.298,213.213,115.378,214.415,115.378C215.616,115.378,216.128,120.497,217.326,120.497C218.524,120.497,219.033,122.821,220.227,122.821C221.422,122.821,221.927,126.127,223.118,126.127C224.309,126.127,224.811,120.417,225.999,120.417C227.187,120.417,227.686,119.439,228.87,119.439C230.055,119.439,230.55,115.643,231.732,115.643C232.913,115.643,233.405,113.055,234.583,113.055C235.761,113.055,236.25,111.437,237.426,111.437C238.601,111.437,239.087,110.446,240.258,110.446C241.431,110.446,241.914,112.475,243.082,112.475C244.251,112.475,244.731,109.818,245.897,109.818C247.063,109.818,247.54,110.015,248.703,110.015C249.866,110.015,250.34,113.679,251.5,113.679C252.66,113.679,253.131,113.34,254.289,113.34C255.446,113.34,255.914,112.337,257.069,112.337C258.223,112.337,258.689,112.331,259.84,112.331C260.992,112.331,261.455,110.188,262.604,110.188C263.753,110.188,264.213,109.23,265.359,109.23C266.506,109.23,266.964,109.151,268.107,109.151C269.251,109.151,269.706,109.183,270.847,109.183C271.988,109.183,272.441,109.89,273.579,109.89C274.718,109.89,275.168,114.874,276.304,114.874C277.44,114.874,277.888,116.83,279.021,116.83C280.155,116.83,280.601,120.588,281.732,120.588C282.863,120.588,283.306,117.094,284.435,117.094C285.564,117.094,286.005,113.187,287.131,113.187C288.258,113.187,288.696,116.605,289.821,116.605C290.945,116.605,291.381,115.276,292.504,115.276C293.626,115.276,294.06,108.85,295.18,108.85C296.3,108.85,296.732,109.548,297.85,109.548C298.968,109.548,299.397,100.649,300.514,100.649C301.63,100.649,302.058,104.739,303.171,104.739C304.286,104.739,304.711,97.883,305.823,97.883C306.935,97.883,307.359,101.968,308.469,101.968C309.58,101.968,310.001,105.479,311.11,105.479C312.218,105.479,312.638,107.862,313.745,107.862C314.851,107.862,315.269,107.915,316.374,107.915C317.479,107.915,317.895,108.92,318.999,108.92C320.101,108.92,320.516,114.022,321.618,114.022C322.719,114.022,323.132,111.707,324.232,111.707C325.332,111.707,325.743,111.803,326.841,111.803C327.94,111.803,328.35,114.239,329.446,114.239C330.543,114.239,330.952,115.709,332.047,115.709C333.142,115.709,333.549,116.241,334.643,116.241C335.736,116.241,336.142,108.672,337.234,108.672C338.326,108.672,338.731,111.07,339.822,111.07C340.913,111.07,341.316,107.377,342.406,107.377C343.496,107.377,343.897,107.439,344.985,107.439C346.074,107.439,346.475,107.764,347.562,107.764C348.649,107.764,349.048,111.828,350.134,111.828C351.22,111.828,351.619,123.388,352.704,123.388C353.789,123.388,354.186,121.757,355.27,121.757C356.353,121.757,356.75,126.762,357.833,126.762C358.915,126.762,359.31,128.259,360.393,128.259C361.475,128.259,361.869,122.025,362.95,122.025C364.031,122.025,364.424,123.888,365.504,123.888C366.585,123.888,366.977,126.082,368.056,126.082C369.136,126.082,369.527,124.736,370.606,124.736C371.684,124.736,372.075,121.437,373.153,121.437C374.231,121.437,374.621,119.12,375.698,119.12C376.775,119.12,377.165,121.466,378.241,121.466C379.318,121.466,379.707,126.623,380.783,126.623C381.859,126.623,382.247,127.09,383.322,127.09C384.398,127.09,384.786,135.852,385.86,135.852C386.935,135.852,387.323,140.16,388.397,140.16C389.472,140.16,389.859,143.608,390.933,143.608C392.007,143.608,392.393,138.915,393.467,138.915C394.541,138.915,394.927,144.171,396,144.171C397.073,144.171,397.459,155.126,398.533,155.126C399.606,155.126,399.991,164.026,401.064,164.026C402.138,164.026,402.523,170.745,403.596,170.745C404.669,170.745,405.054,167.164,406.126,167.164C407.199,167.164,407.584,163.98,408.657,163.98C409.729,163.98,410.115,163.522,411.188,163.522C412.26,163.522,412.645,149.405,413.718,149.405C414.79,149.405,415.175,145.1,416.248,145.1C417.321,145.1,417.706,139.171,418.779,139.171C419.852,139.171,420.237,144.725,421.31,144.725C422.383,144.725,422.769,145.189,423.842,145.189C424.915,145.189,425.301,149.796,426.374,149.796C427.448,149.796,427.834,155.634,428.907,155.634C429.981,155.634,430.368,154.602,431.442,154.602C432.516,154.602,432.903,144.862,433.977,144.862C435.052,144.862,435.439,136.363,436.514,136.363C437.589,136.363,437.977,141.686,439.052,141.686C440.128,141.686,440.516,143.311,441.592,143.311C442.668,143.311,443.057,143.824,444.133,143.824C445.21,143.824,445.599,147.048,446.676,147.048C447.754,147.048,448.144,138.808,449.221,138.808C450.299,138.808,450.69,136.428,451.769,136.428C452.847,136.428,453.239,131.278,454.318,131.278C455.398,131.278,455.79,122.811,456.87,122.811C457.95,122.811,458.344,119.852,459.425,119.852C460.506,119.852,460.9,116.996,461.982,116.996C463.064,116.996,463.459,118.078,464.542,118.078C465.625,118.078,466.021,118.942,467.105,118.942C468.189,118.942,468.586,115.394,469.671,115.394C470.756,115.394,471.154,113.953,472.24,113.953C473.326,113.953,473.725,113.613,474.813,113.613C475.9,113.613,476.3,115.876,477.389,115.876C478.477,115.876,478.879,114.364,479.969,114.364C481.059,114.364,481.462,115.875,482.553,115.875C483.644,115.875,484.048,118.888,485.14,118.888C486.233,118.888,486.638,118.559,487.732,118.559C488.826,118.559,489.233,118.247,490.328,118.247C491.423,118.247,491.832,114.331,492.928,114.331C494.025,114.331,494.435,116.433,495.533,116.433C496.631,116.433,497.043,117.857,498.143,117.857C499.243,117.857,499.656,119.525,500.757,119.525C501.858,119.525,502.273,119.938,503.376,119.938C504.479,119.938,504.896,127.981,506,127.981C507.105,127.981,507.523,126.847,508.63,126.847C509.736,126.847,510.157,138.301,511.265,138.301C512.373,138.301,512.795,146.942,513.905,146.942C515.015,146.942,515.439,145.117,516.551,145.117C517.663,145.117,518.089,138.985,519.203,138.985C520.317,138.985,520.745,143.414,521.861,143.414C522.977,143.414,523.407,139.177,524.525,139.177C525.643,139.177,526.075,131.493,527.194,131.493C528.315,131.493,528.749,135.224,529.871,135.224C530.993,135.224,531.429,128.618,532.554,128.618C533.678,128.618,534.117,127.398,535.244,127.398C536.37,127.398,536.811,125.795,537.94,125.795C539.068,125.795,539.511,124.229,540.643,124.229C541.774,124.229,542.22,123.672,543.353,123.672C544.487,123.672,544.935,125.971,546.07,125.971C547.207,125.971,547.657,132.263,548.795,132.263C549.934,132.263,550.386,140.92,551.528,140.92C552.669,140.92,553.124,133.666,554.268,133.666C555.411,133.666,555.869,131.089,557.015,131.089C558.161,131.089,558.621,128.175,559.771,128.175C560.919,128.175,561.382,126.978,562.534,126.978C563.686,126.978,564.152,126.37,565.306,126.37C566.46,126.37,566.929,130.104,568.086,130.104C569.243,130.104,569.714,129.721,570.874,129.721C572.034,129.721,572.509,130.637,573.672,130.637C574.834,130.637,575.312,135.654,576.478,135.654C577.643,135.654,578.123,140.284,579.292,140.284C580.461,140.284,580.944,131.269,582.116,131.269C583.288,131.269,583.774,127.477,584.949,127.477C586.124,127.477,586.613,125.324,587.791,125.324C588.969,125.324,589.462,128.367,590.643,128.367C591.824,128.367,592.32,119.973,593.504,119.973C594.689,119.973,595.188,118.515,596.376,118.515C597.563,118.515,598.065,118.523,599.257,118.523C600.447,118.523,600.953,118.2,602.147,118.2C603.342,118.2,603.85,122.5,605.048,122.5C606.247,122.5,606.759,125.959,607.96,125.959C609.161,125.959,609.677,128.792,610.882,128.792C612.087,128.792,612.606,118.866,613.814,118.866C615.023,118.866,615.545,121.246,616.757,121.246C617.969,121.246,618.496,116.572,619.712,116.572C620.927,116.572,621.457,122.022,622.677,122.022C623.896,122.022,624.429,125.6,625.653,125.6C626.875,125.6,627.413,125.399,628.64,125.399C629.867,125.399,630.408,120.55,631.639,120.55C632.87,120.55,633.415,120.241,634.649,120.241C635.884,120.241,636.433,114.469,637.671,114.469C638.91,114.469,639.463,119.432,640.706,119.432C641.948,119.432,642.505,109.33,643.752,109.33C644.998,109.33,645.559,105.34,646.81,105.34C648.06,105.34,648.625,109.551,649.88,109.551C651.135,109.551,651.704,118.198,652.963,118.198C654.222,118.198,654.796,116.997,656.058,116.997C657.322,116.997,657.899,118.66,659.166,118.66C660.434,118.66,661.016,113.03,662.287,113.03C663.559,113.03,664.145,116.26,665.422,116.26C666.697,116.26,667.288,119.385,668.568,119.385C669.849,119.385,670.444,115.318,671.729,115.318C673.013,115.318,673.613,109.013,674.902,109.013C676.192,109.013,676.796,114.447,678.09,114.447C679.384,114.447,679.992,116.515,681.29,116.515C682.589,116.515,683.202,128.956,684.505,128.956C685.808,128.956,686.426,134.018,687.734,134.018C689.042,134.018,689.664,128.475,690.977,128.475C692.289,128.475,692.917,135.605,694.234,135.605C695.551,135.605,696.183,137.09,697.505,137.09C698.827,137.09,699.464,133.814,700.791,133.814C702.118,133.814,702.76,137.227,704.092,137.227C705.424,137.227,706.071,143.654,707.407,143.654C708.744,143.654,709.396,134.286,710.738,134.286C712.08,134.286,712.737,133.558,714.083,133.558C715.43,133.558,716.092,129.738,717.444,129.738C718.796,129.738,719.463,129.192,720.82,129.192C722.177,129.192,722.85,129.225,724.212,129.225C725.574,129.225,726.252,132.097,727.619,132.097C728.987,132.097,729.67,136.558,731.042,136.558C732.073,136.558,732.416,145.054,733.447,145.054C734.479,145.054,734.823,145.646,735.856,145.646C736.889,145.646,737.235,148.127,738.269,148.127C739.303,148.127,739.65,141.736,740.686,141.736C741.721,141.736,742.07,132.337,743.107,132.337C744.143,132.337,744.493,133.337,745.532,133.337C746.57,133.337,746.921,131.148,747.961,131.148C749.001,131.148,749.353,131.777,750.394,131.777C751.435,131.777,751.789,129.14,752.831,129.14C753.874,129.14,754.229,125.889,755.273,125.889C756.317,125.889,756.674,127.624,757.719,127.624C758.763,127.624,759.122,122.157,760.169,122.157C761.215,122.157,761.574,128.899,762.622,128.899C763.67,128.899,764.031,131.305,765.081,131.305C766.13,131.305,766.493,127.892,767.543,127.892C768.594,127.892,768.958,123.897,770.01,123.897C771.062,123.897,771.427,126.721,772.481,126.721C773.534,126.721,773.901,124.768,774.956,124.768C776.011,124.768,776.379,128.895,777.436,128.895C778.492,128.895,778.862,129.536,779.92,129.536C780.977,129.536,781.348,126.331,782.408,126.331C783.467,126.331,783.839,129.23,784.9,129.23C785.961,129.23,786.335,127.264,787.397,127.264C788.46,127.264,788.835,120.908,789.899,120.908C790.962,120.908,791.339,123.293,792.404,123.293C793.47,123.293,793.848,126.862,794.914,126.862C795.981,126.862,796.361,125.153,797.429,125.153C798.497,125.153,798.879,124.685,799.948,124.685C801.018,124.685,801.401,120.017,802.472,120.017C803.543,120.017,803.927,117.887,805,117.887',
  },
  {
    name: 'line extension',
    description:
      'adding a data point to the end should not cause existing line to animate, only add to end',
    start:
      'M16,69.929C35.605,69.929,35.605,55.25,55.211,55.25C74.816,55.25,74.816,76.108,94.421,76.108C114.026,76.108,114.026,95.061,133.632,95.061C153.237,95.061,153.237,75.285,172.842,75.285',
    end: 'M16,69.929C35.605,69.929,35.605,55.25,55.211,55.25C74.816,55.25,74.816,76.108,94.421,76.108C114.026,76.108,114.026,95.061,133.632,95.061C153.237,95.061,153.237,75.285,172.842,75.285C192.447,75.285,192.447,116.387,212.053,116.387',
    interpolated:
      'M16,69.929C35.605,69.929,35.605,55.25,55.211,55.25C74.816,55.25,74.816,76.108,94.421,76.108C114.026,76.108,114.026,95.061,133.632,95.061C153.237,95.061,153.237,75.285,172.842,75.285C182.645,75.285,182.645,95.836,192.448,95.836',
  },
  {
    name: 'line with gap vertical change',
    description: 'we should not weirdly animate between the two lines',
    start:
      'M16,32C78.083,32,78.083,97.909,140.167,97.909M388.5,112.409C450.583,112.409,450.583,171.068,512.667,171.068C574.75,171.068,574.75,138.114,636.833,138.114C698.917,138.114,698.917,65.614,761,65.614',
    end: 'M16,111.091C78.083,111.091,78.083,157.227,140.167,157.227M388.5,69.964C450.583,69.964,450.583,166.718,512.667,166.718C574.75,166.718,574.75,169.289,636.833,169.289C698.917,169.289,698.917,32.527,761,32.527',
    interpolated:
      'M16,71.546C78.083,71.546,78.083,127.568,140.167,127.568M388.5,91.187C450.583,91.187,450.583,168.893,512.667,168.893C574.75,168.893,574.75,153.702,636.833,153.702C698.917,153.702,698.917,49.071,761,49.071',
  },
  {
    name: 'area with gap vertical change',
    description: 'we should not weirdly animate between the two areas',
    start:
      'M16,32C78.083,32,78.083,97.909,140.167,97.909L140.167,295.636C78.083,295.636,78.083,295.636,16,295.636ZM388.5,112.409C450.583,112.409,450.583,171.068,512.667,171.068C574.75,171.068,574.75,138.114,636.833,138.114C698.917,138.114,698.917,65.614,761,65.614L761,295.636C698.917,295.636,698.917,295.636,636.833,295.636C574.75,295.636,574.75,295.636,512.667,295.636C450.583,295.636,450.583,295.636,388.5,295.636Z',
    end: 'M16,111.091C78.083,111.091,78.083,157.227,140.167,157.227L140.167,216.545C78.083,216.545,78.083,216.545,16,216.545ZM388.5,69.964C450.583,69.964,450.583,166.718,512.667,166.718C574.75,166.718,574.75,169.289,636.833,169.289C698.917,169.289,698.917,32.527,761,32.527L761,216.545C698.917,216.545,698.917,216.545,636.833,216.545C574.75,216.545,574.75,216.545,512.667,216.545C450.583,216.545,450.583,216.545,388.5,216.545Z',
    interpolated:
      'M16,71.546C78.083,71.546,78.083,127.568,140.167,127.568L140.167,256.091C78.083,256.091,78.083,256.091,16,256.091ZM388.5,91.187C450.583,91.187,450.583,168.893,512.667,168.893C574.75,168.893,574.75,153.702,636.833,153.702C698.917,153.702,698.917,49.071,761,49.071L761,256.091C698.917,256.091,698.917,256.091,636.833,256.091C574.75,256.091,574.75,256.091,512.667,256.091C450.583,256.091,450.583,256.091,388.5,256.091Z',
  },
];

describe('finance chart interpolation scenarios', () => {
  it.each(newTests)('$name: $description', ({ start, end, interpolated }) => {
    const interpolator = interpolatePath(start, end);
    const result = interpolator(0.5);
    expect(result).toBe(interpolated);
  });
});
