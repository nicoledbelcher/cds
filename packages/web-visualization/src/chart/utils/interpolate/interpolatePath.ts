import { splitCurve } from './split';
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

function roundValue(value: number): number {
  return Math.round(value * ROUND_FACTOR) / ROUND_FACTOR;
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
): PathCommand[] {
  let segments: PathCommand[] = [];

  if (commandEnd.type === 'L' || commandEnd.type === 'Q' || commandEnd.type === 'C') {
    segments = segments.concat(splitCurve(commandStart, commandEnd, segmentCount));
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

  const countPointsPerSegment = arrayOfLength<undefined>(numReferenceSegments).reduce(
    (accum: number[], _d: undefined, i: number) => {
      let insertIndex = Math.floor(segmentRatio * i);

      if (
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

      return accum;
    },
    [] as number[],
  );

  const extended = countPointsPerSegment.reduce(
    (ext: PathCommand[], segmentCount: number, i: number) => {
      if (i === commandsToExtend.length - 1) {
        const lastCommandCopies = arrayOfLength<PathCommand>(
          segmentCount,
          Object.assign({}, commandsToExtend[commandsToExtend.length - 1]),
        );

        if (lastCommandCopies[0].type === 'M') {
          lastCommandCopies.forEach((d) => {
            d.type = 'L';
          });
        }
        return ext.concat(lastCommandCopies);
      }

      return ext.concat(splitSegment(commandsToExtend[i], commandsToExtend[i + 1], segmentCount));
    },
    [] as PathCommand[],
  );

  extended.unshift(commandsToExtend[0]);

  return extended;
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

  const numPointsToExtend = Math.abs(bCommands.length - aCommands.length);

  if (numPointsToExtend !== 0) {
    if (bCommands.length > aCommands.length) {
      aCommands = extend(aCommands, bCommands, excludeSegment);
    } else if (bCommands.length < aCommands.length) {
      bCommands = extend(bCommands, aCommands, excludeSegment);
    }
  }

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
