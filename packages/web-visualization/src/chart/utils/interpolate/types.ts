export type Point = [number, number];

export type CommandType =
  | 'M'
  | 'L'
  | 'H'
  | 'V'
  | 'C'
  | 'S'
  | 'Q'
  | 'T'
  | 'A'
  | 'Z'
  | 'm'
  | 'l'
  | 'h'
  | 'v'
  | 'c'
  | 's'
  | 'q'
  | 't'
  | 'a'
  | 'z';

export type PathCommand = {
  type: CommandType;
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  rx?: number;
  ry?: number;
  xAxisRotation?: number;
  largeArcFlag?: number;
  sweepFlag?: number;
  [key: string]: unknown;
};

export type SplitResult = {
  left: Point[];
  right: Point[];
};

export type ExcludeSegmentFn = (commandStart: PathCommand, commandEnd: PathCommand) => boolean;

export type InterpolateOptions = {
  excludeSegment?: ExcludeSegmentFn;
  snapEndsToInput?: boolean;
};
