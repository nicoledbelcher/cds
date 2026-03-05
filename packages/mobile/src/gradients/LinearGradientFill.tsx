import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Defs, LinearGradient as Lg, Rect, Stop, Svg } from 'react-native-svg';
import type { SharedProps } from '@coinbase/cds-common';

import type { LinearGradientConfig } from '../core/theme';
import { generateEvenStops } from '../utils/generateEvenStops';
import { getAlpha } from '../utils/getAlpha';

const DEFAULT_ANGLE = 180;

export type LinearGradientFillProps = LinearGradientConfig & SharedProps;

export const LinearGradientFill = memo(
  ({ colors, stops, start, end, angle = DEFAULT_ANGLE, testID }: LinearGradientFillProps) => {
    // Resolve stops: use provided stops if valid length, otherwise auto-generate
    const resolvedStops = useMemo(() => {
      if (stops && stops.length === colors.length) return stops;
      return generateEvenStops(colors.length);
    }, [colors.length, stops]);

    const coordinates = useMemo(() => {
      const anglePI = (-angle * Math.PI) / 180;
      return {
        x1: start?.x ?? Math.round(50 + Math.sin(anglePI) * 50) / 100,
        y1: start?.y ?? Math.round(50 + Math.cos(anglePI) * 50) / 100,
        x2: end?.x ?? Math.round(50 + Math.sin(anglePI + Math.PI) * 50) / 100,
        y2: end?.y ?? Math.round(50 + Math.cos(anglePI + Math.PI) * 50) / 100,
      };
    }, [angle, start?.x, start?.y, end?.x, end?.y]);

    if (colors.length === 0) return null;

    return (
      <View style={StyleSheet.absoluteFillObject} testID={testID}>
        <Svg height="100%" width="100%">
          <Defs>
            <Lg id="LinearGradient" {...coordinates}>
              {colors.map((color, index) => (
                <Stop
                  key={color + String(index)}
                  offset={resolvedStops[index]}
                  stopColor={color}
                  stopOpacity={getAlpha(color)}
                />
              ))}
            </Lg>
          </Defs>
          <Rect fill="url(#LinearGradient)" height="100%" width="100%" />
        </Svg>
      </View>
    );
  },
);

LinearGradientFill.displayName = 'LinearGradientFill';
