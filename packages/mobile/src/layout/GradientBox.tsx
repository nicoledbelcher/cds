import React, { forwardRef, memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Defs, LinearGradient as Lg, Rect, Stop, Svg } from 'react-native-svg';

import { Box, type BoxBaseProps, type BoxProps } from './Box';

const defaultStops = [0, 1];

function getAlpha(color: string) {
  const match = color.includes('rgba') && color.match(/,\s?([\d.]*)\)$/);
  if (match) {
    return match[1];
  }
  return '1';
}

type Coordinate = { x: number; y: number };

export type LinearGradientProps = {
  /**
   * [Optional] Start position of the gradient. By default start is calculated
   * based on the angle prop.
   */
  start?: Coordinate;
  /**
   * [Optional] End position of the gradient. By default end is calculated
   * based on the angle prop.
   * */
  end?: Coordinate;
  /**
   * The relative positions of colors. If supplied, it must be of the same length as colors.
   * @default [0, 1]
   */
  stops?: number[];
  /**
   * Colors to be distributed between start and end.
   */
  colors?: NonNullable<string>[];
  /**
   * @default false
   * Linear gradient will overlay the children content when true
   */
  elevated?: boolean;
  /**
   * Sets gradient angle.
   * @default 180
   */
  angle?: number;
};

export type GradientBoxBaseProps = BoxBaseProps & LinearGradientProps;

export type GradientBoxProps = GradientBoxBaseProps & Omit<BoxProps, keyof GradientBoxBaseProps>;

export const GradientBox = memo(
  forwardRef<View, GradientBoxProps>(
    (
      {
        start,
        end,
        stops = defaultStops,
        colors,
        elevated,
        angle = 180,
        children,
        overflow = 'hidden',
        ...boxProps
      },
      ref,
    ) => {
      const svg = useMemo(() => {
        const anglePI = (-angle * Math.PI) / 180;
        const x1 = start?.x ?? Math.round(50 + Math.sin(anglePI) * 50) / 100;
        const y1 = start?.y ?? Math.round(50 + Math.cos(anglePI) * 50) / 100;
        const x2 = end?.x ?? Math.round(50 + Math.sin(anglePI + Math.PI) * 50) / 100;
        const y2 = end?.y ?? Math.round(50 + Math.cos(anglePI + Math.PI) * 50) / 100;

        return (
          <View key="GrandientSvgContainer" style={StyleSheet.absoluteFillObject}>
            <Svg height="100%" width="100%">
              <Defs>
                <Lg id="LinearGradient" x1={x1} x2={x2} y1={y1} y2={y2}>
                  {colors?.map((color, index) => (
                    <Stop
                      key={color + String(index)}
                      offset={stops[index]}
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
      }, [colors, start, end, angle, stops]);

      const items = elevated ? [children, svg] : [svg, children];

      return (
        <Box ref={ref} overflow={overflow} {...boxProps}>
          {items}
        </Box>
      );
    },
  ),
);

GradientBox.displayName = 'GradientBox';
