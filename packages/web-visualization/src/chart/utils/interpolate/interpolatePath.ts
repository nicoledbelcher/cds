import { splitCurve, splitCurveAtT, splitCurveToTargetXs } from './split';
import type { CommandType, ExcludeSegmentFn, InterpolateOptions, PathCommand } from './types';

const commandTokenRegex = /[MLCSTQAHVZmlcstqahv]|-?[\d.e+-]+/g;

/**
 * List of params for each command type in a path `d` attribute
 */
const typeMap: Record<string, string[]> = {
  M: ['x', 'y'],
  L: ['x', 'y'],
  H: ['x'],
  V: ['y'],
  C: ['x1', 'y1', 'x2', 'y2', 'x', 'y'],
  S: ['x2', 'y2', 'x', 'y'],
  Q: ['x1', 'y1', 'x', 'y'],
  T: ['x', 'y'],
  A: ['rx', 'ry', 'xAxisRotation', 'largeArcFlag', 'sweepFlag', 'x', 'y'],
  Z: [],
};

// Add lower case entries too matching uppercase (e.g. 'm' == 'M')
Object.keys(typeMap).forEach((key) => {
  typeMap[key.toLowerCase()] = typeMap[key];
});

function arrayOfLength<T>(length: number, value?: T): T[] {
  const array: T[] = Array(length);
  for (let i = 0; i < length; i++) {
    array[i] = value as T;
  }
  return array;
}

const DECIMAL_PLACES = 3;
const ROUND_FACTOR = 10 ** DECIMAL_PLACES;
const match_tolerance = 1e-2;
const SINGLE_MATCH_STRUCTURAL_TYPES = new Set(['M', 'Z', 'L', 'H', 'V']);

function roundValue(value: number): number {
  return Math.round(value * ROUND_FACTOR) / ROUND_FACTOR;
}

type MatchPair = {
  aIndex: number;
  bIndex: number;
};

function isNumericValue(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function approximatelyEqual(a: number, b: number, tolerance: number = match_tolerance): boolean {
  return Math.abs(a - b) <= tolerance;
}

function getSegmentStart(commands: PathCommand[], index: number): PathCommand | undefined {
  return index > 0 ? commands[index - 1] : undefined;
}

function commandsMatchAsAnchors(
  aCommands: PathCommand[],
  bCommands: PathCommand[],
  aIndex: number,
  bIndex: number,
): boolean {
  const aCommand = aCommands[aIndex];
  const bCommand = bCommands[bIndex];
  const aType = aCommand.type.toUpperCase();
  const bType = bCommand.type.toUpperCase();

  if (aType !== bType) {
    return false;
  }

  if (aType === 'M') {
    return isNumericValue(aCommand.x) && isNumericValue(bCommand.x)
      ? approximatelyEqual(aCommand.x, bCommand.x)
      : false;
  }

  if (aType === 'L') {
    if (!isNumericValue(aCommand.x) || !isNumericValue(bCommand.x)) {
      return false;
    }

    const aStart = getSegmentStart(aCommands, aIndex);
    const bStart = getSegmentStart(bCommands, bIndex);
    if (!aStart || !bStart || !isNumericValue(aStart.x) || !isNumericValue(bStart.x)) {
      return false;
    }

    return approximatelyEqual(aStart.x, bStart.x) && approximatelyEqual(aCommand.x, bCommand.x);
  }

  if (aType === 'Z') {
    return true;
  }

  const aStart = getSegmentStart(aCommands, aIndex);
  const bStart = getSegmentStart(bCommands, bIndex);
  if (
    !aStart ||
    !bStart ||
    !isNumericValue(aStart.x) ||
    !isNumericValue(bStart.x) ||
    !isNumericValue(aCommand.x) ||
    !isNumericValue(bCommand.x)
  ) {
    return false;
  }

  if (!approximatelyEqual(aStart.x, bStart.x) || !approximatelyEqual(aCommand.x, bCommand.x)) {
    return false;
  }

  const yKeys = typeMap[aCommand.type].filter((key) => key.toLowerCase().startsWith('y'));
  return yKeys.every((key) => {
    const aValue = aCommand[key];
    const bValue = bCommand[key];
    return isNumericValue(aValue) && isNumericValue(bValue)
      ? approximatelyEqual(aValue, bValue)
      : aValue === bValue;
  });
}

function findMatchingCommandPairs(aCommands: PathCommand[], bCommands: PathCommand[]): MatchPair[] {
  const aLength = aCommands.length;
  const bLength = bCommands.length;

  if (aLength === 0 || bLength === 0) {
    return [];
  }

  const lcs = Array.from({ length: aLength + 1 }, () => arrayOfLength<number>(bLength + 1, 0));

  for (let aIndex = 1; aIndex <= aLength; aIndex++) {
    for (let bIndex = 1; bIndex <= bLength; bIndex++) {
      if (commandsMatchAsAnchors(aCommands, bCommands, aIndex - 1, bIndex - 1)) {
        lcs[aIndex][bIndex] = lcs[aIndex - 1][bIndex - 1] + 1;
      } else {
        lcs[aIndex][bIndex] = Math.max(lcs[aIndex - 1][bIndex], lcs[aIndex][bIndex - 1]);
      }
    }
  }

  const matches: MatchPair[] = [];
  let aIndex = aLength;
  let bIndex = bLength;

  while (aIndex > 0 && bIndex > 0) {
    if (
      commandsMatchAsAnchors(aCommands, bCommands, aIndex - 1, bIndex - 1) &&
      lcs[aIndex][bIndex] === lcs[aIndex - 1][bIndex - 1] + 1
    ) {
      matches.push({ aIndex: aIndex - 1, bIndex: bIndex - 1 });
      aIndex -= 1;
      bIndex -= 1;
    } else if (lcs[aIndex - 1][bIndex] >= lcs[aIndex][bIndex - 1]) {
      aIndex -= 1;
    } else {
      bIndex -= 1;
    }
  }

  matches.reverse();
  return matches;
}

function filterStableMatchRuns(
  matches: MatchPair[],
  aCommands: PathCommand[],
  bCommands: PathCommand[],
): MatchPair[] {
  if (matches.length === 0) {
    return matches;
  }

  const filtered: MatchPair[] = [];
  let runStart = 0;

  while (runStart < matches.length) {
    let runEnd = runStart;
    while (
      runEnd + 1 < matches.length &&
      matches[runEnd + 1].aIndex === matches[runEnd].aIndex + 1 &&
      matches[runEnd + 1].bIndex === matches[runEnd].bIndex + 1
    ) {
      runEnd += 1;
    }

    const runLength = runEnd - runStart + 1;
    const matchTypeA = aCommands[matches[runStart].aIndex].type.toUpperCase();
    const matchTypeB = bCommands[matches[runStart].bIndex].type.toUpperCase();

    if (
      runLength > 1 ||
      SINGLE_MATCH_STRUCTURAL_TYPES.has(matchTypeA) ||
      SINGLE_MATCH_STRUCTURAL_TYPES.has(matchTypeB)
    ) {
      filtered.push(...matches.slice(runStart, runEnd + 1));
    }

    runStart = runEnd + 1;
  }

  return filtered;
}

function lineSegmentToCubicCommand(
  segmentStart: PathCommand,
  segmentEnd: PathCommand,
): PathCommand | null {
  if (
    !isNumericValue(segmentStart.x) ||
    !isNumericValue(segmentStart.y) ||
    !isNumericValue(segmentEnd.x) ||
    !isNumericValue(segmentEnd.y)
  ) {
    return null;
  }

  const deltaX = segmentEnd.x - segmentStart.x;
  const deltaY = segmentEnd.y - segmentStart.y;

  return {
    type: 'C',
    x1: segmentStart.x + deltaX / 3,
    y1: segmentStart.y + deltaY / 3,
    x2: segmentStart.x + (2 * deltaX) / 3,
    y2: segmentStart.y + (2 * deltaY) / 3,
    x: segmentEnd.x,
    y: segmentEnd.y,
  };
}

const DENSE_VERTICAL_BRIDGE_X_THRESHOLD = 8;

function promoteSharedLineBridgesToCurves(
  aCommands: PathCommand[],
  bCommands: PathCommand[],
): void {
  if (aCommands.length !== bCommands.length || aCommands.length < 3) {
    return;
  }

  for (let i = 1; i < aCommands.length - 1; i++) {
    const aCurrent = aCommands[i];
    const bCurrent = bCommands[i];
    if (aCurrent.type.toUpperCase() !== 'L' || bCurrent.type.toUpperCase() !== 'L') {
      continue;
    }

    const aPrev = aCommands[i - 1];
    const aNext = aCommands[i + 1];
    const bPrev = bCommands[i - 1];
    const bNext = bCommands[i + 1];
    if (
      !isNumericValue(aPrev.x) ||
      !isNumericValue(aCurrent.x) ||
      !isNumericValue(aNext.x) ||
      !isNumericValue(bPrev.x) ||
      !isNumericValue(bCurrent.x) ||
      !isNumericValue(bNext.x)
    ) {
      continue;
    }

    const aIsVerticalLine = approximatelyEqual(aPrev.x, aCurrent.x);
    const bIsVerticalLine = approximatelyEqual(bPrev.x, bCurrent.x);
    if (!aIsVerticalLine || !bIsVerticalLine) {
      continue;
    }

    const aNextStep = Math.abs(aNext.x - aCurrent.x);
    const bNextStep = Math.abs(bNext.x - bCurrent.x);
    const hasDenseBridgeContinuation =
      aNextStep <= DENSE_VERTICAL_BRIDGE_X_THRESHOLD &&
      bNextStep <= DENSE_VERTICAL_BRIDGE_X_THRESHOLD;
    if (!hasDenseBridgeContinuation) {
      continue;
    }

    const aAsCurve = lineSegmentToCubicCommand(aPrev, aCurrent);
    const bAsCurve = lineSegmentToCubicCommand(bPrev, bCurrent);
    if (!aAsCurve || !bAsCurve) {
      continue;
    }

    aCommands[i] = aAsCurve;
    bCommands[i] = bAsCurve;
  }
}

function promoteDenseClosingBridgesToCurves(
  aCommands: PathCommand[],
  bCommands: PathCommand[],
  isClosedPath: boolean,
): void {
  if (!isClosedPath || aCommands.length !== bCommands.length || aCommands.length < 3) {
    return;
  }

  const aMove = aCommands[0];
  const bMove = bCommands[0];
  const aEnd = aCommands[aCommands.length - 1];
  const bEnd = bCommands[bCommands.length - 1];
  const aFirstSegment = aCommands[1];
  const bFirstSegment = bCommands[1];
  if (
    !isNumericValue(aMove.x) ||
    !isNumericValue(aMove.y) ||
    !isNumericValue(bMove.x) ||
    !isNumericValue(bMove.y) ||
    !isNumericValue(aEnd.x) ||
    !isNumericValue(aEnd.y) ||
    !isNumericValue(bEnd.x) ||
    !isNumericValue(bEnd.y) ||
    !isNumericValue(aFirstSegment.x) ||
    !isNumericValue(bFirstSegment.x)
  ) {
    return;
  }

  const aHasVerticalClose = approximatelyEqual(aEnd.x, aMove.x);
  const bHasVerticalClose = approximatelyEqual(bEnd.x, bMove.x);
  if (!aHasVerticalClose || !bHasVerticalClose) {
    return;
  }

  const aStartStep = Math.abs(aFirstSegment.x - aMove.x);
  const bStartStep = Math.abs(bFirstSegment.x - bMove.x);
  const hasDenseStartContinuation =
    aStartStep <= DENSE_VERTICAL_BRIDGE_X_THRESHOLD &&
    bStartStep <= DENSE_VERTICAL_BRIDGE_X_THRESHOLD;
  if (!hasDenseStartContinuation) {
    return;
  }

  const aClosingCurve = lineSegmentToCubicCommand(aEnd, aMove);
  const bClosingCurve = lineSegmentToCubicCommand(bEnd, bMove);
  if (!aClosingCurve || !bClosingCurve) {
    return;
  }

  aCommands.push(aClosingCurve);
  bCommands.push(bClosingCurve);
}

/**
 * Converts a command object to a string to be used in a `d` attribute.
 */
function commandToString(command: PathCommand): string {
  return `${command.type}${typeMap[command.type].map((p) => roundValue(command[p] as number)).join(',')}`;
}

/**
 * Converts command A to have the same type as command B.
 *
 * e.g., L0,5 -> C0,5,0,5,0,5
 *
 * Uses these rules:
 * x1 <- x
 * x2 <- x
 * y1 <- y
 * y2 <- y
 * rx <- 0
 * ry <- 0
 * xAxisRotation <- read from B
 * largeArcFlag <- read from B
 * sweepFlag <- read from B
 */
function convertToSameType(aCommand: PathCommand, bCommand: PathCommand): PathCommand {
  const conversionMap: Record<string, string> = {
    x1: 'x',
    y1: 'y',
    x2: 'x',
    y2: 'y',
  };

  const readFromBKeys = ['xAxisRotation', 'largeArcFlag', 'sweepFlag'];

  // convert (but ignore M types)
  if (aCommand.type !== bCommand.type && bCommand.type.toUpperCase() !== 'M') {
    const aConverted: Partial<PathCommand> = {};
    Object.keys(bCommand).forEach((bKey) => {
      const bValue = bCommand[bKey];
      let aValue: unknown = aCommand[bKey];

      if (aValue === undefined) {
        if (readFromBKeys.includes(bKey)) {
          aValue = bValue;
        } else {
          if (aValue === undefined && conversionMap[bKey]) {
            aValue = aCommand[conversionMap[bKey]];
          }
          if (aValue === undefined) {
            aValue = 0;
          }
        }
      }

      (aConverted as Record<string, unknown>)[bKey] = aValue;
    });

    aConverted.type = bCommand.type;
    aCommand = aConverted as PathCommand;
  }

  return aCommand;
}

/**
 * Interpolate between command objects commandStart and commandEnd segmentCount times.
 * If the types are L, Q, or C then the curves are split as per de Casteljau's algorithm.
 * Otherwise we just copy commandStart segmentCount - 1 times, finally ending with commandEnd.
 */
function splitSegment(
  commandStart: PathCommand,
  commandEnd: PathCommand,
  segmentCount: number,
  targetCommands?: PathCommand[],
): PathCommand[] {
  if (segmentCount <= 0) {
    return [];
  }

  let segments: PathCommand[] = [];

  if (commandEnd.type === 'L' || commandEnd.type === 'Q' || commandEnd.type === 'C') {
    const targetXs = targetCommands?.map((command) =>
      isNumericValue(command.x) ? command.x : Number.NaN,
    );
    const hasValidTargetXs =
      targetXs != null &&
      targetXs.length === segmentCount &&
      targetXs.every((xValue) => Number.isFinite(xValue)) &&
      isNumericValue(commandStart.x) &&
      isNumericValue(commandEnd.x) &&
      !approximatelyEqual(commandStart.x, commandEnd.x) &&
      targetXs.every((xValue) => {
        const minX = Math.min(commandStart.x!, commandEnd.x!) - match_tolerance;
        const maxX = Math.max(commandStart.x!, commandEnd.x!) + match_tolerance;
        return xValue >= minX && xValue <= maxX;
      }) &&
      targetXs.every((xValue, index) => {
        if (index === 0) {
          return true;
        }

        const previous = targetXs[index - 1];
        if (commandEnd.x! > commandStart.x!) {
          return xValue >= previous - match_tolerance;
        }

        return xValue <= previous + match_tolerance;
      });

    if (hasValidTargetXs) {
      segments = segments.concat(
        splitCurveToTargetXs(commandStart, commandEnd, targetXs as number[]),
      );
    } else {
      segments = segments.concat(splitCurve(commandStart, commandEnd, segmentCount));
    }
  } else {
    const copyCommand = Object.assign({}, commandStart);

    if (copyCommand.type === 'M') {
      copyCommand.type = 'L';
    }

    segments = segments.concat(arrayOfLength<PathCommand>(segmentCount - 1).map(() => copyCommand));
    segments.push(commandEnd);
  }

  return segments;
}

function getPathXDirection(commands: PathCommand[]): -1 | 0 | 1 {
  let direction: -1 | 0 | 1 = 0;

  for (let i = 1; i < commands.length; i++) {
    const previousX = commands[i - 1].x;
    const currentX = commands[i].x;
    if (!isNumericValue(previousX) || !isNumericValue(currentX)) {
      return 0;
    }

    const deltaX = currentX - previousX;
    if (Math.abs(deltaX) <= match_tolerance) {
      continue;
    }

    const stepDirection: -1 | 1 = deltaX > 0 ? 1 : -1;
    if (direction === 0) {
      direction = stepDirection;
    } else if (direction !== stepDirection) {
      return 0;
    }
  }

  return direction;
}

function mapReferenceSegmentsByXRange(
  commandsToExtend: PathCommand[],
  referenceCommands: PathCommand[],
): number[] | null {
  const numSegmentsToExtend = commandsToExtend.length - 1;
  const numReferenceSegments = referenceCommands.length - 1;
  if (numSegmentsToExtend <= 0 || numReferenceSegments <= 0) {
    return null;
  }

  if (!commandsToExtend.every((command) => isNumericValue(command.x))) {
    return null;
  }
  if (!referenceCommands.every((command) => isNumericValue(command.x))) {
    return null;
  }

  const extendDirection = getPathXDirection(commandsToExtend);
  const referenceDirection = getPathXDirection(referenceCommands);
  if (extendDirection === 0 || referenceDirection === 0 || extendDirection !== referenceDirection) {
    return null;
  }

  const segmentIndices: number[] = [];
  let searchStart = 0;

  for (let i = 0; i < numReferenceSegments; i++) {
    const targetX = referenceCommands[i + 1].x!;
    let matchedIndex = -1;

    for (let segmentIndex = searchStart; segmentIndex < numSegmentsToExtend; segmentIndex++) {
      const segmentStartX = commandsToExtend[segmentIndex].x!;
      const segmentEndX = commandsToExtend[segmentIndex + 1].x!;
      const minX = Math.min(segmentStartX, segmentEndX) - match_tolerance;
      const maxX = Math.max(segmentStartX, segmentEndX) + match_tolerance;

      if (targetX >= minX && targetX <= maxX) {
        matchedIndex = segmentIndex;
        break;
      }
    }

    if (matchedIndex < 0) {
      return null;
    }

    segmentIndices.push(matchedIndex);
    searchStart = matchedIndex;
  }

  return segmentIndices;
}

function distributeReferenceSegmentsByMagnitude(
  commandsToExtend: PathCommand[],
  referenceCommands: PathCommand[],
): number[] | null {
  const numSegmentsToExtend = commandsToExtend.length - 1;
  const numReferenceSegments = referenceCommands.length - 1;
  if (numSegmentsToExtend <= 0 || numReferenceSegments < numSegmentsToExtend) {
    return null;
  }

  const segmentMagnitudes = arrayOfLength<number>(numSegmentsToExtend).map((_value, index) => {
    const segmentStart = commandsToExtend[index];
    const segmentEnd = commandsToExtend[index + 1];

    if (isNumericValue(segmentStart.y) && isNumericValue(segmentEnd.y)) {
      return Math.abs(segmentEnd.y - segmentStart.y);
    }
    if (isNumericValue(segmentStart.x) && isNumericValue(segmentEnd.x)) {
      return Math.abs(segmentEnd.x - segmentStart.x);
    }
    return 0;
  });

  if (segmentMagnitudes.every((value) => value <= match_tolerance)) {
    return null;
  }

  const countsPerSegment = arrayOfLength<number>(numSegmentsToExtend, 1);
  let remainingSegments = numReferenceSegments - numSegmentsToExtend;
  const orderedSegmentIndices = arrayOfLength<number>(numSegmentsToExtend).map(
    (_value, index) => index,
  );
  orderedSegmentIndices.sort((leftIndex, rightIndex) => {
    const magnitudeDelta = segmentMagnitudes[rightIndex] - segmentMagnitudes[leftIndex];
    if (Math.abs(magnitudeDelta) > match_tolerance) {
      return magnitudeDelta;
    }
    return leftIndex - rightIndex;
  });

  let orderIndex = 0;
  while (remainingSegments > 0) {
    countsPerSegment[orderedSegmentIndices[orderIndex]] += 1;
    remainingSegments -= 1;
    orderIndex = (orderIndex + 1) % orderedSegmentIndices.length;
  }

  const segmentIndices: number[] = [];
  countsPerSegment.forEach((count, segmentIndex) => {
    for (let i = 0; i < count; i++) {
      segmentIndices.push(segmentIndex);
    }
  });

  return segmentIndices.length === numReferenceSegments ? segmentIndices : null;
}

/**
 * Extends an array of commandsToExtend to the length of the referenceCommands by
 * splitting segments until the number of commands match.
 */
function extend(
  commandsToExtend: PathCommand[],
  referenceCommands: PathCommand[],
  excludeSegment?: ExcludeSegmentFn,
): PathCommand[] {
  const numSegmentsToExtend = commandsToExtend.length - 1;
  const numReferenceSegments = referenceCommands.length - 1;
  const segmentRatio = numSegmentsToExtend / numReferenceSegments;
  const targetCommandsPerSegment: PathCommand[][] = [];
  const segmentIndicesByMagnitude = distributeReferenceSegmentsByMagnitude(
    commandsToExtend,
    referenceCommands,
  );
  const xRangeSegmentIndices =
    segmentIndicesByMagnitude == null
      ? mapReferenceSegmentsByXRange(commandsToExtend, referenceCommands)
      : null;
  const fixedSegmentIndices = segmentIndicesByMagnitude ?? xRangeSegmentIndices;

  const countPointsPerSegment = arrayOfLength<undefined>(numReferenceSegments).reduce(
    (accum: number[], _d: undefined, i: number) => {
      let insertIndex =
        fixedSegmentIndices == null ? Math.floor(segmentRatio * i) : fixedSegmentIndices[i];

      if (
        fixedSegmentIndices == null &&
        excludeSegment &&
        insertIndex < commandsToExtend.length - 1 &&
        excludeSegment(commandsToExtend[insertIndex], commandsToExtend[insertIndex + 1])
      ) {
        const addToPriorSegment = (segmentRatio * i) % 1 < 0.5;

        if (accum[insertIndex]) {
          if (addToPriorSegment) {
            if (insertIndex > 0) {
              insertIndex -= 1;
            } else if (insertIndex < commandsToExtend.length - 1) {
              insertIndex += 1;
            }
          } else if (insertIndex < commandsToExtend.length - 1) {
            insertIndex += 1;
          } else if (insertIndex > 0) {
            insertIndex -= 1;
          }
        }
      }

      accum[insertIndex] = (accum[insertIndex] || 0) + 1;
      if (!targetCommandsPerSegment[insertIndex]) {
        targetCommandsPerSegment[insertIndex] = [];
      }
      targetCommandsPerSegment[insertIndex].push(referenceCommands[i + 1]);

      return accum;
    },
    [] as number[],
  );

  const extended = countPointsPerSegment.reduce(
    (ext: PathCommand[], segmentCount: number, i: number) => {
      if (i === commandsToExtend.length - 1) {
        const lastCommandTemplate = Object.assign(
          {},
          commandsToExtend[commandsToExtend.length - 1],
        );
        if (isNumericValue(lastCommandTemplate.x) && isNumericValue(lastCommandTemplate.y)) {
          if (lastCommandTemplate.x1 !== undefined) {
            lastCommandTemplate.x1 = lastCommandTemplate.x;
          }
          if (lastCommandTemplate.y1 !== undefined) {
            lastCommandTemplate.y1 = lastCommandTemplate.y;
          }
          if (lastCommandTemplate.x2 !== undefined) {
            lastCommandTemplate.x2 = lastCommandTemplate.x;
          }
          if (lastCommandTemplate.y2 !== undefined) {
            lastCommandTemplate.y2 = lastCommandTemplate.y;
          }
        }

        const lastCommandCopies = arrayOfLength<undefined>(segmentCount).map(
          () => ({ ...lastCommandTemplate }) as PathCommand,
        );

        if (lastCommandCopies[0].type === 'M') {
          lastCommandCopies.forEach((d) => {
            d.type = 'L';
          });
        }
        return ext.concat(lastCommandCopies);
      }

      return ext.concat(
        splitSegment(
          commandsToExtend[i],
          commandsToExtend[i + 1],
          segmentCount,
          commandsToExtend.length > 2 ? targetCommandsPerSegment[i] : undefined,
        ),
      );
    },
    [] as PathCommand[],
  );

  extended.unshift(commandsToExtend[0]);

  return extended;
}

function alignCommandSlice(
  aCommandsInput: PathCommand[],
  bCommandsInput: PathCommand[],
  excludeSegment?: ExcludeSegmentFn,
): { aCommands: PathCommand[]; bCommands: PathCommand[] } {
  let aCommands = aCommandsInput.slice();
  let bCommands = bCommandsInput.slice();

  if (!aCommands.length && !bCommands.length) {
    return { aCommands, bCommands };
  }

  if (!aCommands.length) {
    aCommands.push(bCommands[0]);
  } else if (!bCommands.length) {
    bCommands.push(aCommands[0]);
  }

  if (aCommands.length !== bCommands.length) {
    if (bCommands.length > aCommands.length) {
      aCommands = extend(aCommands, bCommands, excludeSegment);
    } else {
      bCommands = extend(bCommands, aCommands, excludeSegment);
    }
  }

  return { aCommands, bCommands };
}

function alignCommandsByMatches(
  aCommandsInput: PathCommand[],
  bCommandsInput: PathCommand[],
  excludeSegment?: ExcludeSegmentFn,
): { aCommands: PathCommand[]; bCommands: PathCommand[] } {
  if (!aCommandsInput.length || !bCommandsInput.length) {
    return alignCommandSlice(aCommandsInput, bCommandsInput, excludeSegment);
  }

  let matches = filterStableMatchRuns(
    findMatchingCommandPairs(aCommandsInput, bCommandsInput),
    aCommandsInput,
    bCommandsInput,
  );
  if (matches.length === 0 || matches[0].aIndex !== 0 || matches[0].bIndex !== 0) {
    matches = [{ aIndex: 0, bIndex: 0 }, ...matches];
  }

  const aAligned: PathCommand[] = [];
  const bAligned: PathCommand[] = [];

  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i];
    const nextMatch = matches[i + 1];
    const aSlice = aCommandsInput.slice(
      currentMatch.aIndex,
      nextMatch ? nextMatch.aIndex : aCommandsInput.length,
    );
    const bSlice = bCommandsInput.slice(
      currentMatch.bIndex,
      nextMatch ? nextMatch.bIndex : bCommandsInput.length,
    );

    if (aSlice.length === 0 && bSlice.length === 0) {
      continue;
    }

    const alignedSlice = alignCommandSlice(aSlice, bSlice, excludeSegment);
    aAligned.push(...alignedSlice.aCommands);
    bAligned.push(...alignedSlice.bCommands);
  }

  if (aAligned.length === 0 && bAligned.length === 0) {
    return alignCommandSlice(aCommandsInput, bCommandsInput, excludeSegment);
  }

  return { aCommands: aAligned, bCommands: bAligned };
}

type SlideWindowAlignment = {
  xShift: number;
  matchedCurvePrefixCommandCount: number;
};

function interpolateCommandValues(
  aCommand: PathCommand,
  bCommand: PathCommand,
  t: number,
): PathCommand {
  const interpolated: PathCommand = { ...aCommand };

  for (const arg of typeMap[interpolated.type]) {
    interpolated[arg] = (1 - t) * (aCommand[arg] as number) + t * (bCommand[arg] as number);

    if (arg === 'largeArcFlag' || arg === 'sweepFlag') {
      interpolated[arg] = Math.round(interpolated[arg] as number);
    }
  }

  return interpolated;
}

function shiftCommandX(command: PathCommand, xOffset: number): PathCommand {
  const shifted: PathCommand = { ...command };

  if (isNumericValue(shifted.x)) {
    shifted.x += xOffset;
  }
  if (isNumericValue(shifted.x1)) {
    shifted.x1 += xOffset;
  }
  if (isNumericValue(shifted.x2)) {
    shifted.x2 += xOffset;
  }

  return shifted;
}

function detectSlideWindowAlignment(
  aCommands: PathCommand[],
  bCommands: PathCommand[],
): SlideWindowAlignment | null {
  if (aCommands.length < 3 || aCommands.length !== bCommands.length) {
    return null;
  }

  if (aCommands[0].type !== 'M' || bCommands[0].type !== 'M') {
    return null;
  }

  let matchedCurvePrefixCommandCount = 1;
  while (
    matchedCurvePrefixCommandCount < aCommands.length &&
    aCommands[matchedCurvePrefixCommandCount].type === 'C' &&
    bCommands[matchedCurvePrefixCommandCount].type === 'C'
  ) {
    matchedCurvePrefixCommandCount += 1;
  }

  const segmentCount = matchedCurvePrefixCommandCount - 1;
  if (segmentCount < 2) {
    return null;
  }

  if (
    matchedCurvePrefixCommandCount < aCommands.length &&
    aCommands[matchedCurvePrefixCommandCount].type !==
      bCommands[matchedCurvePrefixCommandCount].type
  ) {
    return null;
  }

  let xShift: number | null = null;
  for (let i = 1; i < segmentCount; i++) {
    const aNext = aCommands[i + 1];
    const bCurrent = bCommands[i];

    if (
      !isNumericValue(aNext.x) ||
      !isNumericValue(bCurrent.x) ||
      !isNumericValue(aNext.x1) ||
      !isNumericValue(bCurrent.x1) ||
      !isNumericValue(aNext.x2) ||
      !isNumericValue(bCurrent.x2) ||
      !isNumericValue(aNext.y) ||
      !isNumericValue(bCurrent.y) ||
      !isNumericValue(aNext.y1) ||
      !isNumericValue(bCurrent.y1) ||
      !isNumericValue(aNext.y2) ||
      !isNumericValue(bCurrent.y2)
    ) {
      return null;
    }

    const endpointShift = aNext.x - bCurrent.x;
    if (xShift == null) {
      xShift = endpointShift;
    }

    if (
      !approximatelyEqual(endpointShift, xShift, match_tolerance) ||
      !approximatelyEqual(aNext.x1 - bCurrent.x1, xShift, match_tolerance) ||
      !approximatelyEqual(aNext.x2 - bCurrent.x2, xShift, match_tolerance) ||
      !approximatelyEqual(aNext.y1, bCurrent.y1, match_tolerance) ||
      !approximatelyEqual(aNext.y2, bCurrent.y2, match_tolerance) ||
      !approximatelyEqual(aNext.y, bCurrent.y, match_tolerance)
    ) {
      return null;
    }
  }

  if (!isNumericValue(xShift) || Math.abs(xShift) <= match_tolerance) {
    return null;
  }

  return { xShift, matchedCurvePrefixCommandCount };
}

function interpolateSlideWindowCommands(
  aCommands: PathCommand[],
  bCommands: PathCommand[],
  t: number,
  alignment: SlideWindowAlignment,
): PathCommand[] {
  const segmentCount = aCommands.length - 1;
  const moveTo = interpolateCommandValues(aCommands[0], bCommands[0], t);

  const firstSplit = splitCurveAtT(aCommands[0], aCommands[1], t);
  const firstEdge = shiftCommandX(firstSplit.right, -alignment.xShift * t);

  const middleSegments: PathCommand[] = [];
  for (let i = 1; i < segmentCount; i++) {
    middleSegments.push(interpolateCommandValues(aCommands[i + 1], bCommands[i], t));
  }

  const lastSplit = splitCurveAtT(bCommands[segmentCount - 1], bCommands[segmentCount], t);
  const lastEdge = shiftCommandX(lastSplit.left, alignment.xShift * (1 - t));

  return [moveTo, firstEdge, ...middleSegments, lastEdge];
}

/**
 * Takes a path `d` string and converts it into an array of command objects.
 */
export function pathCommandsFromString(d: string | null | undefined): PathCommand[] {
  const tokens = (d || '').match(commandTokenRegex) || [];
  const commands: PathCommand[] = [];
  let commandArgs: string[] | undefined;
  let command: Partial<PathCommand> | undefined;

  for (let i = 0; i < tokens.length; ++i) {
    commandArgs = typeMap[tokens[i]];

    if (commandArgs) {
      command = {
        type: tokens[i] as CommandType,
      };

      for (let a = 0; a < commandArgs.length; ++a) {
        (command as Record<string, unknown>)[commandArgs[a]] = +tokens[i + a + 1];
      }

      i += commandArgs.length;

      commands.push(command as PathCommand);
    }
  }
  return commands;
}

/**
 * Splits an array of path commands into sub-paths at internal M commands.
 * Each sub-path starts with an M command.
 */
function splitIntoSubPaths(commands: PathCommand[]): PathCommand[][] {
  if (commands.length === 0) return [];

  const subPaths: PathCommand[][] = [];
  let current: PathCommand[] = [];

  for (const cmd of commands) {
    if (cmd.type === 'M' && current.length > 0) {
      subPaths.push(current);
      current = [];
    }
    current.push(cmd);
  }

  if (current.length > 0) {
    subPaths.push(current);
  }

  return subPaths;
}

/**
 * Checks whether a set of commands contains multiple sub-paths (internal M commands).
 */
function hasMultipleSubPaths(commands: PathCommand[]): boolean {
  let mCount = 0;
  for (const cmd of commands) {
    if (cmd.type === 'M') {
      mCount++;
      if (mCount > 1) return true;
    }
  }
  return false;
}

/**
 * Interpolate from A to B by extending A and B during interpolation to have
 * the same number of points. This allows for a smooth transition when they
 * have a different number of points.
 *
 * Ignores the `Z` command in paths unless both A and B end with it.
 *
 * This function works directly with arrays of command objects instead of with
 * path `d` strings (see interpolatePath for working with `d` strings).
 */
export function interpolatePathCommands(
  aCommandsInput: PathCommand[] | null | undefined,
  bCommandsInput: PathCommand[] | null | undefined,
  interpolateOptions?: ExcludeSegmentFn | InterpolateOptions,
): (t: number) => PathCommand[] {
  let aCommands = aCommandsInput == null ? [] : aCommandsInput.slice();
  let bCommands = bCommandsInput == null ? [] : bCommandsInput.slice();

  const { excludeSegment, snapEndsToInput } =
    typeof interpolateOptions === 'object'
      ? interpolateOptions
      : {
          excludeSegment: interpolateOptions as ExcludeSegmentFn | undefined,
          snapEndsToInput: true,
        };

  if (!aCommands.length && !bCommands.length) {
    return function nullInterpolator() {
      return [];
    };
  }

  const addZ =
    (aCommands.length === 0 || aCommands[aCommands.length - 1].type === 'Z') &&
    (bCommands.length === 0 || bCommands[bCommands.length - 1].type === 'Z');

  if (aCommands.length > 0 && aCommands[aCommands.length - 1].type === 'Z') {
    aCommands.pop();
  }
  if (bCommands.length > 0 && bCommands[bCommands.length - 1].type === 'Z') {
    bCommands.pop();
  }

  if (!aCommands.length) {
    aCommands.push(bCommands[0]);
  } else if (!bCommands.length) {
    bCommands.push(aCommands[0]);
  }

  const slideAlignment = detectSlideWindowAlignment(aCommands, bCommands);
  if (slideAlignment) {
    const slideWindowACommands = aCommands.slice(0, slideAlignment.matchedCurvePrefixCommandCount);
    const slideWindowBCommands = bCommands.slice(0, slideAlignment.matchedCurvePrefixCommandCount);

    return function slideWindowInterpolator(t: number): PathCommand[] {
      if (t === 1 && snapEndsToInput) {
        return bCommandsInput == null ? [] : bCommandsInput;
      }

      if (t === 0) {
        if (addZ) {
          return [...aCommands, { type: 'Z' } as PathCommand];
        }

        return aCommands;
      }

      const interpolated = interpolateSlideWindowCommands(
        slideWindowACommands,
        slideWindowBCommands,
        t,
        slideAlignment,
      );
      for (let i = slideAlignment.matchedCurvePrefixCommandCount; i < aCommands.length; i++) {
        const aCommand = aCommands[i];
        const bCommand = bCommands[i];
        const aInterpolatedCommand =
          aCommand.type === bCommand.type ? aCommand : convertToSameType(aCommand, bCommand);
        interpolated.push(interpolateCommandValues(aInterpolatedCommand, bCommand, t));
      }

      if (addZ) {
        return [...interpolated, { type: 'Z' } as PathCommand];
      }

      return interpolated;
    };
  }

  ({ aCommands, bCommands } = alignCommandsByMatches(aCommands, bCommands, excludeSegment));

  if (aCommands.length !== bCommands.length) {
    if (bCommands.length > aCommands.length) {
      aCommands = extend(aCommands, bCommands, excludeSegment);
    } else {
      bCommands = extend(bCommands, aCommands, excludeSegment);
    }
  }

  promoteSharedLineBridgesToCurves(aCommands, bCommands);
  promoteDenseClosingBridgesToCurves(aCommands, bCommands, addZ);

  aCommands = aCommands.map((aCommand, i) => convertToSameType(aCommand, bCommands[i]));

  const interpolatedCommands = aCommands.map((aCommand) => ({ ...aCommand }));

  if (addZ) {
    interpolatedCommands.push({ type: 'Z' } as PathCommand);
    aCommands.push({ type: 'Z' } as PathCommand);
  }

  return function pathCommandInterpolator(t: number): PathCommand[] {
    if (t === 1 && snapEndsToInput) {
      return bCommandsInput == null ? [] : bCommandsInput;
    }

    if (t === 0) {
      return aCommands;
    }

    for (let i = 0; i < interpolatedCommands.length; ++i) {
      const aCommand = aCommands[i];
      const bCommand = bCommands[i];
      const interpolatedCommand = interpolatedCommands[i];
      for (const arg of typeMap[interpolatedCommand.type]) {
        interpolatedCommand[arg] =
          (1 - t) * (aCommand[arg] as number) + t * (bCommand[arg] as number);

        if (arg === 'largeArcFlag' || arg === 'sweepFlag') {
          interpolatedCommand[arg] = Math.round(interpolatedCommand[arg] as number);
        }
      }
    }

    return interpolatedCommands;
  };
}

/**
 * Interpolate from A to B by extending A and B during interpolation to have
 * the same number of points. This allows for a smooth transition when they
 * have a different number of points.
 *
 * Ignores the `Z` character in paths unless both A and B end with it.
 *
 * Handles multi-segment paths (paths with gaps / multiple M commands) by
 * splitting into sub-paths and interpolating each pair independently.
 */
export function interpolatePath(
  a: string | null | undefined,
  b: string | null | undefined,
  interpolateOptions?: ExcludeSegmentFn | InterpolateOptions,
): (t: number) => string {
  const aCommands = pathCommandsFromString(a);
  const bCommands = pathCommandsFromString(b);

  const { excludeSegment, snapEndsToInput } =
    typeof interpolateOptions === 'object'
      ? interpolateOptions
      : {
          excludeSegment: interpolateOptions as ExcludeSegmentFn | undefined,
          snapEndsToInput: true,
        };

  if (!aCommands.length && !bCommands.length) {
    return function nullInterpolator() {
      return '';
    };
  }

  // Handle multi-segment paths (gaps) by splitting and interpolating independently
  const aHasMulti = hasMultipleSubPaths(aCommands);
  const bHasMulti = hasMultipleSubPaths(bCommands);

  if (aHasMulti || bHasMulti) {
    const aSubPaths = splitIntoSubPaths(aCommands);
    const bSubPaths = splitIntoSubPaths(bCommands);
    const pairCount = Math.max(aSubPaths.length, bSubPaths.length);
    const subInterpolators: Array<(t: number) => PathCommand[]> = [];

    for (let i = 0; i < pairCount; i++) {
      const aSub = aSubPaths[i] ?? null;
      const bSub = bSubPaths[i] ?? null;
      subInterpolators.push(
        interpolatePathCommands(aSub, bSub, { excludeSegment, snapEndsToInput }),
      );
    }

    return function multiPathStringInterpolator(t: number): string {
      if (t === 1 && snapEndsToInput) {
        return b == null ? '' : b;
      }

      let result = '';
      for (const sub of subInterpolators) {
        const cmds = sub(t);
        for (const cmd of cmds) {
          result += commandToString(cmd);
        }
      }
      return result;
    };
  }

  // Single-path case
  const commandInterpolator = interpolatePathCommands(aCommands, bCommands, {
    excludeSegment,
    snapEndsToInput,
  });

  return function pathStringInterpolator(t: number): string {
    if (t === 1 && snapEndsToInput) {
      return b == null ? '' : b;
    }

    const interpolatedCommands = commandInterpolator(t);

    let interpolatedString = '';
    for (const interpolatedCommand of interpolatedCommands) {
      interpolatedString += commandToString(interpolatedCommand);
    }

    return interpolatedString;
  };
}
