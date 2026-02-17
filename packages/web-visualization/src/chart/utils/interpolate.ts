export {
  interpolatePath,
  interpolatePathCommands,
  pathCommandsFromString,
} from './interpolate/interpolatePath';
export { splitCurve } from './interpolate/split';
export type {
  CommandType,
  ExcludeSegmentFn,
  InterpolateOptions,
  PathCommand,
  SplitResult,
} from './interpolate/types';
