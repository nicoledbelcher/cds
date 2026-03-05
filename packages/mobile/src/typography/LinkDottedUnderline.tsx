import React, { memo, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeSyntheticEvent, TextLayoutEventData } from 'react-native';
import { Line, Svg } from 'react-native-svg';
import type { ThemeVars } from '@coinbase/cds-common/core/theme';

import { useTheme } from '../hooks/useTheme';

import { Text, type TextProps } from './Text';

type DottedUnderlineLine = {
  key: string;
  top: number;
  width: number;
  x1: number;
  x2: number;
};

const dottedUnderlineStrokeWidth = 2;
const dottedUnderlineGapLength = 4;
const dottedUnderlineDasharray: [number, number] = [0, dottedUnderlineGapLength];
const dottedUnderlineHorizontalInset = dottedUnderlineStrokeWidth;

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingBottom: dottedUnderlineStrokeWidth,
  },
  line: {
    left: 0,
    position: 'absolute',
  },
});

const areLineMetricsEqual = (
  currentLines: DottedUnderlineLine[],
  nextLines: DottedUnderlineLine[],
) =>
  currentLines.length === nextLines.length &&
  currentLines.every((line, index) => {
    const nextLine = nextLines[index];
    if (!nextLine) return false;

    return (
      line.key === nextLine.key &&
      line.width === nextLine.width &&
      line.top === nextLine.top &&
      line.x1 === nextLine.x1 &&
      line.x2 === nextLine.x2
    );
  });

export type LinkDottedUnderlineProps = Omit<TextProps, 'underline'> & {
  color: ThemeVars.Color;
  testID?: string;
};

export const LinkDottedUnderline = memo(
  ({ children, color, onTextLayout, testID, ...props }: LinkDottedUnderlineProps) => {
    const theme = useTheme();
    const [lines, setLines] = useState<DottedUnderlineLine[]>([]);

    const stroke = useMemo(() => theme.color[color], [color, theme.color]);

    const handleTextLayout = useCallback(
      (event: NativeSyntheticEvent<TextLayoutEventData>) => {
        onTextLayout?.(event);

        const nextLines = event.nativeEvent.lines
          .filter((line) => line.width > 0)
          .map((line, index) => {
            const edgeInset = dottedUnderlineHorizontalInset / 2;
            const minX = edgeInset;
            const x1 = minX;
            const x2 = Math.max(x1, line.width - edgeInset);

            return {
              key: `${index}-${line.width}-${line.y}-${line.height}`,
              top: line.y + line.height,
              width: line.width,
              x1,
              x2,
            };
          });

        setLines((currentLines) =>
          areLineMetricsEqual(currentLines, nextLines) ? currentLines : nextLines,
        );
      },
      [onTextLayout],
    );

    return (
      <View style={styles.container}>
        <Text
          {...props}
          color={color}
          onTextLayout={handleTextLayout}
          testID={testID}
          underline={false}
        >
          {children}
        </Text>
        {lines.map((line, index) => (
          <Svg
            key={line.key}
            height={dottedUnderlineStrokeWidth}
            pointerEvents="none"
            style={[styles.line, { top: line.top }]}
            width={line.width}
          >
            <Line
              stroke={stroke}
              strokeDasharray={dottedUnderlineDasharray}
              strokeLinecap="round"
              strokeWidth={dottedUnderlineStrokeWidth}
              testID={testID ? `${testID}-dotted-underline-line-${index}` : undefined}
              x1={line.x1}
              x2={line.x2}
              y1={dottedUnderlineStrokeWidth / 2}
              y2={dottedUnderlineStrokeWidth / 2}
            />
          </Svg>
        ))}
      </View>
    );
  },
);

LinkDottedUnderline.displayName = 'LinkDottedUnderline';
