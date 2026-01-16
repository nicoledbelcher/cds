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
import type { ActiveItem, InteractionState } from '../utils';

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
 * Basic interaction with single mode
 */
const BasicInteraction = () => {
  const [activeItem, setActiveItem] = useState<ActiveItem | undefined>(undefined);
  const theme = useTheme();

  return (
    <VStack gap={2}>
      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text font="body">
          Active: {activeItem ? `dataIndex: ${activeItem.dataIndex}` : 'Not interacting'}
        </Text>
      </Box>

      <LineChart
        showArea
        showYAxis
        height={250}
        interaction="single"
        onInteractionChange={(state) => setActiveItem(state as ActiveItem | undefined)}
        series={[{ id: 'price', data: samplePrices, color: theme.color.fgPrimary }]}
      >
        <Scrubber />
      </LineChart>
    </VStack>
  );
};

/**
 * Controlled state - programmatically set the active item
 */
const ControlledState = () => {
  const theme = useTheme();
  // null = controlled mode with no active item
  // ActiveItem = controlled mode with specific active item
  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);

  return (
    <VStack gap={2}>
      <Text color="fgMuted" font="caption">
        Use buttons to programmatically select data points. Pass null to clear without listening to
        user input.
      </Text>

      <HStack gap={1}>
        <Button compact onPress={() => setActiveItem({ dataIndex: 0, seriesId: null })}>
          First
        </Button>
        <Button compact onPress={() => setActiveItem({ dataIndex: 14, seriesId: null })}>
          Middle
        </Button>
        <Button compact onPress={() => setActiveItem({ dataIndex: 29, seriesId: null })}>
          Last
        </Button>
        <Button compact onPress={() => setActiveItem(null)} variant="secondary">
          Clear
        </Button>
      </HStack>

      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text font="body">
          Index: {activeItem?.dataIndex ?? 'none'}
          {activeItem?.dataIndex !== undefined &&
            activeItem.dataIndex !== null &&
            ` (${formatPrice(samplePrices[activeItem.dataIndex])})`}
        </Text>
      </Box>

      <LineChart
        showArea
        showYAxis
        activeItem={activeItem}
        height={250}
        interaction="single"
        series={[{ id: 'price', data: samplePrices, color: theme.color.fgPrimary }]}
      >
        <Scrubber />
      </LineChart>
    </VStack>
  );
};

/**
 * Series interaction - track which specific bar is being touched
 */
const SeriesInteraction = () => {
  const theme = useTheme();
  const [activeItem, setActiveItem] = useState<ActiveItem | undefined>(undefined);

  const handleInteractionChange = useCallback((state: InteractionState) => {
    setActiveItem(state as ActiveItem | undefined);
  }, []);

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
          {activeItem
            ? `Index: ${activeItem.dataIndex ?? 'none'}${activeItem.seriesId ? ` | Series: ${activeItem.seriesId}` : ''}`
            : 'Long-press over a bar...'}
        </Text>
      </Box>

      <BarChart
        height={250}
        interaction="single"
        interactionScope={{ dataIndex: true, series: true }}
        onInteractionChange={handleInteractionChange}
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
  const [activeItem, setActiveItem] = useState<ActiveItem | undefined>(undefined);

  const handleInteractionChange = useCallback((state: InteractionState) => {
    setActiveItem(state as ActiveItem | undefined);
  }, []);

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
          {activeItem
            ? `Index: ${activeItem.dataIndex ?? 'none'}${activeItem.seriesId ? ` | Series: ${activeItem.seriesId}` : ''}`
            : 'Long-press over a bar...'}
        </Text>
      </Box>

      <CartesianChart
        height={300}
        inset={{ top: 8, bottom: 8, left: 0, right: 0 }}
        interaction="single"
        interactionScope={{ dataIndex: true, series: true }}
        onInteractionChange={handleInteractionChange}
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
 * Synchronized interaction across multiple charts
 */
const SynchronizedCharts = () => {
  const theme = useTheme();
  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);

  const handleInteractionChange = useCallback((state: InteractionState) => {
    setActiveItem((state as ActiveItem) ?? null);
  }, []);

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
            onPress={() => setActiveItem({ dataIndex: index, seriesId: null })}
            variant={activeItem?.dataIndex === index ? 'primary' : 'secondary'}
          >
            {label}
          </Button>
        ))}
        <Button compact onPress={() => setActiveItem(null)} variant="tertiary">
          Clear
        </Button>
      </HStack>

      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text font="body">
          Highlighted index: {activeItem?.dataIndex ?? 'none'}
          {activeItem?.dataIndex !== null &&
            activeItem?.dataIndex !== undefined &&
            ` (A: ${seriesA[activeItem.dataIndex]}, B: ${seriesB[activeItem.dataIndex]})`}
        </Text>
      </Box>

      <CartesianChart
        activeItem={activeItem}
        height={200}
        interaction="single"
        onInteractionChange={handleInteractionChange}
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
        activeItem={activeItem}
        height={200}
        interaction="single"
        onInteractionChange={handleInteractionChange}
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
      <Example title="Basic Interaction (Single Mode)">
        <BasicInteraction />
      </Example>
      <Example title="Controlled State">
        <ControlledState />
      </Example>
      <Example title="Series Interaction (Bar Chart)">
        <SeriesInteraction />
      </Example>
      <Example title="Overlapping Bars Z-Order">
        <OverlappingBarsZOrder />
      </Example>
      <Example title="Synchronized Charts">
        <SynchronizedCharts />
      </Example>
      <Example title="Backwards Compatibility">
        <BackwardsCompatibility />
      </Example>
    </ExampleScreen>
  );
};

export default InteractionStories;
