import { useMemo } from 'react';
import { View } from 'react-native';
import { Line, Svg } from 'react-native-svg';
import type { ThemeVars } from '@coinbase/cds-common';

import { useTheme } from '../hooks/useTheme';

const dotDiameter = 4;
const dottedUnderlineStrokeWidth = dotDiameter / 2;
const dottedUnderlineGapLength = dotDiameter;
const dottedUnderlineDasharray: [number, number] = [0, dotDiameter];
const strokeIncrementalWidth = dotDiameter * 2;
const strokeDashOffset = (3 / 4) * dotDiameter;

export const TextUnderlineDotted = ({ width, height }: { width: number; height: number }) => {
  const color: ThemeVars.Color = 'fgMuted';
  const theme = useTheme();
  const stroke = useMemo(() => theme.color[color], [color, theme.color]);

  const roundedWidth = useMemo(() => Math.floor(width / 2) * 2, [width]);

  // alert('got width' + width + ' and rounded' + roundedWidth);

  return (
    <View
      style={{
        width,
        transform: [{ translateX: -width }, { translateY: dottedUnderlineGapLength }],
        marginStart: -width,
        backgroundColor: 'red',
      }}
    >
      <Svg height={dottedUnderlineStrokeWidth} pointerEvents="none">
        <Line
          stroke={stroke}
          strokeDasharray={dottedUnderlineDasharray}
          strokeDashoffset={strokeDashOffset}
          strokeLinecap="round"
          strokeWidth={dottedUnderlineStrokeWidth}
          x1={0}
          x2={roundedWidth}
          y1={dottedUnderlineStrokeWidth / 2}
          y2={dottedUnderlineStrokeWidth / 2}
        />
      </Svg>
    </View>
  );
};
