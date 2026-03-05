// TO DO: This is temporarily added, and subject to change based on design decisions.
import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Defs, RadialGradient as Rg, Rect, Stop, Svg } from 'react-native-svg';
import type { SharedProps } from '@coinbase/cds-common';

import { generateEvenStops } from '../utils/generateEvenStops';
import { getAlpha } from '../utils/getAlpha';

const DEFAULT_RADIAL_CENTER = 0.5;
const DEFAULT_RADIAL_RADIUS = 0.5;

export type RadialGradientFillProps = {
  /**
   * Center x coordinate of the gradient (0-1).
   * @default 0.5
   */
  cx?: number;
  /**
   * Center y coordinate of the gradient (0-1).
   * @default 0.5
   */
  cy?: number;
  /**
   * Radius of the gradient (0-1). Used as fallback for rx and ry.
   * @default 0.5
   */
  r?: number;
  /**
   * Horizontal radius of the gradient (0-1). For elliptical gradients.
   * @default r value
   */
  rx?: number;
  /**
   * Vertical radius of the gradient (0-1). For elliptical gradients.
   * @default r value
   */
  ry?: number;
  /**
   * Focal point x coordinate (0-1).
   * @default cx value
   */
  fx?: number;
  /**
   * Focal point y coordinate (0-1).
   * @default cy value
   */
  fy?: number;
  /**
   * The relative positions of colors. Must be the same length as colors if provided.
   * Falls back to evenly distributed stops when omitted or length mismatches.
   */
  stops?: number[];
  /**
   * Colors to be distributed from center to edge.
   */
  colors: string[];
} & SharedProps;

export const RadialGradientFill = memo(
  ({
    colors,
    stops,
    cx = DEFAULT_RADIAL_CENTER,
    cy = DEFAULT_RADIAL_CENTER,
    r = DEFAULT_RADIAL_RADIUS,
    rx,
    ry,
    fx,
    fy,
    testID,
  }: RadialGradientFillProps) => {
    const resolvedStops = useMemo(() => {
      if (stops && stops.length === colors.length) return stops;
      return generateEvenStops(colors.length);
    }, [colors.length, stops]);

    if (colors.length === 0) return null;

    return (
      <View style={StyleSheet.absoluteFillObject} testID={testID}>
        <Svg height="100%" width="100%">
          <Defs>
            <Rg cx={cx} cy={cy} fx={fx} fy={fy} id="RadialGradient" r={r} rx={rx} ry={ry}>
              {colors.map((color, index) => (
                <Stop
                  key={color + String(index)}
                  offset={resolvedStops[index]}
                  stopColor={color}
                  stopOpacity={getAlpha(color)}
                />
              ))}
            </Rg>
          </Defs>
          <Rect fill="url(#RadialGradient)" height="100%" width="100%" />
        </Svg>
      </View>
    );
  },
);

RadialGradientFill.displayName = 'RadialGradientFill';
