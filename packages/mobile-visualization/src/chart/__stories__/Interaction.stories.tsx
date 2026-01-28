import { useCallback, useState } from 'react';
import { Button } from '@coinbase/cds-mobile/buttons';
import { Example, ExampleScreen } from '@coinbase/cds-mobile/examples/ExampleScreen';
import { useTheme } from '@coinbase/cds-mobile/hooks/useTheme';
import { Box, HStack, VStack } from '@coinbase/cds-mobile/layout';
import { Text } from '@coinbase/cds-mobile/typography';

import { XAxis, YAxis } from '../axis';
import { BarChart, BarPlot } from '../bar';
import { CartesianChart } from '../CartesianChart';
import { Line, LineChart } from '../line';
import { Scrubber } from '../scrubber';
import type { HighlightedItem } from '../utils';

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value);

// Sample data
const samplePrices = [
  45, 52, 38, 45, 60, 55, 48, 62, 58, 65, 72, 68, 75, 80, 78, 85, 90, 88, 92, 95, 100, 98, 105, 110,
  108, 115, 120, 118, 125, 130,
];

const seriesA = [3, 4, 1, 6, 5];
const seriesB = [4, 3, 1, 5, 8];
const xAxisData = ['0', '2', '5', '10', '20'];

/**
 * Basic highlighting
 */
const BasicHighlighting = () => {
  const [highlight, setHighlight] = useState<HighlightedItem[]>([]);
  const theme = useTheme();

  return (
    <VStack gap={2}>
      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text font="body">
          Active:{' '}
          {highlight.length > 0 ? `dataIndex: ${highlight[0]?.dataIndex}` : 'Not interacting'}
        </Text>
      </Box>

      <LineChart
        showArea
        showYAxis
        height={250}
        onHighlightChange={setHighlight}
        series={[{ id: 'price', data: samplePrices, color: theme.color.fgPrimary }]}
      >
        <Scrubber />
      </LineChart>
    </VStack>
  );
};

/**
 * Controlled state - programmatically set the highlighted item
 */
const ControlledState = () => {
  const theme = useTheme();
  // undefined = uncontrolled mode
  // HighlightedItem[] = controlled mode with specific highlighted items
  const [highlight, setHighlight] = useState<HighlightedItem[] | undefined>(undefined);

  return (
    <VStack gap={2}>
      <Text color="fgMuted" font="caption">
        Use buttons to programmatically select data points. Pass undefined to go back to
        uncontrolled mode.
      </Text>

      <HStack gap={1}>
        <Button compact onPress={() => setHighlight([{ dataIndex: 0, seriesId: null }])}>
          First
        </Button>
        <Button compact onPress={() => setHighlight([{ dataIndex: 14, seriesId: null }])}>
          Middle
        </Button>
        <Button compact onPress={() => setHighlight([{ dataIndex: 29, seriesId: null }])}>
          Last
        </Button>
        <Button compact onPress={() => setHighlight(undefined)} variant="secondary">
          Clear
        </Button>
      </HStack>

      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text font="body">
          Index: {highlight?.[0]?.dataIndex ?? 'none'}
          {highlight?.[0]?.dataIndex !== undefined &&
            highlight[0].dataIndex !== null &&
            ` (${formatPrice(samplePrices[highlight[0].dataIndex])})`}
        </Text>
      </Box>

      <LineChart
        showArea
        showYAxis
        height={250}
        highlight={highlight}
        series={[{ id: 'price', data: samplePrices, color: theme.color.fgPrimary }]}
      >
        <Scrubber />
      </LineChart>
    </VStack>
  );
};

/**
 * Series highlighting - track which specific bar is being touched
 */
const SeriesHighlighting = () => {
  const theme = useTheme();
  const [highlight, setHighlight] = useState<HighlightedItem[]>([]);

  const seriesColors: Record<string, string> = {
    A: theme.color.fgPrimary,
    B: theme.color.fgPositive,
    C: theme.color.fgWarning,
  };

  return (
    <VStack gap={2}>
      <Text color="fgMuted" font="caption">
        Long-press and drag over bars to see both dataIndex and seriesId tracked.
      </Text>

      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text font="body">
          {highlight.length > 0
            ? `Index: ${highlight[0]?.dataIndex ?? 'none'}${highlight[0]?.seriesId ? ` | Series: ${highlight[0].seriesId}` : ''}`
            : 'Long-press over a bar...'}
        </Text>
      </Box>

      <BarChart
        height={250}
        highlightScope={{ dataIndex: true, series: true }}
        onHighlightChange={setHighlight}
        series={[
          { id: 'A', data: seriesA, label: 'Series A', color: seriesColors.A },
          { id: 'B', data: seriesB, label: 'Series B', color: seriesColors.B },
          { id: 'C', data: [2, 5, 3, 4, 6], label: 'Series C', color: seriesColors.C },
        ]}
        xAxis={{ scaleType: 'band', data: xAxisData }}
      />

      <HStack gap={2} justifyContent="center">
        {Object.entries(seriesColors).map(([id, color]) => (
          <HStack key={id} alignItems="center" gap={0.5}>
            <Box borderRadius={1000} height={10} style={{ backgroundColor: color }} width={10} />
            <Text font="legal">Series {id}</Text>
          </HStack>
        ))}
      </HStack>
    </VStack>
  );
};

/**
 * Test overlapping bars with separate BarPlots to verify z-order behavior
 */
const OverlappingBarsZOrder = () => {
  const theme = useTheme();
  const [highlight, setHighlight] = useState<HighlightedItem[]>([]);

  const seriesColors: Record<string, string> = {
    revenue: theme.color.fgWarning,
    profitMargin: 'rgba(0, 255, 0, 0.25)',
  };

  return (
    <VStack gap={2}>
      <Text color="fgMuted" font="caption">
        Two separate BarPlots with different y-axes. The bars overlap at the same x positions. The
        second BarPlot (profitMargin/green) is rendered on top and receives touch events.
      </Text>

      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text font="body">
          {highlight.length > 0
            ? `Index: ${highlight[0]?.dataIndex ?? 'none'}${highlight[0]?.seriesId ? ` | Series: ${highlight[0].seriesId}` : ''}`
            : 'Long-press over a bar...'}
        </Text>
      </Box>

      <CartesianChart
        height={300}
        highlightScope={{ dataIndex: true, series: true }}
        inset={{ top: 8, bottom: 8, left: 0, right: 0 }}
        onHighlightChange={setHighlight}
        series={[
          {
            id: 'revenue',
            data: [455, 520, 380, 455, 285, 235],
            yAxisId: 'revenue',
            color: seriesColors.revenue,
          },
          {
            id: 'profitMargin',
            data: [23, 20, 16, 38, 12, 9],
            yAxisId: 'profitMargin',
            color: seriesColors.profitMargin,
          },
        ]}
        xAxis={{
          data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          scaleType: 'band',
        }}
        yAxis={[
          {
            id: 'revenue',
            domain: { min: 0 },
          },
          {
            id: 'profitMargin',
            domain: { min: 0, max: 100 },
          },
        ]}
      >
        <XAxis showLine showTickMarks />
        <YAxis
          showGrid
          showLine
          showTickMarks
          axisId="revenue"
          position="left"
          requestedTickCount={5}
          tickLabelFormatter={(value) => `$${value}k`}
          width={60}
        />
        <YAxis
          showLine
          showTickMarks
          axisId="profitMargin"
          position="right"
          requestedTickCount={5}
          tickLabelFormatter={(value) => `${value}%`}
        />
        {/* First BarPlot - rendered first (underneath) */}
        <BarPlot seriesIds={['revenue']} />
        {/* Second BarPlot - rendered second (on top) */}
        <BarPlot seriesIds={['profitMargin']} />
      </CartesianChart>

      <HStack gap={2} justifyContent="center">
        <HStack alignItems="center" gap={0.5}>
          <Box
            borderRadius={1000}
            height={10}
            style={{ backgroundColor: seriesColors.revenue }}
            width={10}
          />
          <Text font="legal">Revenue (underneath)</Text>
        </HStack>
        <HStack alignItems="center" gap={0.5}>
          <Box
            borderRadius={1000}
            height={10}
            style={{ backgroundColor: seriesColors.profitMargin }}
            width={10}
          />
          <Text font="legal">Profit Margin (on top)</Text>
        </HStack>
      </HStack>
    </VStack>
  );
};

/**
 * Synchronized highlighting across multiple charts
 */
const SynchronizedCharts = () => {
  const theme = useTheme();
  const [highlight, setHighlight] = useState<HighlightedItem[] | undefined>(undefined);

  return (
    <VStack gap={2}>
      <Text color="fgMuted" font="caption">
        Interact with either chart and both will highlight the same data point.
      </Text>

      <HStack gap={1}>
        {xAxisData.map((label, index) => (
          <Button
            key={index}
            compact
            onPress={() => setHighlight([{ dataIndex: index, seriesId: null }])}
            variant={highlight?.[0]?.dataIndex === index ? 'primary' : 'secondary'}
          >
            {label}
          </Button>
        ))}
        <Button compact onPress={() => setHighlight(undefined)} variant="tertiary">
          Clear
        </Button>
      </HStack>

      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text font="body">
          Highlighted index: {highlight?.[0]?.dataIndex ?? 'none'}
          {highlight?.[0]?.dataIndex !== null &&
            highlight?.[0]?.dataIndex !== undefined &&
            ` (A: ${seriesA[highlight[0].dataIndex]}, B: ${seriesB[highlight[0].dataIndex]})`}
        </Text>
      </Box>

      <CartesianChart
        height={200}
        highlight={highlight}
        onHighlightChange={setHighlight}
        series={[
          { id: 'A', data: seriesA, label: 'Series A', color: theme.color.fgPrimary },
          { id: 'B', data: seriesB, label: 'Series B', color: theme.color.fgPositive },
        ]}
        xAxis={{ scaleType: 'band', data: xAxisData }}
      >
        <YAxis />
        <XAxis />
        <BarPlot />
      </CartesianChart>

      <CartesianChart
        height={200}
        highlight={highlight}
        onHighlightChange={setHighlight}
        series={[
          { id: 'A', data: seriesA, label: 'Series A', color: theme.color.fgPrimary },
          { id: 'B', data: seriesB, label: 'Series B', color: theme.color.fgPositive },
        ]}
        xAxis={{ scaleType: 'band', data: xAxisData }}
      >
        <YAxis />
        <XAxis />
        <Line seriesId="A" />
        <Line seriesId="B" />
        <Scrubber />
      </CartesianChart>
    </VStack>
  );
};

/**
 * Highlighting disabled
 */
const HighlightingDisabled = () => {
  const theme = useTheme();

  return (
    <VStack gap={2}>
      <Text color="fgMuted" font="caption">
        Set enableHighlighting=false to disable all highlighting.
      </Text>

      <LineChart
        enableHighlighting={false}
        showArea
        showYAxis
        height={250}
        series={[{ id: 'price', data: samplePrices, color: theme.color.fgPrimary }]}
      />
    </VStack>
  );
};

/**
 * Backwards compatibility with legacy props
 */
const BackwardsCompatibility = () => {
  const theme = useTheme();
  const [scrubberPosition, setScrubberPosition] = useState<number | undefined>(undefined);

  return (
    <VStack gap={2}>
      <Text color="fgMuted" font="caption">
        Legacy enableScrubbing and onScrubberPositionChange props still work.
      </Text>

      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text font="body">Scrubber Position: {scrubberPosition ?? 'none'}</Text>
      </Box>

      <LineChart
        enableScrubbing
        showArea
        showYAxis
        height={250}
        onScrubberPositionChange={setScrubberPosition}
        series={[{ id: 'price', data: samplePrices, color: theme.color.fgPrimary }]}
      >
        <Scrubber />
      </LineChart>
    </VStack>
  );
};

const InteractionStories = () => {
  return (
    <ExampleScreen>
      <Example title="Basic Highlighting">
        <BasicHighlighting />
      </Example>
      <Example title="Controlled State">
        <ControlledState />
      </Example>
      <Example title="Series Highlighting (Bar Chart)">
        <SeriesHighlighting />
      </Example>
      <Example title="Overlapping Bars Z-Order">
        <OverlappingBarsZOrder />
      </Example>
      <Example title="Synchronized Charts">
        <SynchronizedCharts />
      </Example>
      <Example title="Highlighting Disabled">
        <HighlightingDisabled />
      </Example>
      <Example title="Backwards Compatibility">
        <BackwardsCompatibility />
      </Example>
    </ExampleScreen>
  );
};

export default InteractionStories;
